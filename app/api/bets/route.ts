import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { Bet } from '@/lib/types';

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

  const newBet: Bet = {
    id: generateId(),
    event_id,
    user_id,
    username,
    side,
    amount: parseInt(amount),
    timestamp,
    is_late: isLate,
  };

  await db.bets.create(newBet);

  // Add to activity feed
  console.log('[Bets API] Adding bet to activity feed:', {
    type: 'bet',
    event_id,
    event_title: event.title,
    username,
    side,
    amount: parseInt(amount),
  });
  
  try {
    await db.activities.add({
      type: 'bet',
      timestamp,
      event_id,
      event_title: event.title,
      username,
      side,
      amount: parseInt(amount),
    });
    console.log('[Bets API] Successfully added to activity feed');
  } catch (error) {
    console.error('[Bets API] Failed to add to activity feed:', error);
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

