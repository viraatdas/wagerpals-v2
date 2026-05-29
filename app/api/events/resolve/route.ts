import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateNetResults, generateId } from '@/lib/utils';
import { sendPushToAllSubscribers } from '@/lib/push';
import { requireAuth } from '@/lib/auth';
import { getGroupResolver } from '@/lib/group-resolver';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { event_id, winning_side } = body;

  if (!event_id || !winning_side) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const event = await db.events.get(event_id);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const group = await db.groups.get(event.group_id);
  const isRealMoney = group && !group.is_public;

  if (isRealMoney) {
    const resolver = await getGroupResolver(event.group_id);
    if (!resolver || resolver.user_id !== authResult.userId) {
      return NextResponse.json({ error: 'Only the chosen resolver can resolve paid group events' }, { status: 403 });
    }
  } else {
    // Only group admins can resolve free/public events
    const isAdmin = await db.groupMembers.isAdmin(event.group_id, authResult.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only group admins can resolve events' }, { status: 403 });
    }
  }

  if (event.status === 'resolved') {
    return NextResponse.json({ error: 'Event already resolved' }, { status: 400 });
  }

  const bets = await db.bets.getByEvent(event_id);
  const netResults = calculateNetResults(bets, winning_side);

  // Update user totals and credit wallets for real-money groups
  for (const result of netResults) {
    const user = await db.users.get(result.user_id);
    if (user) {
      const newTotal = Math.round((user.net_total + result.net) * 100) / 100;
      const newStreak = result.net > 0 ? user.streak + 1 : 0;
      await db.users.update(result.user_id, {
        net_total: newTotal,
        streak: newStreak,
      });

      // Credit wallet for winners (return original bet + winnings)
      if (isRealMoney && result.net > 0) {
        // Find user's original bet amount
        const userBets = bets.filter(b => b.user_id === result.user_id && !b.is_late);
        const originalBet = userBets.reduce((sum, b) => sum + b.amount, 0);
        const payout = originalBet + result.net;

        await db.wallets.getOrCreate(result.user_id);
        await db.wallets.updateBalance(result.user_id, payout);

        await db.transactions.create({
          id: generateId(),
          user_id: result.user_id,
          type: 'winnings',
          amount: payout,
          status: 'completed',
          description: `Won on "${event.title}" - ${winning_side}`,
        });
      } else if (isRealMoney && result.net === 0) {
        // Push bet: return original bet amount
        const userBets = bets.filter(b => b.user_id === result.user_id && !b.is_late);
        const originalBet = userBets.reduce((sum, b) => sum + b.amount, 0);
        if (originalBet > 0) {
          await db.wallets.getOrCreate(result.user_id);
          await db.wallets.updateBalance(result.user_id, originalBet);

          await db.transactions.create({
            id: generateId(),
            user_id: result.user_id,
            type: 'bet_refund',
            amount: originalBet,
            status: 'completed',
            description: `Push on "${event.title}" - bet returned`,
          });
        }
      }
      // Losers: their money was already deducted when the bet was placed
    }
  }

  const resolved_at = Date.now();

  await db.events.update(event_id, {
    status: 'resolved',
    resolution: {
      winning_side,
      resolved_at,
    },
  });

  // Add to activity feed
  const activityData = {
    type: 'resolution' as const,
    timestamp: resolved_at,
    event_id,
    event_title: event.title,
    username: 'System',
    winning_side,
  };
  
  try {
    await db.activities.add(activityData);
  } catch (error: any) {
    console.error('[Resolve API] Failed to add to activity feed:', error);
  }

  // Send push notification
  try {
    await sendPushToAllSubscribers({
      title: '🏆 Event Resolved!',
      body: `"${event.title}" - Winner: ${winning_side}`,
      url: `/events/${event_id}`,
      eventId: event_id,
      tag: `resolution-${event_id}`,
    });
  } catch (error: any) {
    console.error('[Resolve API] Failed to send push notifications:', error);
  }

  const updatedEvent = await db.events.get(event_id);

  return NextResponse.json({
    ...updatedEvent,
    net_results: netResults,
  });
}
