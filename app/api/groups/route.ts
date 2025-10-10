import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Group } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Generate a random 6-digit group ID
function generateGroupId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const groupId = searchParams.get('id');

  // Get specific group
  if (groupId) {
    const group = await db.groups.get(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get members
    const members = await db.groupMembers.getByGroup(groupId);
    const pendingRequests = await db.groupMembers.getPendingByGroup(groupId);

    return NextResponse.json({
      ...group,
      members: members.filter(m => m.status === 'active'),
      pending_requests: pendingRequests,
      member_count: members.filter(m => m.status === 'active').length,
      admin_count: members.filter(m => m.status === 'active' && m.role === 'admin').length,
    });
  }

  // Get groups for user
  if (userId) {
    const groups = await db.groups.getByUser(userId);
    
    // Get member info for each group
    const groupsWithInfo = await Promise.all(
      groups.map(async (group) => {
        const members = await db.groupMembers.getByGroup(group.id);
        const activeMembers = members.filter(m => m.status === 'active');
        const userMembership = members.find(m => m.user_id === userId);
        
        return {
          ...group,
          member_count: activeMembers.length,
          admin_count: activeMembers.filter(m => m.role === 'admin').length,
          user_role: userMembership?.role || 'member',
          is_admin: userMembership?.role === 'admin',
        };
      })
    );

    return NextResponse.json(groupsWithInfo);
  }

  return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, created_by } = body;

  if (!name || !created_by) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Generate unique group ID
  let groupId = generateGroupId();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await db.groups.get(groupId);
    if (!existing) break;
    groupId = generateGroupId();
    attempts++;
  }

  if (attempts >= 10) {
    return NextResponse.json({ error: 'Failed to generate unique group ID' }, { status: 500 });
  }

  const newGroup: Group = {
    id: groupId,
    name: name.trim(),
    created_by,
  };

  await db.groups.create(newGroup);

  // Add creator as admin with active status
  await db.groupMembers.create({
    group_id: groupId,
    user_id: created_by,
    role: 'admin',
    status: 'active',
  });

  return NextResponse.json(newGroup);
}

