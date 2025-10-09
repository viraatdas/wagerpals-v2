import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { Event } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const event = db.events.get(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const bets = db.bets.getByEvent(id);
    const sideStats: Record<string, { count: number; total: number }> = {};

    event.sides.forEach(side => {
      sideStats[side] = { count: 0, total: 0 };
    });

    bets.forEach(bet => {
      if (!bet.is_late) {
        sideStats[bet.side].count++;
        sideStats[bet.side].total += bet.amount;
      }
    });

    // Count unique participants (including late bets)
    const uniqueParticipants = new Set(bets.map(b => b.user_id)).size;

    return NextResponse.json({
      ...event,
      bets,
      side_stats: sideStats,
      total_bets: bets.filter(b => !b.is_late).length,
      total_participants: uniqueParticipants,
    });
  }

  const events = db.events.getAll();
  const eventsWithStats = events.map(event => {
    const bets = db.bets.getByEvent(event.id);
    const sideStats: Record<string, { count: number; total: number }> = {};

    event.sides.forEach(side => {
      sideStats[side] = { count: 0, total: 0 };
    });

    bets.forEach(bet => {
      if (!bet.is_late) {
        sideStats[bet.side].count++;
        sideStats[bet.side].total += bet.amount;
      }
    });

    // Count unique participants (including late bets)
    const uniqueParticipants = new Set(bets.map(b => b.user_id)).size;

    return {
      ...event,
      side_stats: sideStats,
      total_bets: bets.filter(b => !b.is_late).length,
      total_participants: uniqueParticipants,
    };
  });

  return NextResponse.json(eventsWithStats);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, sides, end_time, created_by } = body;

  if (!title || !sides || !end_time || !created_by) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const newEvent: Event = {
    id: generateId(),
    title: title.trim(),
    sides: sides.map((s: string) => s.trim()),
    end_time: parseInt(end_time),
    created_at: Date.now(),
    created_by,
    status: 'active',
  };

  db.events.create(newEvent);
  return NextResponse.json(newEvent);
}

