'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Countdown from '@/components/Countdown';
import BetForm from '@/components/BetForm';
import Ledger from '@/components/Ledger';
import ResolutionBanner from '@/components/ResolutionBanner';
import UsernameModal from '@/components/UsernameModal';
import { EventWithStats, NetResult } from '@/lib/types';
import { calculateNetResults } from '@/lib/utils';
import { getCookie, setCookie } from '@/lib/cookies';

export default function EventPage() {
  const params = useParams();
  const [event, setEvent] = useState<EventWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [resolving, setResolving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [netResults, setNetResults] = useState<NetResult[]>([]);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  useEffect(() => {
    const storedUserId = getCookie('userId');
    const storedUsername = getCookie('username');

    if (!storedUserId || !storedUsername) {
      setShowUsernameModal(true);
    } else {
      setUserId(storedUserId);
      setUsername(storedUsername);
    }

    fetchEvent();
  }, [params.id]);

  const handleUsernameSubmit = async (newUsername: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      });

      const user = await response.json();
      setCookie('userId', user.id, 365);
      setCookie('username', user.username, 365);
      setUserId(user.id);
      setUsername(user.username);
      setShowUsernameModal(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events?id=${params.id}`);
      const data = await response.json();
      setEvent(data);

      if (data.status === 'resolved' && data.resolution) {
        const results = calculateNetResults(data.bets, data.resolution.winning_side);
        setNetResults(results);
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (winningSide: string) => {
    if (!event || !userId) return;

    const confirmed = confirm(`Are you sure you want to resolve this event as "${winningSide}"? This will calculate and update all user balances.`);
    if (!confirmed) return;

    setResolving(true);

    try {
      const response = await fetch('/api/events/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          winning_side: winningSide,
          resolved_by: userId,
        }),
      });

      if (response.ok) {
        fetchEvent();
      }
    } catch (error) {
      console.error('Failed to resolve event:', error);
    } finally {
      setResolving(false);
    }
  };

  const handleUnresolve = async () => {
    if (!event || !userId) return;

    const confirmed = confirm(`Are you sure you want to unresolve this event? This will reverse all balance changes.`);
    if (!confirmed) return;

    setResolving(true);

    try {
      const response = await fetch('/api/events/unresolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
        }),
      });

      if (response.ok) {
        fetchEvent();
      }
    } catch (error) {
      console.error('Failed to unresolve event:', error);
    } finally {
      setResolving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    const confirmed = confirm(`Are you sure you want to delete "${event.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);

    try {
      const response = await fetch('/api/events/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
        }),
      });

      if (response.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 font-light">Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 font-light">Event not found</p>
      </div>
    );
  }

  const isEnded = event.end_time < Date.now();
  const canResolve = event.status === 'active';

  return (
    <>
      {showUsernameModal && <UsernameModal onSubmit={handleUsernameSubmit} />}
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 relative">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="absolute top-0 right-0 px-3 py-1 text-sm font-light text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete event"
          >
            Delete
          </button>
          
          <h1 className="text-3xl font-light text-gray-900 mb-3 pr-20">{event.title}</h1>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-lg text-sm font-light ${
              isEnded ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-800'
            }`}>
              {isEnded ? 'Event ended' : <Countdown endTime={event.end_time} />}
            </div>
            {event.status === 'resolved' && (
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-light">
                Resolved
              </div>
            )}
          </div>
        </div>

        {event.status === 'resolved' && netResults.length > 0 && (
          <>
            <ResolutionBanner event={event} netResults={netResults} />
            <div className="mb-6">
              <button
                onClick={handleUnresolve}
                disabled={resolving}
                className="px-4 py-2 bg-yellow-600 text-white text-sm font-light rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 transition-colors"
              >
                {resolving ? 'Unresolving...' : 'Unresolve Event'}
              </button>
            </div>
          </>
        )}

        {canResolve && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <h3 className="font-light text-orange-900 mb-2">
              If this event has been resolved, what has it been resolved to?
            </h3>
            <div className="flex gap-2 flex-wrap">
              {event.sides.map((side) => (
                <button
                  key={side}
                  onClick={() => handleResolve(side)}
                  disabled={resolving}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 transition-colors font-light"
                >
                  {side}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {event.sides.map((side) => {
            const stats = event.side_stats[side];
            return (
              <div
                key={side}
                className="bg-white border-2 border-gray-200 rounded-lg p-4"
              >
                <h3 className="text-xl font-light text-gray-900 mb-2 border-b border-gray-200 pb-2">{side}</h3>
                <div className="text-sm text-gray-600 font-light">
                  <div>{stats.count} participants</div>
                  <div className="text-2xl font-light text-gray-900 mt-1">${stats.total}</div>
                </div>
              </div>
            );
          })}
        </div>

        {event.status === 'active' && userId && username && (
          <div className="mb-6">
            <BetForm
              sides={event.sides}
              eventId={event.id}
              userId={userId}
              username={username}
              onBetPlaced={fetchEvent}
            />
          </div>
        )}

        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-4 border-b-2 border-orange-600 pb-2 inline-block">Ledger</h2>
          <div className="mt-6">
            <Ledger bets={event.bets} />
          </div>
        </div>
      </div>
    </>
  );
}

