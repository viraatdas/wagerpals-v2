export const dynamic = 'force-dynamic';

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import Toast, { ToastType } from '@/components/Toast';

function CreateEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUser({ or: "return-null" });
  const [title, setTitle] = useState('');
  const [sides, setSides] = useState(['Yes', 'No']);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    fetchGroups(user.id);

    // Get groupId from URL if present
    const groupIdFromUrl = searchParams.get('groupId');
    if (groupIdFromUrl) {
      setSelectedGroupId(groupIdFromUrl);
    }
  }, [searchParams, user, router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdownOpen && !target.closest('.group-dropdown')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const fetchGroups = async (uid: string) => {
    try {
      const response = await fetch(`/api/groups?userId=${uid}`);
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    }
  };

  const handleSideChange = (index: number, value: string) => {
    const newSides = [...sides];
    newSides[index] = value;
    setSides(newSides);
  };

  const addSide = () => {
    if (sides.length < 4) {
      setSides([...sides, '']);
    }
  };

  const removeSide = (index: number) => {
    if (sides.length > 2) {
      setSides(sides.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || sides.some((s) => !s.trim()) || !endDate || !endTime || !user || !selectedGroupId) {
      setToast({ message: 'Please fill in all fields and select a group', type: 'warning' });
      return;
    }

    setLoading(true);

    try {
      const endDateTime = new Date(`${endDate}T${endTime}`).getTime();
      const username = user.displayName || user.primaryEmail || 'User';

      const eventData = {
        title: title.trim(),
        side_a: sides[0].trim(),
        side_b: sides[1].trim(),
        end_time: endDateTime,
        group_id: selectedGroupId,
        creator_user_id: user.id,
        creator_username: username,
      };

      console.log('[Create Page] Creating event with data:', eventData);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create event:', errorData);
        setToast({ message: errorData.error || 'Failed to create event. Please try again.', type: 'error' });
        return;
      }

      const event = await response.json();
      
      if (event && event.id) {
        router.push(`/events/${event.id}`);
      } else {
        console.error('No event ID returned:', event);
        setToast({ message: 'Event created but could not navigate to it.', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to create event:', error);
      setToast({ message: 'Failed to create event', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to signin
  }

  return (
    <>
      <Toast
        isOpen={toast !== null}
        onClose={() => setToast(null)}
        message={toast?.message || ''}
        type={toast?.type || 'info'}
      />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extralight text-gray-900 mb-2">
          Create <span className="font-semibold text-orange-600 border-b-2 border-orange-600">Event</span>
        </h1>
        <p className="text-gray-600 font-light mb-8">Set up a new prediction event</p>

      <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
        <div className="space-y-8">
          {/* Modern Group Selector */}
          <div>
            <label className="block text-sm font-light text-gray-700 mb-3 border-b border-gray-200 pb-1">
              Select Group
            </label>
            <div className="relative group-dropdown">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`w-full bg-white border-2 rounded-xl px-6 py-4 flex items-center justify-between transition-all focus:outline-none ${
                  selectedGroupId 
                    ? 'border-orange-300 hover:border-orange-400' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${dropdownOpen ? 'border-orange-500' : ''}`}
              >
                {selectedGroupId ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-semibold">
                      {groups.find(g => g.id === selectedGroupId)?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">
                        {groups.find(g => g.id === selectedGroupId)?.name}
                      </div>
                      <div className="text-sm text-gray-500 font-light">
                        {groups.find(g => g.id === selectedGroupId)?.member_count || 0} members • ID: {selectedGroupId}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400 font-light">Choose a group...</span>
                )}
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
                  {groups.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500 font-light">
                      No groups available
                    </div>
                  ) : (
                    groups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full px-6 py-4 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left ${
                          selectedGroupId === group.id ? 'bg-orange-50' : ''
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold ${
                          selectedGroupId === group.id 
                            ? 'bg-gradient-to-br from-orange-400 to-orange-600' 
                            : 'bg-gradient-to-br from-gray-400 to-gray-600'
                        }`}>
                          {group.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{group.name}</div>
                          <div className="text-sm text-gray-500 font-light">
                            {group.member_count || 0} members • ID: {group.id}
                          </div>
                        </div>
                        {selectedGroupId === group.id && (
                          <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-light text-gray-700 mb-3 border-b border-gray-200 pb-1">
              Event Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-5 py-3.5 text-lg font-light border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-white hover:border-gray-300"
              placeholder="Will it rain tomorrow?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-light text-gray-700 mb-3 border-b border-gray-200 pb-1">
              Sides (2-4 options)
            </label>
            <div className="space-y-3 mt-4">
              {sides.map((side, index) => (
                <div key={index} className="flex gap-3 items-center group">
                  <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={side}
                      onChange={(e) => handleSideChange(index, e.target.value)}
                      className="w-full pl-14 pr-5 py-3.5 font-light border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-white hover:border-gray-300"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                  </div>
                  {sides.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeSide(index)}
                      className="px-4 py-2.5 text-red-600 hover:bg-red-50 border-2 border-red-200 rounded-xl font-light text-sm transition-all hover:border-red-300"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {sides.length < 4 && (
              <button
                type="button"
                onClick={addSide}
                className="mt-4 px-4 py-2.5 text-sm text-orange-600 hover:text-orange-700 font-medium border-2 border-orange-200 rounded-xl hover:bg-orange-50 transition-all"
              >
                + Add another option
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-light text-gray-700 mb-3 border-b border-gray-200 pb-1">
              When does this end?
            </label>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 text-xl pointer-events-none">
                  📅
                </div>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-14 pr-4 py-3.5 font-light border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-white hover:border-gray-300"
                  required
                />
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 text-xl pointer-events-none">
                  ⏰
                </div>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-14 pr-4 py-3.5 font-light border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-white hover:border-gray-300"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-medium text-lg hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? '⏳ Creating Event...' : '✨ Create Event'}
          </button>
        </div>
      </form>
      </div>
    </>
  );
}

export default function CreateEvent() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 font-light">Loading...</p>
      </div>
    }>
      <CreateEventForm />
    </Suspense>
  );
}

