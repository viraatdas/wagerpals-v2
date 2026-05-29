import { sql } from '@vercel/postgres';
import { User, Event, Bet, ActivityItem, PushSubscription, Group, GroupMember, Comment, Wallet, Transaction } from './types';

export const db = {
  users: {
    get: async (id: string): Promise<User | null> => {
      const result = await sql`SELECT * FROM users WHERE id = ${id}`;
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        username_selected: row.username_selected || false,
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
        username_selected: row.username_selected || false,
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
        username_selected: row.username_selected || false,
        net_total: parseFloat(row.net_total),
        total_bet: parseFloat(row.total_bet || 0),
        streak: row.streak,
      }));
    },
    
    create: async (user: User): Promise<User> => {
      await sql`
        INSERT INTO users (id, username, username_selected, net_total, total_bet, streak)
        VALUES (${user.id}, ${user.username}, ${user.username_selected || true}, ${user.net_total}, ${user.total_bet}, ${user.streak})
      `;
      return user;
    },
    
    update: async (id: string, data: Partial<User>): Promise<User | null> => {
      if (data.username !== undefined) {
        await sql`UPDATE users SET username = ${data.username} WHERE id = ${id}`;
      }
      if (data.net_total !== undefined) {
        await sql`UPDATE users SET net_total = ${data.net_total} WHERE id = ${id}`;
      }
      if (data.total_bet !== undefined) {
        await sql`UPDATE users SET total_bet = ${data.total_bet} WHERE id = ${id}`;
      }
      if (data.streak !== undefined) {
        await sql`UPDATE users SET streak = ${data.streak} WHERE id = ${id}`;
      }
      if (data.username_selected !== undefined) {
        await sql`UPDATE users SET username_selected = ${data.username_selected} WHERE id = ${id}`;
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

    // Optimized: get all events with bet stats in a single query (fixes N+1)
    getAllWithStats: async (groupId?: string): Promise<any[]> => {
      const result = groupId
        ? await sql`
            SELECT
              e.*,
              COALESCE(COUNT(b.id), 0)::int as total_bets,
              COALESCE(COUNT(DISTINCT b.user_id), 0)::int as total_participants,
              COALESCE(SUM(CASE WHEN b.side = e.side_a THEN 1 ELSE 0 END), 0)::int as side_a_count,
              COALESCE(SUM(CASE WHEN b.side = e.side_a THEN b.amount ELSE 0 END), 0)::numeric as side_a_total,
              COALESCE(SUM(CASE WHEN b.side = e.side_b THEN 1 ELSE 0 END), 0)::int as side_b_count,
              COALESCE(SUM(CASE WHEN b.side = e.side_b THEN b.amount ELSE 0 END), 0)::numeric as side_b_total
            FROM events e
            LEFT JOIN bets b ON e.id = b.event_id
            WHERE e.group_id = ${groupId}
            GROUP BY e.id
            ORDER BY
              CASE WHEN e.status = 'active' THEN 0 ELSE 1 END,
              e.end_time DESC
          `
        : await sql`
            SELECT
              e.*,
              COALESCE(COUNT(b.id), 0)::int as total_bets,
              COALESCE(COUNT(DISTINCT b.user_id), 0)::int as total_participants,
              COALESCE(SUM(CASE WHEN b.side = e.side_a THEN 1 ELSE 0 END), 0)::int as side_a_count,
              COALESCE(SUM(CASE WHEN b.side = e.side_a THEN b.amount ELSE 0 END), 0)::numeric as side_a_total,
              COALESCE(SUM(CASE WHEN b.side = e.side_b THEN 1 ELSE 0 END), 0)::int as side_b_count,
              COALESCE(SUM(CASE WHEN b.side = e.side_b THEN b.amount ELSE 0 END), 0)::numeric as side_b_total
            FROM events e
            LEFT JOIN bets b ON e.id = b.event_id
            GROUP BY e.id
            ORDER BY
              CASE WHEN e.status = 'active' THEN 0 ELSE 1 END,
              e.end_time DESC
          `;

      return result.rows.map(row => {
        const event: any = {
          id: row.id,
          title: row.title,
          description: row.description,
          side_a: row.side_a,
          side_b: row.side_b,
          end_time: parseInt(row.end_time),
          group_id: row.group_id,
          status: row.status,
          side_stats: {
            [row.side_a]: { count: parseInt(row.side_a_count), total: Math.round(parseFloat(row.side_a_total) * 100) / 100 },
            [row.side_b]: { count: parseInt(row.side_b_count), total: Math.round(parseFloat(row.side_b_total) * 100) / 100 },
          },
          total_bets: parseInt(row.total_bets),
          total_participants: parseInt(row.total_participants),
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

    getByUserGroups: async (userId: string, limit: number = 50, offset: number = 0): Promise<ActivityItem[]> => {
      const result = await sql`
        SELECT
          a.*,
          e.group_id,
          g.name as group_name
        FROM activities a
        INNER JOIN events e ON a.event_id = e.id
        INNER JOIN groups g ON e.group_id = g.id
        INNER JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ${userId}
          AND gm.status = 'active'
        ORDER BY a.timestamp DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      return result.rows.map(row => ({
        type: row.type,
        event_id: row.event_id,
        event_title: row.event_title,
        group_id: row.group_id,
        group_name: row.group_name,
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
        expo_token: row.expo_token,
        platform: row.platform,
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
        expo_token: row.expo_token,
        platform: row.platform,
      }));
    },

    getByUserId: async (userId: string): Promise<PushSubscription[]> => {
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
        expo_token: row.expo_token,
        platform: row.platform,
      }));
    },

    create: async (subscription: PushSubscription): Promise<PushSubscription> => {
      try {
        const result = await sql`
          INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, expo_token, platform)
          VALUES (
            ${subscription.user_id || null}, 
            ${subscription.endpoint}, 
            ${subscription.p256dh || null}, 
            ${subscription.auth || null},
            ${subscription.expo_token || null},
            ${subscription.platform || 'web'}
          )
          ON CONFLICT (endpoint) DO UPDATE 
          SET user_id = ${subscription.user_id || null}, 
              p256dh = ${subscription.p256dh || null}, 
              auth = ${subscription.auth || null},
              expo_token = ${subscription.expo_token || null},
              platform = ${subscription.platform || 'web'}
          RETURNING *
        `;
        const row = result.rows[0];
        return {
          id: row.id,
          user_id: row.user_id,
          endpoint: row.endpoint,
          p256dh: row.p256dh,
          auth: row.auth,
          expo_token: row.expo_token,
          platform: row.platform,
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
        resolver_user_id: row.resolver_user_id || undefined,
        is_public: row.is_public || false,
        created_at: row.created_at,
      };
    },

    getAll: async (): Promise<Group[]> => {
      const result = await sql`SELECT * FROM groups ORDER BY created_at DESC`;
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        created_by: row.created_by,
        resolver_user_id: row.resolver_user_id || undefined,
        is_public: row.is_public || false,
        created_at: row.created_at,
      }));
    },

    getPublic: async (): Promise<Group[]> => {
      const result = await sql`
        SELECT * FROM groups 
        WHERE is_public = TRUE 
        ORDER BY created_at DESC
      `;
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        created_by: row.created_by,
        resolver_user_id: row.resolver_user_id || undefined,
        is_public: row.is_public || false,
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
        resolver_user_id: row.resolver_user_id || undefined,
        is_public: row.is_public || false,
        created_at: row.created_at,
      }));
    },

    create: async (group: Group): Promise<Group> => {
      await sql`
        INSERT INTO groups (id, name, created_by, resolver_user_id, is_public)
        VALUES (${group.id}, ${group.name}, ${group.created_by}, ${group.resolver_user_id || group.created_by}, ${group.is_public || false})
      `;
      return group;
    },

    update: async (id: string, data: Partial<Group>): Promise<Group | null> => {
      if (data.name !== undefined) {
        await sql`UPDATE groups SET name = ${data.name} WHERE id = ${id}`;
      }
      if (data.resolver_user_id !== undefined) {
        await sql`UPDATE groups SET resolver_user_id = ${data.resolver_user_id} WHERE id = ${id}`;
      }
      if (data.is_public !== undefined) {
        await sql`UPDATE groups SET is_public = ${data.is_public} WHERE id = ${id}`;
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

  wallets: {
    get: async (userId: string): Promise<Wallet | null> => {
      const result = await sql`SELECT * FROM wallets WHERE user_id = ${userId}`;
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        user_id: row.user_id,
        balance: parseFloat(row.balance),
        currency: row.currency,
        updated_at: row.updated_at,
      };
    },

    getOrCreate: async (userId: string): Promise<Wallet> => {
      const existing = await db.wallets.get(userId);
      if (existing) return existing;

      await sql`
        INSERT INTO wallets (user_id, balance, currency)
        VALUES (${userId}, 0, 'usd')
        ON CONFLICT (user_id) DO NOTHING
      `;
      const wallet = await db.wallets.get(userId);
      return wallet!;
    },

    updateBalance: async (userId: string, amount: number): Promise<Wallet | null> => {
      await sql`
        UPDATE wallets
        SET balance = balance + ${amount}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
      `;
      return await db.wallets.get(userId);
    },

    deductBalance: async (userId: string, amount: number): Promise<{ success: boolean; wallet: Wallet | null }> => {
      // Atomic deduction with balance check to prevent overdraft
      const result = await sql`
        UPDATE wallets
        SET balance = balance - ${amount}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId} AND balance >= ${amount}
        RETURNING *
      `;
      if (result.rows.length === 0) {
        const wallet = await db.wallets.get(userId);
        return { success: false, wallet };
      }
      const row = result.rows[0];
      return {
        success: true,
        wallet: {
          user_id: row.user_id,
          balance: parseFloat(row.balance),
          currency: row.currency,
          updated_at: row.updated_at,
        },
      };
    },
  },

  transactions: {
    get: async (id: string): Promise<Transaction | null> => {
      const result = await sql`SELECT * FROM transactions WHERE id = ${id}`;
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        amount: parseFloat(row.amount),
        status: row.status,
        stripe_payment_intent_id: row.stripe_payment_intent_id || undefined,
        description: row.description || undefined,
        created_at: row.created_at,
      };
    },

    getByUser: async (userId: string, limit: number = 50, offset: number = 0): Promise<Transaction[]> => {
      const result = await sql`
        SELECT * FROM transactions
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      return result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        amount: parseFloat(row.amount),
        status: row.status,
        stripe_payment_intent_id: row.stripe_payment_intent_id || undefined,
        description: row.description || undefined,
        created_at: row.created_at,
      }));
    },

    create: async (transaction: Transaction): Promise<Transaction> => {
      await sql`
        INSERT INTO transactions (id, user_id, type, amount, status, stripe_payment_intent_id, description)
        VALUES (
          ${transaction.id},
          ${transaction.user_id},
          ${transaction.type},
          ${transaction.amount},
          ${transaction.status},
          ${transaction.stripe_payment_intent_id || null},
          ${transaction.description || null}
        )
      `;
      return transaction;
    },

    updateStatus: async (id: string, status: string): Promise<void> => {
      await sql`UPDATE transactions SET status = ${status} WHERE id = ${id}`;
    },

    getByStripeId: async (stripeId: string): Promise<Transaction | null> => {
      const result = await sql`
        SELECT * FROM transactions WHERE stripe_payment_intent_id = ${stripeId}
      `;
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        amount: parseFloat(row.amount),
        status: row.status,
        stripe_payment_intent_id: row.stripe_payment_intent_id || undefined,
        description: row.description || undefined,
        created_at: row.created_at,
      };
    },
  },
};
