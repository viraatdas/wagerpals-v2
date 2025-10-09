export interface User {
  id: string;
  username: string;
  net_total: number;
  total_bet: number;
  streak: number;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  side_a: string;
  side_b: string;
  end_time: number;
  status: 'active' | 'resolved';
  resolution?: {
    winning_side: string;
    resolved_at: number;
  };
}

export interface Bet {
  id: string;
  event_id: string;
  user_id: string;
  username: string;
  side: string;
  amount: number;
  timestamp: number;
  is_late: boolean;
}

export interface ActivityItem {
  type: 'bet' | 'resolution' | 'event_created';
  timestamp: number;
  event_id: string;
  event_title: string;
  username?: string;
  side?: string;
  amount?: number;
  winning_side?: string;
}

export interface EventWithStats extends Event {
  side_stats: Record<string, { count: number; total: number }>;
  total_bets: number;
  total_participants: number;
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
