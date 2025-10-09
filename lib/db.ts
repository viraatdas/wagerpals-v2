import { sql } from '@vercel/postgres';
import { User, Event, Bet, ActivityItem } from './types';

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
      const result = await sql`SELECT * FROM users WHERE username = ${username}`;
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
      const result = await sql`SELECT * FROM users ORDER BY net_total DESC`;
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
        INSERT INTO events (id, title, description, side_a, side_b, end_time, status)
        VALUES (
          ${event.id},
          ${event.title},
          ${event.description || null},
          ${event.side_a},
          ${event.side_b},
          ${event.end_time},
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
        is_late: row.is_late,
        timestamp: parseInt(row.timestamp),
      }));
    },
    
    create: async (bet: Bet): Promise<Bet> => {
      await sql`
        INSERT INTO bets (id, event_id, user_id, username, side, amount, is_late, timestamp)
        VALUES (
          ${bet.id},
          ${bet.event_id},
          ${bet.user_id},
          ${bet.username},
          ${bet.side},
          ${bet.amount},
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
        SELECT a.* 
        FROM activities a
        LEFT JOIN events e ON a.event_id = e.id
        ORDER BY COALESCE(e.end_time, a.timestamp) DESC, a.timestamp DESC
        LIMIT 10
      `;
      
      return result.rows.map(row => ({
        type: row.type,
        event_id: row.event_id,
        event_title: row.event_title,
        username: row.username,
        side: row.side,
        amount: row.amount ? parseFloat(row.amount) : undefined,
        winning_side: row.winning_side,
        timestamp: parseInt(row.timestamp),
      }));
    },
    
    add: async (activity: ActivityItem): Promise<ActivityItem> => {
      await sql`
        INSERT INTO activities (type, event_id, event_title, username, side, amount, winning_side, timestamp)
        VALUES (
          ${activity.type},
          ${activity.event_id},
          ${activity.event_title},
          ${activity.username || null},
          ${activity.side || null},
          ${activity.amount || null},
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
          AND username = ${username}
          AND side = ${side}
          AND amount = ${amount}
          AND timestamp = ${timestamp}
      `;
    },
  },
};
