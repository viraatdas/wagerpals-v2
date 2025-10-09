import { sql } from '@vercel/postgres';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function normalizeUsernames() {
  try {
    console.log('Starting username normalization...');

    // Get all users
    const usersResult = await sql`SELECT id, username FROM users`;
    console.log(`Found ${usersResult.rows.length} users`);

    // Normalize each username to lowercase
    for (const user of usersResult.rows) {
      const normalizedUsername = user.username.toLowerCase().trim();
      
      if (user.username !== normalizedUsername) {
        console.log(`Normalizing: "${user.username}" -> "${normalizedUsername}"`);
        
        // Update user table
        await sql`UPDATE users SET username = ${normalizedUsername} WHERE id = ${user.id}`;
        
        // Update bets table (denormalized username)
        await sql`UPDATE bets SET username = ${normalizedUsername} WHERE user_id = ${user.id}`;
        
        // Update activities table (denormalized username)
        await sql`UPDATE activities SET username = ${normalizedUsername} WHERE username = ${user.username}`;
      }
    }

    // Create case-insensitive index if it doesn't exist
    console.log('Creating case-insensitive index...');
    await sql`CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username))`;

    console.log('✓ Username normalization complete!');
    console.log('All usernames are now lowercase and case-insensitive lookups are enabled.');
  } catch (error) {
    console.error('Error normalizing usernames:', error);
    throw error;
  }
}

normalizeUsernames()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

