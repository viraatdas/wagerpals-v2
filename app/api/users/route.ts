import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId, validateUsername, normalizeUsername } from '@/lib/utils';
import { User } from '@/lib/types';
import { sendPushToAllSubscribers } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const id = searchParams.get('id');

  if (username) {
    const user = await db.users.getByUsername(username);
    if (user) {
      return NextResponse.json(user);
    }
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (id) {
    const user = await db.users.get(id);
    if (user) {
      return NextResponse.json(user);
    }
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const users = await db.users.getAll();
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username } = body;

  if (!username || username.trim().length === 0) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  // Validate username format
  const validation = validateUsername(username);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Normalize username for storage (lowercase)
  const normalizedUsername = normalizeUsername(username);

  // Check if user already exists (case-insensitive)
  const existing = await db.users.getByUsername(normalizedUsername);
  if (existing) {
    return NextResponse.json(existing);
  }

  const newUser: User = {
    id: generateId(),
    username: normalizedUsername,
    net_total: 0,
    total_bet: 0,
    streak: 0,
  };

  await db.users.create(newUser);

  // Send push notification for new user
  try {
    await sendPushToAllSubscribers({
      title: '👋 New User Joined!',
      body: `${normalizedUsername} just joined WagerPals!`,
      url: '/users',
      tag: `user-${newUser.id}`,
    });
  } catch (error: any) {
    console.error('[Users API] Failed to send push notifications:', error);
  }

  return NextResponse.json(newUser);
}

