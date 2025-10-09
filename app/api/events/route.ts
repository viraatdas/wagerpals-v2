import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { Event } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const event = await db.events.get(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const bets = await db.bets.getByEvent(id);
    const sideStats: Record<string, { count: number; total: number }> = {
      [event.side_a]: { count: 0, total: 0 },
      [event.side_b]: { count: 0, total: 0 },
    };

    // Include all bets (including late bets) in side stats
    bets.forEach(bet => {
      sideStats[bet.side].count++;
      sideStats[bet.side].total += bet.amount;
    });

    // Count unique participants
    const uniqueParticipants = new Set(bets.map(b => b.user_id)).size;

    return NextResponse.json({
      ...event,
      bets,
      side_stats: sideStats,
      total_bets: bets.length,
      total_participants: uniqueParticipants,
    });
  }

  const events = await db.events.getAll();
  const eventsWithStats = await Promise.all(
    events.map(async event => {
      const bets = await db.bets.getByEvent(event.id);
      const sideStats: Record<string, { count: number; total: number }> = {
        [event.side_a]: { count: 0, total: 0 },
        [event.side_b]: { count: 0, total: 0 },
      };

      // Include all bets (including late bets) in side stats
      bets.forEach(bet => {
        sideStats[bet.side].count++;
        sideStats[bet.side].total += bet.amount;
      });

      // Count unique participants
      const uniqueParticipants = new Set(bets.map(b => b.user_id)).size;

      return {
        ...event,
        side_stats: sideStats,
        total_bets: bets.length,
        total_participants: uniqueParticipants,
      };
    })
  );

  return NextResponse.json(eventsWithStats);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, side_a, side_b, end_time, creator_user_id, creator_username } = body;

  if (!title || !side_a || !side_b || !end_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const timestamp = Date.now();

  const newEvent: Event = {
    id: generateId(),
    title: title.trim(),
    description: description?.trim(),
    side_a: side_a.trim(),
    side_b: side_b.trim(),
    end_time: parseInt(end_time),
    status: 'active',
  };

  await db.events.create(newEvent);

  // Add to activity feed if creator info is provided
  if (creator_username) {
    const activityData = {
      type: 'event_created' as const,
      timestamp,
      event_id: newEvent.id,
      event_title: newEvent.title,
      user_id: creator_user_id,
      username: creator_username,
    };
    
    try {
      await db.activities.add(activityData);
    } catch (error: any) {
      console.error('[Events API] Failed to add to activity feed:', error);
    }
  }

  return NextResponse.json(newEvent);
}
