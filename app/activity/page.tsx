'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/navigation';
import { ActivityItem } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';

export default function ActivityPage() {
  const user = useUser({ or: "return-null" });
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchActivities();
  }, [user, router]);

  const fetchActivities = async () => {
    if (!user) return;
    
    console.log('[Activity] Starting fetch...');
    try {
      const response = await fetch(`/api/activity?userId=${user.id}`);
      console.log('[Activity] Response status:', response.ok, response.status);
      const data = await response.json();
      console.log('[Activity] Data received:', data);
      console.log('[Activity] Data length:', data?.length);
      console.log('[Activity] Is array?', Array.isArray(data));
      setActivities(data);
      console.log('[Activity] State set with data');
    } catch (error) {
      console.error('[Activity] Failed to fetch activities:', error);
    } finally {
      console.log('[Activity] Setting loading to false');
      setLoading(false);
    }
  };

  const renderActivity = (activity: ActivityItem, index: number) => {
    if (activity.type === 'bet') {
      return (
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-gray-900 font-light">
              <span className="font-medium text-blue-600">@{activity.username || 'Unknown'}</span>
              {' bet '}
              <span className="font-semibold text-orange-600">${activity.amount?.toFixed(2)}</span>
              {' on '}
              <span className="font-medium">{activity.side}</span>
              {' in '}
              <span className="text-gray-700">"{activity.event_title}"</span>
              {activity.group_name && (
                <>
                  {' '}
                  <span className="text-gray-500 text-sm">
                    · <span className="font-medium">{activity.group_name}</span>
                  </span>
                </>
              )}
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
              {activity.group_name && (
                <>
                  {' '}
                  <span className="text-gray-500 text-sm">
                    · <span className="font-medium">{activity.group_name}</span>
                  </span>
                </>
              )}
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
              {activity.group_name && (
                <>
                  {' '}
                  <span className="text-gray-500 text-sm">
                    · <span className="font-medium">{activity.group_name}</span>
                  </span>
                </>
              )}
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
    
    if (activity.type === 'comment') {
      return (
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-gray-900 font-light">
              <span className="font-medium text-indigo-600">@{activity.username || 'Unknown'}</span>
              {' commented on '}
              <span className="text-gray-700">"{activity.event_title}"</span>
              {activity.group_name && (
                <>
                  {' '}
                  <span className="text-gray-500 text-sm">
                    · <span className="font-medium">{activity.group_name}</span>
                  </span>
                </>
              )}
            </p>
            {(activity.content || activity.note) && (
              <p className="text-sm text-gray-600 mt-1 font-light italic">
                "{activity.content || activity.note}"
              </p>
            )}
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

  console.log('[Activity] Render - loading:', loading, 'activities.length:', activities.length);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-600 border-t-transparent"></div>
          <p className="text-gray-600 font-light mt-4">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extralight text-gray-900 mb-2">
        Activity <span className="font-semibold text-orange-600 border-b-2 border-orange-600">Feed</span>
      </h1>
      <p className="text-gray-600 font-light mb-8">
        Recent events, bets, and resolutions from your groups
      </p>

      {activities.length === 0 ? (
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
            Showing {activities.length} {activities.length === 50 ? '(limit reached)' : ''} activities from your groups
          </div>
        </div>
      )}
    </div>
  );
}
