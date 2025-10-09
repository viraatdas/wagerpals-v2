'use client';

import Link from 'next/link';
import { formatTimeLeft } from '@/lib/utils';
import { Event } from '@/lib/types';

interface EventCardProps {
  event: Event & {
    side_stats: Record<string, { count: number; total: number }>;
    total_bets: number;
    total_participants: number;
  };
}

export default function EventCard({ event }: EventCardProps) {
  const timeLeft = formatTimeLeft(event.end_time);
  const isEnded = event.end_time < Date.now();

  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-light text-gray-900 flex-1">{event.title}</h3>
          {event.status === 'resolved' && (
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-light rounded">
              Resolved
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mb-3">
          <span
            className={`px-2 py-1 text-xs font-light rounded ${
              isEnded
                ? 'bg-gray-100 text-gray-600'
                : 'bg-orange-100 text-orange-800'
            }`}
          >
            {isEnded ? 'Ended' : `Ends in ${timeLeft}`}
          </span>
          <span className="text-xs text-gray-700 font-medium">
            👥 {event.total_participants} {event.total_participants === 1 ? 'person' : 'people'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {event.sides.map((side) => {
            const stats = event.side_stats[side];
            return (
              <div
                key={side}
                className="bg-gray-50 rounded p-2 border border-gray-200"
              >
                <div className="text-sm font-light text-gray-700">{side}</div>
                <div className="text-xs text-gray-500 mt-1 font-light">
                  {stats.count} · ${stats.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Link>
  );
}

