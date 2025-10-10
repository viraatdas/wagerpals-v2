import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateNetResults } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { event_id } = body;

  if (!event_id) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  const event = await db.events.get(event_id);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  if (event.status !== 'resolved' || !event.resolution) {
    return NextResponse.json({ error: 'Event is not resolved' }, { status: 400 });
  }

  // Reverse the user stat changes
  const bets = await db.bets.getByEvent(event_id);
  const netResults = calculateNetResults(bets, event.resolution.winning_side);

  for (const result of netResults) {
    const user = await db.users.get(result.user_id);
    if (user) {
      // Reverse the net total change
      const newTotal = Math.round((user.net_total - result.net) * 100) / 100;
      // Reverse streak (approximation - we can't perfectly restore it)
      const newStreak = result.net > 0 && user.streak > 0 ? user.streak - 1 : user.streak;
      await db.users.update(result.user_id, {
        net_total: newTotal,
        streak: newStreak >= 0 ? newStreak : 0,
      });
    }
  }

  // Remove resolution
  await db.events.update(event_id, {
    status: 'active',
    resolution: undefined,
  });

  const updatedEvent = await db.events.get(event_id);

  return NextResponse.json(updatedEvent);
}
