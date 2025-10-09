# Database Setup Guide

## Vercel Postgres Setup

### 1. Create Postgres Database on Vercel

1. Go to your Vercel dashboard
2. Navigate to your project (`wagerpals`)
3. Click on the **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a database name (e.g., `wagerpals-db`)
7. Select a region (closest to your users)
8. Click **Create**

### 2. Get Environment Variables

After creating the database, Vercel will show you environment variables. Copy them.

### 3. Set Up Local Environment

1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and paste the environment variables from Vercel

### 4. Initialize Database Schema

Run the initialization script to create all tables:

```bash
npm run db:init
```

This will create the following tables:
- `users` - User profiles and stats
- `events` - Betting events
- `bets` - Individual bets placed by users
- `activities` - Activity feed

### 5. Deploy to Vercel

The environment variables are automatically available in your Vercel deployment. Just push your code:

```bash
git add .
git commit -m "Add Postgres database"
git push
```

Then deploy:

```bash
npx vercel --prod --yes
```

## Database Schema

### Users Table
- `id` - Unique user ID
- `username` - Unique username
- `net_total` - Total winnings/losses
- `streak` - Current winning streak
- `created_at` - Timestamp

### Events Table
- `id` - Unique event ID
- `title` - Event title
- `description` - Optional description
- `side_a` - First betting option
- `side_b` - Second betting option
- `end_time` - Deadline timestamp
- `status` - 'active' or 'resolved'
- `winning_side` - Winner (if resolved)
- `resolved_at` - Resolution timestamp
- `created_at` - Timestamp

### Bets Table
- `id` - Unique bet ID
- `event_id` - Reference to event
- `user_id` - Reference to user
- `username` - Username (denormalized)
- `side` - Chosen side
- `amount` - Bet amount
- `is_late` - Whether bet was placed after deadline
- `timestamp` - When bet was placed
- `created_at` - Timestamp

### Activities Table
- `id` - Auto-incrementing ID
- `type` - 'bet' or 'resolution'
- `event_id` - Reference to event
- `event_title` - Event title (denormalized)
- `username` - Username
- `side` - Bet side (for bets)
- `amount` - Bet amount (for bets)
- `winning_side` - Winner (for resolutions)
- `timestamp` - Activity timestamp
- `created_at` - Timestamp

## Troubleshooting

### Connection Issues

If you get connection errors, check:
1. Environment variables are correctly set in `.env.local`
2. Your IP is allowed (Vercel Postgres allows all by default)
3. Database is not paused (happens after inactivity on free tier)

### Schema Changes

If you need to modify the schema:
1. Edit `lib/schema.sql`
2. Run the init script again (it uses `IF NOT EXISTS`)
3. For breaking changes, you may need to drop tables first

### Data Persistence

✅ **Data now persists across deployments!**  
Your database is hosted on Vercel's infrastructure and is completely separate from your application code.

