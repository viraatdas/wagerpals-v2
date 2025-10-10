import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { Bet } from '@/lib/types';
import { sendPushToAllSubscribers } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { event_id, user_id, username, side, amount, note } = body;

  if (!event_id || !user_id || !username || !side || amount === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

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

  await db.bets.create(newBet);

  // Update user's total_bet (including late bets)
  const user = await db.users.get(user_id);
  if (user) {
    await db.users.update(user_id, {
      total_bet: Math.round((user.total_bet + parsedAmount) * 100) / 100,
    });
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

    // Update user's total_bet (including late bets)
    const user = await db.users.get(bet.user_id);
    if (user) {
      await db.users.update(bet.user_id, {
        total_bet: Math.max(0, Math.round((user.total_bet - bet.amount) * 100) / 100),
      });
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

