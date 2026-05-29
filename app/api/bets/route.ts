import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { Bet } from '@/lib/types';
import { sendPushToAllSubscribers } from '@/lib/push';
import { requireAuth, verifyUserMatch } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { event_id, user_id, username, side, amount, note } = body;

  if (!event_id || !user_id || !username || !side || amount === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const mismatch = verifyUserMatch(authResult.userId, user_id);
  if (mismatch) return mismatch;

  const event = await db.events.get(event_id);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const timestamp = Date.now();
  const isLate = timestamp > event.end_time;
  
  // Parse and round amount to 2 decimal places
  const parsedAmount = Math.round(parseFloat(amount) * 100) / 100;

  const newBet: Bet = {
    id: generateId(),
    event_id,
    user_id,
    username,
    side,
    amount: parsedAmount,
    note: note || undefined,
    timestamp,
    is_late: isLate,
  };

  // Check if this is a real-money group (non-public) and deduct from wallet
  const group = await db.groups.get(event.group_id);
  if (group && !group.is_public && !isLate) {
    const wallet = await db.wallets.getOrCreate(user_id);
    if (wallet.balance < parsedAmount) {
      return NextResponse.json({
        error: `Insufficient wallet balance. You have $${wallet.balance.toFixed(2)} but need $${parsedAmount.toFixed(2)}. Deposit funds first.`,
        balance: wallet.balance,
      }, { status: 400 });
    }

    // Atomic deduction
    const { success } = await db.wallets.deductBalance(user_id, parsedAmount);
    if (!success) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    // Record bet_placed transaction
    await db.transactions.create({
      id: generateId(),
      user_id,
      type: 'bet_placed',
      amount: -parsedAmount,
      status: 'completed',
      description: `Bet on "${side}" - ${event.title}`,
    });
  }

  await db.bets.create(newBet);

  // Update user's total_bet (only non-late bets count toward stats)
  if (!isLate) {
    const user = await db.users.get(user_id);
    if (user) {
      await db.users.update(user_id, {
        total_bet: Math.round((user.total_bet + parsedAmount) * 100) / 100,
      });
    }
  }

  // Add to activity feed
  const activityData = {
    type: 'bet' as const,
    timestamp,
    event_id,
    event_title: event.title,
    user_id,
    username,
    side,
    amount: parsedAmount,
    note: note || undefined,
  };
  
  try {
    await db.activities.add(activityData);
  } catch (error: any) {
    console.error('[Bets API] Failed to add to activity feed:', error);
  }

  // Send push notification
  try {
    const lateText = isLate ? ' (late bet)' : '';
    await sendPushToAllSubscribers({
      title: `💰 New Bet Placed${lateText}`,
      body: `${username} bet $${parsedAmount.toFixed(2)} on "${side}" - ${event.title}`,
      url: `/events/${event_id}`,
      eventId: event_id,
      tag: `bet-${newBet.id}`,
    });
  } catch (error: any) {
    console.error('[Bets API] Failed to send push notifications:', error);
  }

  return NextResponse.json(newBet);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const event_id = searchParams.get('event_id');
  const user_id = searchParams.get('user_id');

  if (event_id) {
    const bets = await db.bets.getByEvent(event_id);
    return NextResponse.json(bets);
  }

  if (user_id) {
    const bets = await db.bets.getByUser(user_id);
    return NextResponse.json(bets);
  }

  const bets = await db.bets.getAll();
  return NextResponse.json(bets);
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const bet_id = searchParams.get('id');

  if (!bet_id) {
    return NextResponse.json({ error: 'Bet ID is required' }, { status: 400 });
  }

  try {
    // Get the bet first to update user's total_bet and remove activity
    const bet = await db.bets.get(bet_id);
    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    // Only the bet owner can delete their bet
    const mismatch = verifyUserMatch(authResult.userId, bet.user_id);
    if (mismatch) return mismatch;

    // Update user's total_bet (only non-late bets count toward stats)
    if (!bet.is_late) {
      const user = await db.users.get(bet.user_id);
      if (user) {
        await db.users.update(bet.user_id, {
          total_bet: Math.max(0, Math.round((user.total_bet - bet.amount) * 100) / 100),
        });
      }
    }

    // Remove related activity entry
    try {
      await db.activities.deleteByBet(
        bet.event_id,
        bet.username,
        bet.side,
        bet.amount,
        bet.timestamp
      );
    } catch (error: any) {
      console.error('[Bets API] Failed to delete related activity:', error);
    }

    // Delete the bet
    await db.bets.delete(bet_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Bets API] Failed to delete bet:', error);
    return NextResponse.json(
      { error: 'Failed to delete bet' },
      { status: 500 }
    );
  }
}

