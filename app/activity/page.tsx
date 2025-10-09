'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ActivityItem } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';

export default function Activity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Auto-refresh every 3 seconds
    const interval = setInterval(() => {
      fetchActivities();
    }, 3000);
    
    // Refetch when page becomes visible (user switches tabs/windows)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchActivities();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activity', { 
        cache: 'no-store' // Ensure we get fresh data
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setActivities(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      setActivities([]);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extralight text-gray-900 mb-2">
          Activity <span className="font-semibold text-orange-600 border-b-2 border-orange-600">Feed</span>
        </h1>
        <p className="text-gray-600 font-light">Recent bets and resolutions · Auto-refreshes every 3s</p>
      </div>

      {loading && activities.length === 0 ? (
        <p className="text-center text-gray-600 py-12 font-light">Loading...</p>
      ) : (
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-center text-gray-600 py-12 font-light">No activity yet</p>
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

