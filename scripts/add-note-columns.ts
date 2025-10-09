import { sql } from '@vercel/postgres';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function addNoteColumns() {
  try {
    console.log('🚀 Adding note columns to existing tables...');

    console.log('Adding note column to bets table...');
    await sql`ALTER TABLE bets ADD COLUMN IF NOT EXISTS note TEXT`;

    console.log('Adding note column to activities table...');
    await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS note TEXT`;

    console.log('✅ Migration completed successfully!');
    console.log('📊 Note columns added to bets and activities tables');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  }
}

addNoteColumns();

