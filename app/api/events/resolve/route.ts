import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateNetResults, generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { event_id, winning_side, note, resolved_by } = body;

  if (!event_id || !winning_side || !resolved_by) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const event = db.events.get(event_id);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  if (event.status === 'resolved') {
    return NextResponse.json({ error: 'Event already resolved' }, { status: 400 });
  }

  const bets = db.bets.getByEvent(event_id);
  const netResults = calculateNetResults(bets, winning_side);

  // Update user totals
  netResults.forEach(result => {
    const user = db.users.get(result.user_id);
    if (user) {
      const newTotal = user.net_total + result.net;
      const newStreak = result.net > 0 ? user.streak + 1 : 0;
      db.users.update(result.user_id, {
        net_total: newTotal,
        streak: newStreak,
      });
    }
  });

  const resolution = {
    winning_side,
    note: note?.trim(),
    resolved_at: Date.now(),
    resolved_by,
  };

  db.events.update(event_id, {
    status: 'resolved',
    resolution,
  });

  // Add to activity feed
  const summaryParts = netResults
    .filter(r => Math.abs(r.net) > 0)
    .sort((a, b) => b.net - a.net)
    .slice(0, 3)
    .map(r => `@${r.username} ${r.net > 0 ? '+' : ''}${r.net}`);

  db.activities.add({
    id: generateId(),
    type: 'resolution',
    timestamp: Date.now(),
    event_id,
    event_title: event.title,
    resolution_summary: `${winning_side} — ${summaryParts.join(', ')}`,
  });

  return NextResponse.json({
    ...event,
    resolution,
    status: 'resolved',
    net_results: netResults,
  });
}

