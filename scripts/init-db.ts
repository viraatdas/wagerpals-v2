import { sql } from '@vercel/postgres';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function initDatabase() {
  try {
    console.log('🚀 Initializing database...');

    // Create tables in order
    console.log('Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        net_total DECIMAL(10,2) DEFAULT 0,
        streak INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Creating events table...');
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        side_a TEXT NOT NULL,
        side_b TEXT NOT NULL,
        end_time BIGINT NOT NULL,
        status TEXT DEFAULT 'active',
        winning_side TEXT,
        resolved_at BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Creating bets table...');
    await sql`
      CREATE TABLE IF NOT EXISTS bets (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id),
        username TEXT NOT NULL,
        side TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        note TEXT,
        is_late BOOLEAN DEFAULT FALSE,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Creating activities table...');
    await sql`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        event_id TEXT NOT NULL,
        event_title TEXT NOT NULL,
        user_id TEXT REFERENCES users(id),
        username TEXT,
        side TEXT,
        amount DECIMAL(10,2),
        note TEXT,
        winning_side TEXT,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_bets_event_id ON bets(event_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)`;

    console.log('✅ Database initialized successfully!');
    console.log('📊 Tables created: users, events, bets, activities');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();

