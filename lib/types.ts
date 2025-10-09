export interface User {
  id: string;
  username: string;
  created_at: number;
  events_joined: number;
  net_total: number;
  streak: number;
}

export interface Event {
  id: string;
  title: string;
  sides: string[];
  end_time: number;
  created_at: number;
  created_by: string;
  status: 'active' | 'resolved';
  resolution?: {
    winning_side: string;
    note?: string;
    resolved_at: number;
    resolved_by: string;
  };
}

export interface Bet {
  id: string;
  event_id: string;
  user_id: string;
  username: string;
  side: string;
  amount: number;
  note?: string;
  timestamp: number;
  is_late: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'bet' | 'resolution';
  timestamp: number;
  event_id: string;
  event_title: string;
  username?: string;
  side?: string;
  amount?: number;
  resolution_summary?: string;
}

export interface EventWithStats extends Event {
  total_bets: number;
  side_stats: Record<string, { count: number; total: number }>;
  bets: Bet[];
}

export interface NetResult {
  user_id: string;
  username: string;
  net: number;
}

export interface Payment {
  from: string;
  to: string;
  amount: number;
}

