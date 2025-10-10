'use client';

import { useEffect, useState } from 'react';
import EventCard from '@/components/EventCard';
import UsernameModal from '@/components/UsernameModal';
import { EventWithStats } from '@/lib/types';
import { getCookie, setCookie } from '@/lib/cookies';

export default function Home() {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  useEffect(() => {
    const storedUsername = getCookie('username');
    if (!storedUsername) {
      setShowUsernameModal(true);
    }
    fetchEvents();
  }, []);

  const handleUsernameSubmit = async (username: string) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create user');
    }

    setCookie('userId', data.id, 365);
    setCookie('username', data.username, 365);
    setShowUsernameModal(false);
    
    // Notify Header component to update
    window.dispatchEvent(new Event('userLoggedIn'));
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const categorizeEvents = () => {
    const now = Date.now();
    const ongoingEvents = events
      .filter((e) => e.status === 'active' && e.end_time > now)
      .sort((a, b) => a.end_time - b.end_time);

    const endedEvents = events
      .filter((e) => e.status === 'resolved' || (e.status === 'active' && e.end_time <= now))
      .sort((a, b) => b.end_time - a.end_time);

    return { ongoingEvents, endedEvents };
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 font-light">Loading...</p>
      </div>
    );
  }

  const { ongoingEvents, endedEvents } = categorizeEvents();

  return (
    <>
      {showUsernameModal && <UsernameModal onSubmit={handleUsernameSubmit} />}
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extralight text-gray-900 mb-2">
            Welcome to <span className="font-semibold text-orange-600">WagerPals</span>
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Polymarket for friends.
          </p>
        </div>

        {ongoingEvents.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-4 border-b-2 border-orange-600 pb-2 inline-block">
              Ongoing Bets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {ongoingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {endedEvents.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-4 border-b-2 border-gray-400 pb-2 inline-block">
              Ended Bets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {endedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4 font-light">No events yet. Create the first one!</p>
            <a
              href="/create"
              className="inline-block px-6 py-3 bg-orange-600 text-white font-light rounded-lg hover:bg-orange-700"
            >
              Create Event
            </a>
          </div>
        )}
      </div>
    </>
  );
}

