# 🚀 Wager Pals - Database Setup Instructions

Your app is now fully migrated to **Vercel Postgres**! Follow these steps to get it running.

## Step 1: Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `wagerpals` project
3. Click on the **Storage** tab in the top navigation
4. Click **Create Database**
5. Select **Postgres**
6. Give it a name (e.g., `wagerpals-db`)
7. Select the region closest to your users
8. Click **Create**

## Step 2: Copy Environment Variables

After creating the database, Vercel will display environment variables. You'll see something like:

```env
POSTGRES_URL="postgres://default:..."
POSTGRES_PRISMA_URL="postgres://default:..."
POSTGRES_URL_NON_POOLING="postgres://default:..."
POSTGRES_USER="default"
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="verceldb"
```

### For Local Development:

1. Create a `.env.local` file in your project root:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and paste all the environment variables from Vercel

### For Production (Vercel):

The environment variables are automatically available in your Vercel deployment! No need to do anything - they're already synced.

## Step 3: Initialize Database Schema

Run this command to create all the necessary tables:

```bash
npm run db:init
```

This will create:
- ✅ `users` table
- ✅ `events` table
- ✅ `bets` table
- ✅ `activities` table

## Step 4: Test Locally

Start your development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and test the app!

## Step 5: Deploy to Production

Since the environment variables are already set in Vercel, just push and deploy:

```bash
git add .
git commit -m "Migrate to Vercel Postgres"
git push
```

Then deploy:

```bash
npx vercel --prod --yes
```

## What Changed?

### ✅ Before (In-Memory)
- Data stored in RAM
- Lost on every deployment
- Not persistent

### 🎉 Now (Postgres)
- Data stored in Vercel Postgres
- Persists across deployments
- Production-ready
- Handles concurrent users

## Troubleshooting

### "VercelPostgresError: missing_connection_string"

**Solution:** Make sure you've created `.env.local` and added the `POSTGRES_URL` from your Vercel dashboard.

### "Connection timeout" or "Cannot connect to database"

**Solution:** 
1. Check that your database isn't paused (happens after inactivity on free tier)
2. Verify all environment variables are correct
3. Try restarting your dev server

### Tables not created

**Solution:** Run `npm run db:init` again. The script uses `IF NOT EXISTS` so it's safe to run multiple times.

### Data not showing up

**Solution:** Make sure you're running the app locally with `.env.local` configured, or on Vercel with the environment variables synced.

## Database Schema Overview

```
users
  - id (TEXT, PK)
  - username (TEXT, UNIQUE)
  - net_total (DECIMAL)
  - streak (INTEGER)

events
  - id (TEXT, PK)
  - title (TEXT)
  - description (TEXT)
  - side_a (TEXT)
  - side_b (TEXT)
  - end_time (BIGINT)
  - status (TEXT: 'active' | 'resolved')
  - winning_side (TEXT, nullable)
  - resolved_at (BIGINT, nullable)

bets
  - id (TEXT, PK)
  - event_id (TEXT, FK → events)
  - user_id (TEXT, FK → users)
  - username (TEXT)
  - side (TEXT)
  - amount (DECIMAL)
  - is_late (BOOLEAN)
  - timestamp (BIGINT)

activities
  - id (SERIAL, PK)
  - type (TEXT: 'bet' | 'resolution')
  - event_id (TEXT)
  - event_title (TEXT)
  - username (TEXT)
  - side (TEXT, nullable)
  - amount (DECIMAL, nullable)
  - winning_side (TEXT, nullable)
  - timestamp (BIGINT)
```

## Need Help?

If you run into issues:
1. Check the [Vercel Postgres docs](https://vercel.com/docs/storage/vercel-postgres)
2. Verify your `.env.local` file has all variables
3. Make sure you ran `npm run db:init`

---

**That's it! Your app now has persistent database storage! 🎉**

