import { sql } from '@vercel/postgres';
import { User, Event, Bet, ActivityItem, PushSubscription, Group, GroupMember, Comment } from './types';

export const db = {
  users: {
    get: async (id: string): Promise<User | null> => {
      const result = await sql`SELECT * FROM users WHERE id = ${id}`;
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        net_total: parseFloat(row.net_total),
        total_bet: parseFloat(row.total_bet || 0),
        streak: row.streak,
      };
    },
    
    getByUsername: async (username: string): Promise<User | null> => {
      const result = await sql`SELECT * FROM users WHERE LOWER(username) = LOWER(${username})`;
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        net_total: parseFloat(row.net_total),
        total_bet: parseFloat(row.total_bet || 0),
        streak: row.streak,
      };
    },
    
    getAll: async (): Promise<User[]> => {
      const result = await sql`SELECT * FROM users ORDER BY net_total DESC, total_bet DESC`;
      return result.rows.map(row => ({
        id: row.id,
        username: row.username,
        net_total: parseFloat(row.net_total),
        total_bet: parseFloat(row.total_bet || 0),
        streak: row.streak,
      }));
    },
    
    create: async (user: User): Promise<User> => {
      await sql`
        INSERT INTO users (id, username, net_total, total_bet, streak)
        VALUES (${user.id}, ${user.username}, ${user.net_total}, ${user.total_bet}, ${user.streak})
      `;
      return user;
    },
    
    update: async (id: string, data: Partial<User>): Promise<User | null> => {
      if (data.net_total !== undefined) {
        await sql`UPDATE users SET net_total = ${data.net_total} WHERE id = ${id}`;
      }
      if (data.total_bet !== undefined) {
        await sql`UPDATE users SET total_bet = ${data.total_bet} WHERE id = ${id}`;
      }
      if (data.streak !== undefined) {
        await sql`UPDATE users SET streak = ${data.streak} WHERE id = ${id}`;
      }
      
      return await db.users.get(id);
    },
  },
  
  events: {
    get: async (id: string): Promise<Event | null> => {
      const result = await sql`SELECT * FROM events WHERE id = ${id}`;
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      
      const event: Event = {
        id: row.id,
        title: row.title,
        description: row.description,
        side_a: row.side_a,
        side_b: row.side_b,
        end_time: parseInt(row.end_time),
        group_id: row.group_id,
        status: row.status,
      };
      
      if (row.winning_side) {
        event.resolution = {
          winning_side: row.winning_side,
          resolved_at: parseInt(row.resolved_at),
        };
      }
      
      return event;
    },
    
    getAll: async (): Promise<Event[]> => {
      const result = await sql`
        SELECT * FROM events 
        ORDER BY 
          CASE 
            WHEN status = 'active' THEN 0 
            ELSE 1 
          END,
          end_time DESC
      `;
      
      return result.rows.map(row => {
        const event: Event = {
          id: row.id,
          title: row.title,
          description: row.description,
          side_a: row.side_a,
          side_b: row.side_b,
          end_time: parseInt(row.end_time),
          group_id: row.group_id,
          status: row.status,
        };
        
        if (row.winning_side) {
          event.resolution = {
            winning_side: row.winning_side,
            resolved_at: parseInt(row.resolved_at),
          };
        }
        
        return event;
      });
    },
    
    create: async (event: Event): Promise<Event> => {
      await sql`
        INSERT INTO events (id, title, description, side_a, side_b, end_time, group_id, status)
        VALUES (
          ${event.id},
          ${event.title},
          ${event.description || null},
          ${event.side_a},
          ${event.side_b},
          ${event.end_time},
          ${event.group_id},
          ${event.status}
        )
      `;
      return event;
    },
    
    update: async (id: string, data: Partial<Event>): Promise<Event | null> => {
      if (data.status !== undefined) {
        await sql`UPDATE events SET status = ${data.status} WHERE id = ${id}`;
      }
      if (data.resolution !== undefined) {
        if (data.resolution) {
          await sql`
            UPDATE events 
            SET winning_side = ${data.resolution.winning_side}, resolved_at = ${data.resolution.resolved_at}
            WHERE id = ${id}
          `;
        } else {
          await sql`
            UPDATE events 
            SET winning_side = NULL, resolved_at = NULL
            WHERE id = ${id}
          `;
        }
      }
      
      return await db.events.get(id);
    },
    
    delete: async (id: string): Promise<void> => {
      await sql`DELETE FROM events WHERE id = ${id}`;
    },
  },
  
  bets: {
    get: async (id: string): Promise<Bet | null> => {
      const result = await sql`SELECT * FROM bets WHERE id = ${id}`;
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        event_id: row.event_id,
        user_id: row.user_id,
        username: row.username,
        side: row.side,
        amount: parseFloat(row.amount),
        note: row.note || undefined,
        is_late: row.is_late,
        timestamp: parseInt(row.timestamp),
      };
    },
    
    getByEvent: async (event_id: string): Promise<Bet[]> => {
      const result = await sql`
        SELECT * FROM bets 
        WHERE event_id = ${event_id}
        ORDER BY timestamp ASC
      `;
      return result.rows.map(row => ({
        id: row.id,
        event_id: row.event_id,
        user_id: row.user_id,
        username: row.username,
        side: row.side,
        amount: parseFloat(row.amount),
        note: row.note || undefined,
        is_late: row.is_late,
        timestamp: parseInt(row.timestamp),
      }));
    },
    
    getByUser: async (user_id: string): Promise<Bet[]> => {
      const result = await sql`
        SELECT * FROM bets 
        WHERE user_id = ${user_id}
        ORDER BY timestamp DESC
      `;
      return result.rows.map(row => ({
        id: row.id,
        event_id: row.event_id,
        user_id: row.user_id,
        username: row.username,
        side: row.side,
        amount: parseFloat(row.amount),
        note: row.note || undefined,
        is_late: row.is_late,
        timestamp: parseInt(row.timestamp),
      }));
    },
    
    getAll: async (): Promise<Bet[]> => {
      const result = await sql`SELECT * FROM bets ORDER BY timestamp DESC`;
      return result.rows.map(row => ({
        id: row.id,
        event_id: row.event_id,
        user_id: row.user_id,
        username: row.username,
        side: row.side,
        amount: parseFloat(row.amount),
        note: row.note || undefined,
        is_late: row.is_late,
        timestamp: parseInt(row.timestamp),
      }));
    },
    
    create: async (bet: Bet): Promise<Bet> => {
      await sql`
        INSERT INTO bets (id, event_id, user_id, username, side, amount, note, is_late, timestamp)
        VALUES (
          ${bet.id},
          ${bet.event_id},
          ${bet.user_id},
          ${bet.username},
          ${bet.side},
          ${bet.amount},
          ${bet.note || null},
          ${bet.is_late},
          ${bet.timestamp}
        )
      `;
      return bet;
    },
    
    delete: async (id: string): Promise<void> => {
      await sql`DELETE FROM bets WHERE id = ${id}`;
    },
  },
  
  activities: {
    getAll: async (): Promise<ActivityItem[]> => {
      const result = await sql`
        SELECT * 
        FROM activities
        ORDER BY timestamp DESC
        LIMIT 50
      `;
      
      return result.rows.map(row => ({
        type: row.type,
        event_id: row.event_id,
        event_title: row.event_title,
        user_id: row.user_id || undefined,
        username: row.username,
        side: row.side,
        amount: row.amount ? parseFloat(row.amount) : undefined,
        note: row.note || undefined,
        winning_side: row.winning_side,
        timestamp: parseInt(row.timestamp),
      }));
    },
    
    add: async (activity: ActivityItem): Promise<ActivityItem> => {
      await sql`
        INSERT INTO activities (type, event_id, event_title, user_id, username, side, amount, note, winning_side, timestamp)
        VALUES (
          ${activity.type},
          ${activity.event_id},
          ${activity.event_title},
          ${activity.user_id || null},
          ${activity.username || null},
          ${activity.side || null},
          ${activity.amount || null},
          ${activity.note || null},
          ${activity.winning_side || null},
          ${activity.timestamp}
        )
      `;
      return activity;
    },
    
    deleteByBet: async (eventId: string, username: string, side: string, amount: number, timestamp: number): Promise<void> => {
      await sql`
        DELETE FROM activities 
        WHERE type = 'bet' 
          AND event_id = ${eventId} 
          AND LOWER(username) = LOWER(${username})
          AND side = ${side}
          AND amount = ${amount}
          AND timestamp = ${timestamp}
      `;
    },
  },

  pushSubscriptions: {
    getAll: async (): Promise<PushSubscription[]> => {
      const result = await sql`SELECT * FROM push_subscriptions`;
      return result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        endpoint: row.endpoint,
        p256dh: row.p256dh,
        auth: row.auth,
      }));
    },

    getByUser: async (userId: string): Promise<PushSubscription[]> => {
      const result = await sql`
        SELECT * FROM push_subscriptions 
        WHERE user_id = ${userId}
      `;
      return result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        endpoint: row.endpoint,
        p256dh: row.p256dh,
        auth: row.auth,
      }));
    },

    create: async (subscription: PushSubscription): Promise<PushSubscription> => {
      try {
        const result = await sql`
          INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
          VALUES (${subscription.user_id || null}, ${subscription.endpoint}, ${subscription.p256dh}, ${subscription.auth})
          ON CONFLICT (endpoint) DO UPDATE 
          SET user_id = ${subscription.user_id || null}, p256dh = ${subscription.p256dh}, auth = ${subscription.auth}
          RETURNING *
        `;
        const row = result.rows[0];
        return {
          id: row.id,
          user_id: row.user_id,
          endpoint: row.endpoint,
          p256dh: row.p256dh,
          auth: row.auth,
        };
      } catch (error) {
        console.error('Error creating push subscription:', error);
        throw error;
      }
    },

    delete: async (endpoint: string): Promise<void> => {
      await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
    },
  },

  groups: {
    get: async (id: string): Promise<Group | null> => {
      const result = await sql`SELECT * FROM groups WHERE id = ${id}`;
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        created_by: row.created_by,
        created_at: row.created_at,
      };
    },

    getAll: async (): Promise<Group[]> => {
      const result = await sql`SELECT * FROM groups ORDER BY created_at DESC`;
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        created_by: row.created_by,
        created_at: row.created_at,
      }));
    },

    getByUser: async (userId: string): Promise<Group[]> => {
      const result = await sql`
        SELECT g.* FROM groups g
        INNER JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ${userId} AND gm.status = 'active'
        ORDER BY g.created_at DESC
      `;
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        created_by: row.created_by,
        created_at: row.created_at,
      }));
    },

    create: async (group: Group): Promise<Group> => {
      await sql`
        INSERT INTO groups (id, name, created_by)
        VALUES (${group.id}, ${group.name}, ${group.created_by})
      `;
      return group;
    },

    update: async (id: string, data: Partial<Group>): Promise<Group | null> => {
      if (data.name !== undefined) {
        await sql`UPDATE groups SET name = ${data.name} WHERE id = ${id}`;
      }
      return await db.groups.get(id);
    },

    delete: async (id: string): Promise<void> => {
      await sql`DELETE FROM groups WHERE id = ${id}`;
    },
  },

  groupMembers: {
    get: async (groupId: string, userId: string): Promise<GroupMember | null> => {
      const result = await sql`
        SELECT * FROM group_members 
        WHERE group_id = ${groupId} AND user_id = ${userId}
      `;
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        group_id: row.group_id,
        user_id: row.user_id,
        role: row.role,
        status: row.status,
        joined_at: row.joined_at,
      };
    },

    getByGroup: async (groupId: string): Promise<GroupMember[]> => {
      const result = await sql`
        SELECT gm.*, u.username FROM group_members gm
        INNER JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ${groupId}
        ORDER BY 
          CASE WHEN gm.role = 'admin' THEN 0 ELSE 1 END,
          gm.joined_at ASC
      `;
      return result.rows.map(row => ({
        id: row.id,
        group_id: row.group_id,
        user_id: row.user_id,
        username: row.username,
        role: row.role,
        status: row.status,
        joined_at: row.joined_at,
      }));
    },

    getPendingByGroup: async (groupId: string): Promise<GroupMember[]> => {
      const result = await sql`
        SELECT gm.*, u.username FROM group_members gm
        INNER JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ${groupId} AND gm.status = 'pending'
        ORDER BY gm.joined_at ASC
      `;
      return result.rows.map(row => ({
        id: row.id,
        group_id: row.group_id,
        user_id: row.user_id,
        username: row.username,
        role: row.role,
        status: row.status,
        joined_at: row.joined_at,
      }));
    },

    create: async (member: GroupMember): Promise<GroupMember> => {
      const result = await sql`
        INSERT INTO group_members (group_id, user_id, role, status)
        VALUES (${member.group_id}, ${member.user_id}, ${member.role}, ${member.status})
        RETURNING *
      `;
      const row = result.rows[0];
      return {
        id: row.id,
        group_id: row.group_id,
        user_id: row.user_id,
        role: row.role,
        status: row.status,
        joined_at: row.joined_at,
      };
    },

    update: async (groupId: string, userId: string, data: Partial<GroupMember>): Promise<GroupMember | null> => {
      if (data.role !== undefined) {
        await sql`
          UPDATE group_members 
          SET role = ${data.role} 
          WHERE group_id = ${groupId} AND user_id = ${userId}
        `;
      }
      if (data.status !== undefined) {
        await sql`
          UPDATE group_members 
          SET status = ${data.status} 
          WHERE group_id = ${groupId} AND user_id = ${userId}
        `;
      }
      return await db.groupMembers.get(groupId, userId);
    },

    delete: async (groupId: string, userId: string): Promise<void> => {
      await sql`
        DELETE FROM group_members 
        WHERE group_id = ${groupId} AND user_id = ${userId}
      `;
    },

    isAdmin: async (groupId: string, userId: string): Promise<boolean> => {
      const result = await sql`
        SELECT role FROM group_members 
        WHERE group_id = ${groupId} AND user_id = ${userId} AND status = 'active'
      `;
      return result.rows.length > 0 && result.rows[0].role === 'admin';
    },

    isMember: async (groupId: string, userId: string): Promise<boolean> => {
      const result = await sql`
        SELECT * FROM group_members 
        WHERE group_id = ${groupId} AND user_id = ${userId} AND status = 'active'
      `;
      return result.rows.length > 0;
    },
  },

  comments: {
    get: async (id: string): Promise<Comment | null> => {
      const result = await sql`SELECT * FROM comments WHERE id = ${id}`;
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        event_id: row.event_id,
        user_id: row.user_id,
        username: row.username,
        content: row.content,
        timestamp: parseInt(row.timestamp),
      };
    },

    getByEvent: async (eventId: string): Promise<Comment[]> => {
      const result = await sql`
        SELECT * FROM comments 
        WHERE event_id = ${eventId}
        ORDER BY timestamp ASC
      `;
      return result.rows.map(row => ({
        id: row.id,
        event_id: row.event_id,
        user_id: row.user_id,
        username: row.username,
        content: row.content,
        timestamp: parseInt(row.timestamp),
      }));
    },

    create: async (comment: Comment): Promise<Comment> => {
      await sql`
        INSERT INTO comments (id, event_id, user_id, username, content, timestamp)
        VALUES (
          ${comment.id},
          ${comment.event_id},
          ${comment.user_id},
          ${comment.username},
          ${comment.content},
          ${comment.timestamp}
        )
      `;
      return comment;
    },

    delete: async (id: string): Promise<void> => {
      await sql`DELETE FROM comments WHERE id = ${id}`;
    },
  },
};
