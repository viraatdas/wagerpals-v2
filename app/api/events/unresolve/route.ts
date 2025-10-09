import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateNetResults } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { event_id } = body;

  if (!event_id) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  const event = db.events.get(event_id);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  if (event.status !== 'resolved' || !event.resolution) {
    return NextResponse.json({ error: 'Event is not resolved' }, { status: 400 });
  }

  // Reverse the user stat changes
  const bets = db.bets.getByEvent(event_id);
  const netResults = calculateNetResults(bets, event.resolution.winning_side);

  netResults.forEach(result => {
    const user = db.users.get(result.user_id);
    if (user) {
      // Reverse the net total change
      const newTotal = user.net_total - result.net;
      // Reverse streak (approximation - we can't perfectly restore it)
      const newStreak = result.net > 0 && user.streak > 0 ? user.streak - 1 : user.streak;
      db.users.update(result.user_id, {
        net_total: newTotal,
        streak: newStreak >= 0 ? newStreak : 0,
      });
    }
  });

  // Remove resolution
  db.events.update(event_id, {
    status: 'active',
    resolution: undefined,
  });

  return NextResponse.json({
    ...event,
    status: 'active',
    resolution: undefined,
  });
}

