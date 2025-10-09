'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ActivityItem } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo('Fetching activities...');
      
      console.log('[Activity Page] Fetching from /api/activity');
      const response = await fetch('/api/activity', { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('[Activity Page] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Activity Page] Error response:', errorData);
        setError(`Failed to load: ${errorData.error || errorData.message || 'Unknown error'}`);
        setDebugInfo(JSON.stringify(errorData, null, 2));
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('[Activity Page] Received data:', data);
      console.log('[Activity Page] Data type:', typeof data);
      console.log('[Activity Page] Is array?:', Array.isArray(data));
      console.log('[Activity Page] Length:', data?.length);
      
      if (Array.isArray(data)) {
        setActivities(data);
        setDebugInfo(`Loaded ${data.length} activities successfully`);
        console.log('[Activity Page] Set activities:', data.length);
      } else {
        console.error('[Activity Page] Data is not an array:', data);
        setError('Invalid data format received');
        setDebugInfo(`Expected array, got: ${typeof data}`);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('[Activity Page] Fetch error:', err);
      setError(`Connection error: ${err.message}`);
      setDebugInfo(err.toString());
      setLoading(false);
    }
  };

  const renderActivity = (activity: ActivityItem, index: number) => {
    if (activity.type === 'bet') {
      return (
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-900 font-light">
              <span className="font-medium text-blue-600">@{activity.username || 'Unknown'}</span>
              {' bet '}
              <span className="font-semibold text-orange-600">${activity.amount}</span>
              {' on '}
              <span className="font-medium">{activity.side}</span>
              {' in '}
              <span className="text-gray-700">"{activity.event_title}"</span>
            </p>
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extralight text-gray-900 mb-2">
            Activity <span className="font-semibold text-orange-600 border-b-2 border-orange-600">Feed</span>
          </h1>
          <p className="text-gray-600 font-light">Recent events, bets, and resolutions</p>
        </div>
        <button
          onClick={loadActivities}
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white text-sm font-light rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <p className="text-red-800 font-medium mb-2">⚠️ Error</p>
          <p className="text-red-700 font-light mb-2">{error}</p>
          {debugInfo && (
            <details className="text-xs text-red-600 font-mono">
              <summary className="cursor-pointer">Debug Info</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">{debugInfo}</pre>
            </details>
          )}
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
          {debugInfo && (
            <details className="text-xs text-gray-500 font-mono mt-4">
              <summary className="cursor-pointer">Debug Info</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-left">{debugInfo}</pre>
            </details>
          )}
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
