'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ActivityItem } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';

export default function Activity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
    
    // Refetch when page becomes visible (user switches tabs/windows)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchActivities();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activity', { 
        cache: 'no-store' // Ensure we get fresh data
      });
      if (!response.ok) {
        if (response.status === 500) {
          setError('Database not configured. Please follow SETUP_INSTRUCTIONS.md');
        } else {
          setError(`Failed to load activities (HTTP ${response.status})`);
        }
        setLoading(false);
        return;
      }
      const data = await response.json();
      setActivities(Array.isArray(data) ? data : []);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setError('Unable to connect to the server. Check console for details.');
      setActivities([]);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extralight text-gray-900 mb-2">
            Activity <span className="font-semibold text-orange-600 border-b-2 border-orange-600">Feed</span>
          </h1>
          <p className="text-gray-600 font-light">Recent bets and resolutions</p>
        </div>
        <button
          onClick={fetchActivities}
          className="px-4 py-2 bg-orange-600 text-white text-sm font-light rounded-lg hover:bg-orange-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium mb-2">⚠️ Database Error</p>
          <p className="text-red-700 font-light mb-4">{error}</p>
          <p className="text-sm text-red-600 font-light">
            Follow the instructions in <code className="bg-red-100 px-2 py-1 rounded">SETUP_INSTRUCTIONS.md</code> to set up Vercel Postgres.
          </p>
        </div>
      ) : loading && activities.length === 0 ? (
        <p className="text-center text-gray-600 py-12 font-light">Loading...</p>
      ) : (
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-center text-gray-600 py-12 font-light">No activity yet. Start by creating an event and placing bets!</p>
          ) : (
          activities.map((activity, index) => (
            <Link key={`${activity.timestamp}-${activity.event_id}-${index}`} href={`/events/${activity.event_id}`}>
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                {activity.type === 'bet' ? (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-900 font-light">
                        <span className="font-medium">@{activity.username}</span>
                        {' joined '}
                        <span className="text-gray-700">"{activity.event_title}"</span>
                        {' on '}
                        <span className="font-medium">{activity.side}</span>
                        {' '}
                        <span className="font-semibold text-orange-600">(+${activity.amount})</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 ml-2 whitespace-nowrap font-light">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-900 font-light">
                        <span className="font-medium text-green-700">Resolved:</span>
                        {' '}
                        <span className="text-gray-700">"{activity.event_title}"</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1 font-light">
                        Winner: <span className="font-medium">{activity.winning_side}</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 ml-2 whitespace-nowrap font-light">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))
          )}
        </div>
      )}
    </div>
  );
}

