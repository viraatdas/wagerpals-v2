'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UsernameModal from '@/components/UsernameModal';
import { getCookie, setCookie } from '@/lib/cookies';

export default function CreateEvent() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [sides, setSides] = useState(['Yes', 'No']);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
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
  }, []);

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
      
      // Notify Header component to update
      window.dispatchEvent(new Event('userLoggedIn'));
    } catch (error) {
      console.error('Failed to create user:', error);
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
    if (!title || sides.some((s) => !s.trim()) || !endDate || !endTime || !userId) {
      return;
    }

    setLoading(true);

    try {
      const endDateTime = new Date(`${endDate}T${endTime}`).getTime();

      const eventData = {
        title: title.trim(),
        side_a: sides[0].trim(),
        side_b: sides[1].trim(),
        end_time: endDateTime,
        creator_user_id: userId,
        creator_username: username,
      };

      console.log('[Create Page] Creating event with data:', eventData);
      console.log('[Create Page] Username:', username, 'UserId:', userId);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create event:', errorData);
        alert('Failed to create event. Please try again.');
        return;
      }

      const event = await response.json();
      
      if (event && event.id) {
        router.push(`/events/${event.id}`);
      } else {
        console.error('No event ID returned:', event);
        alert('Event created but could not navigate to it.');
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <>
        {showUsernameModal && <UsernameModal onSubmit={handleUsernameSubmit} />}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600 font-light">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extralight text-gray-900 mb-2">
        Create <span className="font-semibold text-orange-600 border-b-2 border-orange-600">Event</span>
      </h1>
      <p className="text-gray-600 font-light mb-8">Set up a new prediction event</p>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="space-y-8">
          <div>
            <label htmlFor="title" className="block text-sm font-light text-gray-700 mb-3 border-b border-gray-200 pb-1">
              Event Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-lg font-light border-b-2 border-gray-300 focus:border-orange-500 outline-none transition-colors bg-transparent"
              placeholder="Vrooom Vroooom"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-light text-gray-700 mb-3 border-b border-gray-200 pb-1">
              Sides (2-4 options)
            </label>
            <div className="space-y-3 mt-4">
              {sides.map((side, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={side}
                    onChange={(e) => handleSideChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 font-light border-b-2 border-gray-300 focus:border-orange-500 outline-none transition-colors bg-transparent"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {sides.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeSide(index)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded font-light text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            {sides.length < 4 && (
              <button
                type="button"
                onClick={addSide}
                className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-light border-b border-orange-600"
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
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 text-lg">
                  📅
                </div>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 font-light border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none transition-colors bg-white hover:border-gray-300"
                  required
                />
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 text-lg">
                  ⏰
                </div>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 font-light border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none transition-colors bg-white hover:border-gray-300"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3 rounded-xl font-light text-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all hover:shadow-lg"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}

