'use client';

import { useEffect, useState } from 'react';
import EventCard from '@/components/EventCard';
import { Event } from '@/lib/types';

type EventWithStats = Event & {
  side_stats: Record<string, { count: number; total: number }>;
  total_bets: number;
};

export default function Explore() {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [filter, setFilter] = useState<'all' | 'ending-soon' | 'most-joined' | 'new'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEvents = () => {
    const now = Date.now();
    let filtered = events.filter((e) => e.status === 'active' && e.end_time > now);

    switch (filter) {
      case 'ending-soon':
        return [...filtered].sort((a, b) => a.end_time - b.end_time);
      case 'most-joined':
        return [...filtered].sort((a, b) => b.total_bets - a.total_bets);
      case 'new':
        return [...filtered].sort((a, b) => b.created_at - a.created_at);
      default:
        return filtered;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Loading...</p>
      </div>
    );
  }

  const filteredEvents = getFilteredEvents();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Explore Events</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('ending-soon')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'ending-soon'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Ending Soon
        </button>
        <button
          onClick={() => setFilter('most-joined')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'most-joined'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Most Joined
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'new'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          New
        </button>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 py-12">No active events found</p>
      )}
    </div>
  );
}

