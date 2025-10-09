import { sql } from '@vercel/postgres';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function testActivity() {
  try {
    console.log('🧪 Testing activity feed...\n');

    // Check if activities table exists and its schema
    console.log('1. Checking activities table schema...');
    const schema = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'activities'
      ORDER BY ordinal_position
    `;
    console.log('Activities table columns:');
    schema.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Count activities
    console.log('\n2. Counting activities...');
    const count = await sql`SELECT COUNT(*) as count FROM activities`;
    console.log(`Total activities: ${count.rows[0].count}`);

    // Show recent activities
    if (parseInt(count.rows[0].count) > 0) {
      console.log('\n3. Recent activities:');
      const activities = await sql`
        SELECT id, type, event_title, username, timestamp
        FROM activities
        ORDER BY timestamp DESC
        LIMIT 10
      `;
      activities.rows.forEach(activity => {
        console.log(`  - [${activity.type}] "${activity.event_title}" by @${activity.username || 'NULL'}`);
      });
    } else {
      console.log('\n⚠️  No activities found!');
      console.log('This is expected if you just cleaned the database.');
      console.log('Create a new event or place a bet to generate activities.');
    }

    // Check events, bets tables too
    console.log('\n4. Other table counts:');
    const events = await sql`SELECT COUNT(*) as count FROM events`;
    const bets = await sql`SELECT COUNT(*) as count FROM bets`;
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`  - Events: ${events.rows[0].count}`);
    console.log(`  - Bets: ${bets.rows[0].count}`);
    console.log(`  - Users: ${users.rows[0].count}`);

    console.log('\n✅ Test complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing activity:', error);
    process.exit(1);
  }
}

testActivity();

