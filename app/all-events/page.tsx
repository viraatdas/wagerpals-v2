'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import EventCard from '@/components/EventCard';
import { EventWithStats } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function AllEventsPage() {
  const router = useRouter();
  const user = useUser({ or: null });
  const [groupedEvents, setGroupedEvents] = useState<{ group: any; events: EventWithStats[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchAllEvents(user.id);
  }, [user, router]);

  const fetchAllEvents = async (uid: string) => {
    try {
      // Fetch user's groups
      const groupsResponse = await fetch(`/api/groups?userId=${uid}`);
      if (!groupsResponse.ok) throw new Error('Failed to fetch groups');
      const groups = await groupsResponse.json();

      // Fetch events for each group
      const groupEventsPromises = groups.map(async (group: any) => {
        const eventsResponse = await fetch(`/api/events?groupId=${group.id}`);
        if (!eventsResponse.ok) return { group, events: [] };
        const events = await eventsResponse.json();
        return { group, events: Array.isArray(events) ? events : [] };
      });

      const results = await Promise.all(groupEventsPromises);
      setGroupedEvents(results.filter(r => r.events.length > 0));
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setGroupedEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const categorizeEvents = (events: EventWithStats[]) => {
    const now = Date.now();
    const ongoing = events.filter((e) => e.status === 'active' && e.end_time > now);
    const ended = events.filter((e) => e.status === 'resolved' || (e.status === 'active' && e.end_time <= now));
    return { ongoing, ended };
  };

  if (!user) {
    return null; // Will redirect to signin
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 font-light">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.push('/')}
          className="text-orange-600 hover:text-orange-700 font-light mb-2"
        >
          ← Back to Groups
        </button>
        <h1 className="text-4xl font-extralight text-gray-900 mb-2">
          All <span className="font-semibold text-orange-600">Events</span>
        </h1>
        <p className="text-lg text-gray-600 font-light">
          Events from all your groups
        </p>
      </div>

      {groupedEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4 font-light">No events in any of your groups yet.</p>
          <button
            onClick={() => router.push('/create')}
            className="inline-block px-6 py-3 bg-orange-600 text-white font-light rounded-lg hover:bg-orange-700"
          >
            Create Event
          </button>
        </div>
      ) : (
        groupedEvents.map(({ group, events }) => {
          const { ongoing, ended } = categorizeEvents(events);
          
          return (
            <section key={group.id} className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-light text-gray-900 border-b-2 border-orange-600 pb-2 inline-block">
                  {group.name}
                </h2>
                <button
                  onClick={() => router.push(`/groups/${group.id}`)}
                  className="text-sm text-orange-600 hover:text-orange-700 font-light"
                >
                  View Group →
                </button>
              </div>

              {ongoing.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-light text-gray-700 mb-3">Ongoing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ongoing.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}

              {ended.length > 0 && (
                <div>
                  <h3 className="text-lg font-light text-gray-700 mb-3">Ended</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ended.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

