'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ActivityItem } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add timestamp to force cache bust
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/activity?t=${timestamp}`, { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(`Failed to load: ${errorData.error || errorData.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setActivities(data);
      } else {
        setError('Invalid data format received');
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(`Connection error: ${err.message}`);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();

    // Refresh activities when user returns to the page/tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadActivities();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadActivities]);

  const renderActivity = (activity: ActivityItem, index: number) => {
    if (activity.type === 'bet') {
      return (
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-gray-900 font-light">
              <span className="font-medium text-blue-600">@{activity.username || 'Unknown'}</span>
              {' bet '}
              <span className="font-semibold text-orange-600">${activity.amount}</span>
              {' on '}
              <span className="font-medium">{activity.side}</span>
              {' in '}
              <span className="text-gray-700">"{activity.event_title}"</span>
            </p>
            {activity.note && (
              <p className="text-sm text-gray-600 mt-1 font-light italic">
                "{activity.note}"
              </p>
            )}
          </div>
          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap font-light">
            {formatTimestamp(activity.timestamp)}
          </span>
        </div>
      );
    }
    
    if (activity.type === 'event_created') {
      return (
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-900 font-light">
              <span className="font-medium text-purple-600">@{activity.username || 'Unknown'}</span>
              {' created '}
              <span className="text-gray-700">"{activity.event_title}"</span>
            </p>
          </div>
          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap font-light">
            {formatTimestamp(activity.timestamp)}
          </span>
        </div>
      );
    }
    
    if (activity.type === 'resolution') {
      return (
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-900 font-light">
              <span className="font-medium text-green-700">✓ Resolved:</span>
              {' '}
              <span className="text-gray-700">"{activity.event_title}"</span>
            </p>
            <p className="text-sm text-gray-600 mt-1 font-light">
              Winner: <span className="font-medium text-green-600">{activity.winning_side}</span>
            </p>
          </div>
          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap font-light">
            {formatTimestamp(activity.timestamp)}
          </span>
        </div>
      );
    }
    
    return (
      <div className="text-gray-500">
        Unknown activity type: {activity.type}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extralight text-gray-900 mb-2">
            Activity <span className="font-semibold text-orange-600 border-b-2 border-orange-600">Feed</span>
          </h1>
          <p className="text-gray-600 font-light">Recent events, bets, and resolutions</p>
        </div>
        <button
          onClick={loadActivities}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <svg 
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <p className="text-red-800 font-medium mb-2">⚠️ Error</p>
          <p className="text-red-700 font-light">{error}</p>
        </div>
      )}

      {loading && activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-600 border-t-transparent"></div>
          <p className="text-gray-600 font-light mt-4">Loading activities...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 font-light text-lg mb-2">No activity yet</p>
          <p className="text-gray-500 font-light text-sm">
            Start by creating an event and placing bets!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <Link 
              key={`${activity.type}-${activity.event_id}-${activity.timestamp}-${index}`} 
              href={`/events/${activity.event_id}`}
            >
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-orange-300">
                {renderActivity(activity, index)}
              </div>
            </Link>
          ))}
          
          <div className="text-center text-xs text-gray-400 pt-4">
            Showing {activities.length} activities
          </div>
        </div>
      )}
    </div>
  );
}
