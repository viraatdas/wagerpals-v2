import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { Event } from '@/lib/types';
import { sendPushToAllSubscribers } from '@/lib/push';
import { requireAuth, verifyUserMatch } from '@/lib/auth';
import { getGroupResolver } from '@/lib/group-resolver';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const groupId = searchParams.get('groupId');

  if (id) {
    const event = await db.events.get(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const [bets, group] = await Promise.all([
      db.bets.getByEvent(id),
      db.groups.get(event.group_id),
    ]);
    const sideStats: Record<string, { count: number; total: number }> = {
      [event.side_a]: { count: 0, total: 0 },
      [event.side_b]: { count: 0, total: 0 },
    };

    // Include all bets (including late bets) in side stats
    bets.forEach(bet => {
      sideStats[bet.side].count++;
      sideStats[bet.side].total += bet.amount;
    });
    
    // Round totals to 2 decimal places
    Object.keys(sideStats).forEach(side => {
      sideStats[side].total = Math.round(sideStats[side].total * 100) / 100;
    });

    // Count unique participants
    const uniqueParticipants = new Set(bets.map(b => b.user_id)).size;
    const resolver = group && !group.is_public ? await getGroupResolver(group.id) : null;

    return NextResponse.json({
      ...event,
      is_public: group?.is_public || false,
      resolver,
      bets,
      side_stats: sideStats,
      total_bets: bets.length,
      total_participants: uniqueParticipants,
    });
  }

  // Optimized: single query with JOINs instead of N+1
  const eventsWithStats = await db.events.getAllWithStats(groupId || undefined);
  return NextResponse.json(eventsWithStats, {
    headers: {
      'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
    },
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { title, description, side_a, side_b, end_time, group_id, creator_user_id, creator_username } = body;

  if (!title || !side_a || !side_b || !end_time || !group_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (creator_user_id) {
    const mismatch = verifyUserMatch(authResult.userId, creator_user_id);
    if (mismatch) return mismatch;
  }

  // Verify group exists and user is a member
  const group = await db.groups.get(group_id);
  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  if (creator_user_id) {
    const isMember = await db.groupMembers.isMember(group_id, creator_user_id);
    if (!isMember) {
      return NextResponse.json({ error: 'You must be a member of this group to create events' }, { status: 403 });
    }
  }

  const timestamp = Date.now();

  const newEvent: Event = {
    id: generateId(),
    title: title.trim(),
    description: description?.trim(),
    side_a: side_a.trim(),
    side_b: side_b.trim(),
    end_time: parseInt(end_time),
    group_id,
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

  // Send push notification to all subscribers
  try {
    const creatorText = creator_username ? ` by ${creator_username}` : '';
    await sendPushToAllSubscribers({
      title: '🎲 New Bet Created!',
      body: `${newEvent.title}${creatorText}`,
      url: `/events/${newEvent.id}`,
      eventId: newEvent.id,
      tag: `event-${newEvent.id}`,
    });
  } catch (error: any) {
    console.error('[Events API] Failed to send push notifications:', error);
  }

  return NextResponse.json(newEvent);
}
