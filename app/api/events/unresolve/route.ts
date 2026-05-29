import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateNetResults } from '@/lib/utils';
import { requireAuth } from '@/lib/auth';
import { getGroupResolver } from '@/lib/group-resolver';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { event_id } = body;

  if (!event_id) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  const event = await db.events.get(event_id);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const group = await db.groups.get(event.group_id);
  const isRealMoney = group && !group.is_public;

  if (isRealMoney) {
    const resolver = await getGroupResolver(event.group_id);
    if (!resolver || resolver.user_id !== authResult.userId) {
      return NextResponse.json({ error: 'Only the chosen resolver can unresolve paid group events' }, { status: 403 });
    }
  } else {
    // Only group admins can unresolve free/public events
    const isAdmin = await db.groupMembers.isAdmin(event.group_id, authResult.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only group admins can unresolve events' }, { status: 403 });
    }
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
      // Reset streak to 0 since we can't accurately restore it
      // The streak will rebuild naturally as future events resolve
      await db.users.update(result.user_id, {
        net_total: newTotal,
        streak: 0,
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
