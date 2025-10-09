# Wager Pals

A social ledger for bets. There are witnesses and all viewable among your friends.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Features

- **Create Events**: Set up prediction events with custom sides and deadlines
- **Place Bets**: Join events by picking a side and wagering an amount
- **Live Ledger**: See all participants and their predictions in real-time
- **Event Resolution**: Resolve events and see net results & payment breakdowns
- **Activity Feed**: Follow all bets and resolutions across the platform
- **Explore**: Browse events by ending soon, most joined, or newest

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## How it Works

### Authentication
No complex auth required! Just enter a username when you first visit. It's stored locally and created in the database.

### Event Lifecycle
1. Create an event with a title, sides (2-4 options), and end time
2. Share the event link with friends
3. Anyone can place bets until the deadline
4. Late bets are marked as "Late" and don't count in results
5. After the deadline, anyone can resolve the event
6. See net results and payment suggestions

### Betting Logic
- Winners split the total pot proportionally to their bets
- Net results show who gained/lost and by how much
- Payment suggestions optimize transfers between participants

## Deploy on Vercel

The easiest way to deploy is to use [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/wagerpals)

## Future Enhancements

- User profiles with stats and history
- Badges and achievements
- Reactions on events and bets
- Event templates and quick starts
- Social sharing with preview images
- Real database (PostgreSQL, Vercel KV, etc.)
- Real-time updates with WebSockets

## License

MIT
