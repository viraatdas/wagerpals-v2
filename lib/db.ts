import { User, Event, Bet, ActivityItem } from './types';

// In-memory storage (for simplicity - can be replaced with actual DB)
let users: Record<string, User> = {};
let events: Record<string, Event> = {};
let bets: Record<string, Bet> = {};
let activities: ActivityItem[] = [];

export const db = {
  users: {
    get: (id: string) => users[id],
    getByUsername: (username: string) => Object.values(users).find(u => u.username === username),
    getAll: () => Object.values(users),
    create: (user: User) => {
      users[user.id] = user;
      return user;
    },
    update: (id: string, data: Partial<User>) => {
      if (users[id]) {
        users[id] = { ...users[id], ...data };
      }
      return users[id];
    },
  },
  events: {
    get: (id: string) => events[id],
    getAll: () => Object.values(events),
    create: (event: Event) => {
      events[event.id] = event;
      return event;
    },
    update: (id: string, data: Partial<Event>) => {
      if (events[id]) {
        events[id] = { ...events[id], ...data };
      }
      return events[id];
    },
    delete: (id: string) => {
      delete events[id];
    },
  },
  bets: {
    get: (id: string) => bets[id],
    getByEvent: (event_id: string) => Object.values(bets).filter(b => b.event_id === event_id),
    getByUser: (user_id: string) => Object.values(bets).filter(b => b.user_id === user_id),
    getAll: () => Object.values(bets),
    create: (bet: Bet) => {
      bets[bet.id] = bet;
      return bet;
    },
  },
  activities: {
    getAll: () => activities.sort((a, b) => b.timestamp - a.timestamp),
    add: (activity: ActivityItem) => {
      activities.push(activity);
      return activity;
    },
  },
};

