# Wager Pals

A social ledger for bets. There are witnesses and all viewable among your friends.

## Features

- 🎯 **Create Events**: Set up prediction events with custom sides and deadlines
- 💰 **Place Bets**: Join events by picking a side and wagering an amount
- 📊 **Live Ledger**: See all participants and their predictions in real-time
- 🏆 **Event Resolution**: Resolve events and see net results & payment breakdowns
- 📱 **Activity Feed**: Follow all bets and resolutions across the platform (auto-refreshes)
- 👥 **User Profiles**: Track stats, streaks, and net totals
- 🗑️ **Event Management**: Delete or unresolve events as needed
- ✅ **Persistent Storage**: All data saved in Vercel Postgres database

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Vercel Postgres (persistent storage)
- **Deployment**: Vercel

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions on setting up Vercel Postgres.

**Quick summary:**
1. Create a Postgres database in your Vercel project dashboard
2. Copy environment variables to `.env.local`
3. Run `npm run db:init` to create tables

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Deploy to Vercel

```bash
npx vercel --prod --yes
```

Environment variables are automatically synced to your Vercel deployment.

## How it Works

### Authentication
Simple username-based auth! Just enter a username when you first visit. It's stored in cookies and created in the database.

### Event Lifecycle
1. Create an event with a title, two sides, and end time
2. Share with friends
3. Anyone can place bets until the deadline
4. Late bets are marked and don't count in resolution
5. Anyone can resolve at any time
6. See net results and payment suggestions
7. Events can be unresolved if needed

### Betting Logic
- Winners split the total pot proportionally to their bets
- Net results show who gained/lost and by how much
- User balances and streaks update automatically on resolution

## Database

✅ **All data now persists!** Your events, bets, and user profiles are stored in Vercel Postgres and survive deployments.

Tables:
- `users` - User profiles with stats
- `events` - Betting events
- `bets` - Individual wagers
- `activities` - Activity feed items

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for schema details.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:init` - Initialize database schema
- `npm start` - Start production server

## Architecture

```
/app              # Next.js pages and API routes
  /api            # API endpoints
  /[page]         # Page components
/components       # Reusable React components
/lib              # Utilities and database layer
  db.ts           # Database interface with Vercel Postgres
  types.ts        # TypeScript types
  utils.ts        # Helper functions
  schema.sql      # Database schema
/scripts          # Utility scripts
  init-db.ts      # Database initialization
```

## License

MIT
