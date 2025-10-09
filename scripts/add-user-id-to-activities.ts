import { sql } from '@vercel/postgres';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function addUserIdToActivities() {
  try {
    console.log('🚀 Adding user_id column to activities table...');

    console.log('Adding user_id column...');
    await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id)`;

    console.log('Creating index on user_id...');
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id)`;

    console.log('✅ Migration completed successfully!');
    console.log('📊 user_id column added to activities table with foreign key reference to users');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  }
}

addUserIdToActivities();

