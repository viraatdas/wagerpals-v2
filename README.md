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
- 📲 **Progressive Web App**: Install on your phone and use like a native app
- 🔔 **Push Notifications**: Get notified when new betting events are created

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

### 3. Generate App Icons (Optional)

For a production PWA, you should generate proper PNG icons. Open `public/icons/generate-icons.html` in your browser, then:

1. Right-click the first canvas and save as `icon-192x192.png`
2. Right-click the second canvas and save as `icon-512x512.png`
3. Save both files in the `public/icons/` directory

(SVG icons are included as placeholders and will work for testing)

### 4. Configure Push Notifications

Generate VAPID keys for web push notifications:

```bash
npx web-push generate-vapid-keys
```

Add the keys to your `.env.local` file:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com
```

**Important:** The public key needs to be prefixed with `NEXT_PUBLIC_` so it's accessible on the client side.

Then run the migration to add the push subscriptions table:

```bash
npx tsx scripts/add-push-subscriptions.ts
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 6. Deploy to Vercel

```bash
npx vercel --prod --yes
```

Environment variables are automatically synced to your Vercel deployment.

**Don't forget to add your VAPID keys to Vercel's environment variables!**

## Progressive Web App (PWA)

WagerPals can be installed on your phone like a native app:

### iOS (Safari)
1. Open WagerPals in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right

### Android (Chrome)
1. Open WagerPals in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen" or "Install App"
4. Confirm the installation

Once installed, the app will:
- Open in full-screen mode (no browser UI)
- Work offline with cached content
- Show on your home screen like any other app
- Send push notifications when new events are created

### Push Notifications

After installing the app, you'll be prompted to enable push notifications. Click "Enable" to receive notifications when:
- New betting events are created

**Note:** iOS requires iOS 16.4 or later for push notifications to work.

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
- `push_subscriptions` - Web push notification subscriptions

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
# wagerpals-v2
