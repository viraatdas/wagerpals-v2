import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { Bet } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { event_id, user_id, username, side, amount, note } = body;

  if (!event_id || !user_id || !username || !side || amount === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const event = db.events.get(event_id);
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
    note: note?.trim(),
    timestamp,
    is_late: isLate,
  };

  db.bets.create(newBet);

  // Add to activity feed
  db.activities.add({
    id: generateId(),
    type: 'bet',
    timestamp,
    event_id,
    event_title: event.title,
    username,
    side,
    amount: parseInt(amount),
  });

  // Update user stats
  const user = db.users.get(user_id);
  if (user && !isLate) {
    db.users.update(user_id, {
      events_joined: user.events_joined + 1,
    });
  }

  return NextResponse.json(newBet);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const event_id = searchParams.get('event_id');
  const user_id = searchParams.get('user_id');

  if (event_id) {
    return NextResponse.json(db.bets.getByEvent(event_id));
  }

  if (user_id) {
    return NextResponse.json(db.bets.getByUser(user_id));
  }

  return NextResponse.json(db.bets.getAll());
}

