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
  const activityData = {
    type: 'bet' as const,
    timestamp,
    event_id,
    event_title: event.title,
    username,
    side,
    amount: parseInt(amount),
  };
  
  console.log('[Bets API] Adding bet to activity feed:', activityData);
  
  try {
    await db.activities.add(activityData);
    console.log('[Bets API] Successfully added to activity feed');
    
    // Verify the activity was added
    const allActivities = await db.activities.getAll();
    console.log('[Bets API] Total activities in DB after insert:', allActivities.length);
    if (allActivities.length > 0) {
      console.log('[Bets API] Most recent activity:', allActivities[0]);
    }
  } catch (error: any) {
    console.error('[Bets API] Failed to add to activity feed:', error);
    console.error('[Bets API] Error message:', error.message);
    console.error('[Bets API] Error stack:', error.stack);
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

