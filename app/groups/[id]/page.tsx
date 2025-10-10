'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import EventCard from '@/components/EventCard';
import { EventWithStats } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const user = useUser();
  const [group, setGroup] = useState<any>(null);
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchGroupAndEvents(user.id);
  }, [params.id, user, router]);

  const fetchGroupAndEvents = async (uid: string) => {
    try {
      // Fetch group details
      const groupResponse = await fetch(`/api/groups?id=${params.id}`);
      if (!groupResponse.ok) {
        throw new Error('Failed to fetch group');
      }
      const groupData = await groupResponse.json();
      setGroup(groupData);

      // Check if user is admin
      const userMember = groupData.members.find((m: any) => m.user_id === uid);
      setIsAdmin(userMember?.role === 'admin');

      // Fetch events for this group
      const eventsResponse = await fetch(`/api/events?groupId=${params.id}`);
      if (!eventsResponse.ok) {
        throw new Error('Failed to fetch events');
      }
      const eventsData = await eventsResponse.json();
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const categorizeEvents = () => {
    const now = Date.now();
    const allOngoingEvents = events
      .filter((e) => e.status === 'active' && e.end_time > now)
      .sort((a, b) => a.end_time - b.end_time);

    const eventsWithTotals = allOngoingEvents.map(event => {
      const totalMoney = Object.values(event.side_stats).reduce((sum, stats) => sum + stats.total, 0);
      return { ...event, totalMoney };
    });

    const trendingEvents = [...eventsWithTotals]
      .sort((a, b) => {
        if (b.total_participants !== a.total_participants) {
          return b.total_participants - a.total_participants;
        }
        return b.totalMoney - a.totalMoney;
      })
      .slice(0, 3);

    const trendingIds = new Set(trendingEvents.map(e => e.id));
    const ongoingEvents = allOngoingEvents.filter(e => !trendingIds.has(e.id));

    const endedEvents = events
      .filter((e) => e.status === 'resolved' || (e.status === 'active' && e.end_time <= now))
      .sort((a, b) => b.end_time - a.end_time);

    return { trendingEvents, ongoingEvents, endedEvents };
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

  if (!group) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 font-light">Group not found</p>
      </div>
    );
  }

  const { trendingEvents, ongoingEvents, endedEvents } = categorizeEvents();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extralight text-gray-900">
              {group.name}
            </h1>
            {isAdmin && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded font-light">
                Admin
              </span>
            )}
          </div>
          <p className="text-lg text-gray-600 font-light">
            Group Code: <span className="font-mono font-semibold">{group.id}</span> • {group.member_count} members
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => router.push(`/groups/${group.id}/admin`)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-light text-sm"
            >
              Manage Group
            </button>
          )}
          <button
            onClick={() => router.push('/create')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-light text-sm"
          >
            Create Event
          </button>
        </div>
      </div>

      {trendingEvents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-light text-gray-900 mb-4 border-b-2 border-red-500 pb-2 inline-block">
            🔥 Trending
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {trendingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

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
          <button
            onClick={() => router.push('/create')}
            className="inline-block px-6 py-3 bg-orange-600 text-white font-light rounded-lg hover:bg-orange-700"
          >
            Create Event
          </button>
        </div>
      )}
    </div>
  );
}

