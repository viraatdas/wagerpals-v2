export interface User {
  id: string;
  username: string;
  username_selected?: boolean;
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
  group_id: string;
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
  note?: string;
  timestamp: number;
  is_late: boolean;
}

export interface ActivityItem {
  type: 'bet' | 'resolution' | 'event_created' | 'comment';
  timestamp: number;
  event_id: string;
  event_title: string;
  group_id?: string;
  group_name?: string;
  user_id?: string;
  username?: string;
  side?: string;
  amount?: number;
  note?: string;
  winning_side?: string;
  content?: string;
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

export interface PushSubscription {
  id?: number;
  user_id?: string;
  endpoint: string;
  p256dh?: string;
  auth?: string;
  expo_token?: string;
  platform?: 'web' | 'mobile';
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  is_public: boolean;
  created_at?: string;
}

export interface GroupMember {
  id?: number;
  group_id: string;
  user_id: string;
  username?: string;
  role: 'admin' | 'member';
  status: 'pending' | 'active';
  joined_at?: string;
}

export interface Comment {
  id: string;
  event_id: string;
  user_id: string;
  username: string;
  content: string;
  timestamp: number;
}

export interface GroupWithMembers extends Group {
  members: GroupMember[];
  member_count: number;
  admin_count: number;
}
