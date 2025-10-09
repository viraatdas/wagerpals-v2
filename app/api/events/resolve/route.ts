import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateNetResults } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { event_id, winning_side } = body;

  if (!event_id || !winning_side) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const event = await db.events.get(event_id);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  if (event.status === 'resolved') {
    return NextResponse.json({ error: 'Event already resolved' }, { status: 400 });
  }

  const bets = await db.bets.getByEvent(event_id);
  const netResults = calculateNetResults(bets, winning_side);

  // Update user totals
  for (const result of netResults) {
    const user = await db.users.get(result.user_id);
    if (user) {
      const newTotal = user.net_total + result.net;
      const newStreak = result.net > 0 ? user.streak + 1 : 0;
      await db.users.update(result.user_id, {
        net_total: newTotal,
        streak: newStreak,
      });
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

  const updatedEvent = await db.events.get(event_id);

  return NextResponse.json({
    ...updatedEvent,
    net_results: netResults,
  });
}
