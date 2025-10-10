import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, group_id, user_id, target_user_id, admin_user_id } = body;

  if (!action || !group_id || !admin_user_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify admin status
  const isAdmin = await db.groupMembers.isAdmin(group_id, admin_user_id);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Only admins can manage members' }, { status: 403 });
  }

  switch (action) {
    case 'approve':
      if (!target_user_id) {
        return NextResponse.json({ error: 'Missing target_user_id' }, { status: 400 });
      }
      await db.groupMembers.update(group_id, target_user_id, { status: 'active' });
      return NextResponse.json({ message: 'Member approved' });

    case 'decline':
      if (!target_user_id) {
        return NextResponse.json({ error: 'Missing target_user_id' }, { status: 400 });
      }
      await db.groupMembers.delete(group_id, target_user_id);
      return NextResponse.json({ message: 'Join request declined' });

    case 'promote':
      if (!target_user_id) {
        return NextResponse.json({ error: 'Missing target_user_id' }, { status: 400 });
      }
      await db.groupMembers.update(group_id, target_user_id, { role: 'admin' });
      return NextResponse.json({ message: 'Member promoted to admin' });

    case 'demote':
      if (!target_user_id) {
        return NextResponse.json({ error: 'Missing target_user_id' }, { status: 400 });
      }
      await db.groupMembers.update(group_id, target_user_id, { role: 'member' });
      return NextResponse.json({ message: 'Admin demoted to member' });

    case 'remove':
      if (!target_user_id) {
        return NextResponse.json({ error: 'Missing target_user_id' }, { status: 400 });
      }
      await db.groupMembers.delete(group_id, target_user_id);
      return NextResponse.json({ message: 'Member removed' });

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  if (!groupId) {
    return NextResponse.json({ error: 'Missing groupId parameter' }, { status: 400 });
  }

  const members = await db.groupMembers.getByGroup(groupId);
  return NextResponse.json(members);
}

