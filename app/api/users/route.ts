import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId, validateUsername, normalizeUsername, sanitizeUsername } from '@/lib/utils';
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
  const { username, id, username_selected } = body;

  console.log('[Users API] POST request:', { username, id, username_selected });

  if (!username || username.trim().length === 0) {
    console.log('[Users API] Error: Username is required');
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  // Validate username format first (for user-initiated requests)
  if (username_selected) {
    const validation = validateUsername(username);
    if (!validation.valid) {
      console.log('[Users API] Validation failed:', validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
  }

  // For auto-generated usernames (from displayName/email), sanitize to remove spaces and special chars
  let processedUsername = username.trim();
  if (!username_selected) {
    processedUsername = sanitizeUsername(processedUsername);
    console.log('[Users API] Sanitized auto-generated username:', processedUsername);
  }

  // Normalize username for storage (lowercase)
  let normalizedUsername = normalizeUsername(processedUsername);
  console.log('[Users API] Normalized username:', normalizedUsername);

  // If ID is provided (Stack Auth), use it for upsert
  if (id) {
    try {
      console.log('[Users API] Processing with ID:', id);
      // Check if user already exists by ID
      const existing = await db.users.get(id);
      if (existing) {
        console.log('[Users API] User exists:', existing.username);
        // Update username if different
        if (existing.username !== normalizedUsername) {
          console.log('[Users API] Username changed, checking availability...');
          // Check if new username is taken
          const userWithUsername = await db.users.getByUsername(normalizedUsername);
          if (userWithUsername && userWithUsername.id !== id) {
            console.log('[Users API] Username taken by another user');
            return NextResponse.json({ error: `Username "${username}" is already taken` }, { status: 400 });
          }
          console.log('[Users API] Updating username...');
          await db.users.update(id, { 
            username: normalizedUsername,
            username_selected: username_selected !== undefined ? username_selected : existing.username_selected
          } as any);
          const updated = await db.users.get(id);
          console.log('[Users API] Username updated successfully');
          return NextResponse.json(updated);
        }
        // If username is same but username_selected is being updated
        if (username_selected !== undefined && existing.username_selected !== username_selected) {
          console.log('[Users API] Updating username_selected flag...');
          await db.users.update(id, { username_selected } as any);
          const updated = await db.users.get(id);
          return NextResponse.json(updated);
        }
        console.log('[Users API] No changes needed, returning existing user');
        return NextResponse.json(existing);
      }

      console.log('[Users API] Creating new user with ID:', id);
      // Check if username is already taken before creating
      const userWithUsername = await db.users.getByUsername(normalizedUsername);
      if (userWithUsername) {
        console.log('[Users API] Username taken, generating unique username...');
        // Username taken, generate a unique one
        let uniqueUsername = normalizedUsername;
        let attempt = 1;
        while (await db.users.getByUsername(uniqueUsername)) {
          uniqueUsername = `${normalizedUsername}${attempt}`;
          attempt++;
          if (attempt > 100) {
            console.log('[Users API] Too many attempts to generate unique username');
            break; // Safety limit
          }
        }
        normalizedUsername = uniqueUsername;
        console.log('[Users API] Generated unique username:', uniqueUsername);
      }

      // Create new user with provided ID
      const newUser: User = {
        id,
        username: normalizedUsername,
        username_selected: username_selected !== undefined ? username_selected : false,
        net_total: 0,
        total_bet: 0,
        streak: 0,
      };

      console.log('[Users API] Creating user:', newUser);
      await db.users.create(newUser);

      // Send push notification for new user only if username was selected
      if (username_selected) {
        console.log('[Users API] Sending push notification for new user');
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
      }

      console.log('[Users API] User created successfully');
      return NextResponse.json(newUser);
    } catch (error: any) {
      console.error('[Users API] Error creating/updating user:', error);
      console.error('[Users API] Error details:', error.message, error.stack);
      return NextResponse.json({ error: `Failed to create user: ${error.message}` }, { status: 500 });
    }
  }

  // Legacy: No ID provided, generate one (for backwards compatibility)
  const validation = validateUsername(username);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

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

  return NextResponse.json(newUser);
}

