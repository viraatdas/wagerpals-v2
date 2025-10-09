import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { User } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const id = searchParams.get('id');

  if (username) {
    const user = db.users.getByUsername(username);
    if (user) {
      return NextResponse.json(user);
    }
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (id) {
    const user = db.users.get(id);
    if (user) {
      return NextResponse.json(user);
    }
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(db.users.getAll());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username } = body;

  if (!username || username.trim().length === 0) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  const existing = db.users.getByUsername(username);
  if (existing) {
    return NextResponse.json(existing);
  }

  const newUser: User = {
    id: generateId(),
    username: username.trim(),
    created_at: Date.now(),
    events_joined: 0,
    net_total: 0,
    streak: 0,
  };

  db.users.create(newUser);
  return NextResponse.json(newUser);
}

