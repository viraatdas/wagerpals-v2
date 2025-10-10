'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UsernameModal from '@/components/UsernameModal';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import InstallPrompt from '@/components/InstallPrompt';
import { Group } from '@/lib/types';
import { getCookie, setCookie } from '@/lib/cookies';

export default function Home() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const storedUserId = getCookie('userId');
    const storedUsername = getCookie('username');
    
    if (!storedUserId || !storedUsername) {
      setShowUsernameModal(true);
    } else {
      setUserId(storedUserId);
      setUsername(storedUsername);
      fetchGroups(storedUserId);
    }
  }, []);

  const handleUsernameSubmit = async (newUsername: string) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create user');
    }

    setCookie('userId', data.id, 365);
    setCookie('username', data.username, 365);
    setUserId(data.id);
    setUsername(data.username);
    setShowUsernameModal(false);
    fetchGroups(data.id);
    
    window.dispatchEvent(new Event('userLoggedIn'));
  };

  const fetchGroups = async (uid: string) => {
    try {
      const response = await fetch(`/api/groups?userId=${uid}`);
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !userId) return;

    setCreating(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          created_by: userId,
        }),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setShowCreateModal(false);
        setGroupName('');
        router.push(`/groups/${newGroup.id}`);
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupCode.trim() || !userId) return;

    setJoining(true);
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: groupCode.trim(),
          user_id: userId,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Join request submitted! Waiting for admin approval.');
        setShowJoinModal(false);
        setGroupCode('');
        fetchGroups(userId);
      } else {
        alert(data.error || 'Failed to join group');
      }
    } catch (error) {
      console.error('Failed to join group:', error);
      alert('Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 font-light">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {showUsernameModal && <UsernameModal onSubmit={handleUsernameSubmit} />}
      <PushNotificationPrompt />
      <InstallPrompt />

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-light mb-4">Create a Group</h2>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full px-4 py-2 border-b-2 border-gray-300 focus:border-orange-500 outline-none font-light mb-6"
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-light hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-light hover:bg-orange-700 disabled:bg-gray-300"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-light mb-4">Join a Group</h2>
            <form onSubmit={handleJoinGroup}>
              <input
                type="text"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                placeholder="Enter 6-digit group code"
                maxLength={6}
                className="w-full px-4 py-2 border-b-2 border-gray-300 focus:border-orange-500 outline-none font-light mb-6 text-center text-2xl tracking-widest"
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-light hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-light hover:bg-orange-700 disabled:bg-gray-300"
                >
                  {joining ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extralight text-gray-900 mb-2">
            Welcome to <span className="font-semibold text-orange-600">WagerPals</span>
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Choose a group or create a new one
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <div className="text-4xl mb-2">+</div>
            <div className="text-lg font-light text-gray-700">Create Group</div>
          </button>
          
          <button
            onClick={() => setShowJoinModal(true)}
            className="p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <div className="text-4xl mb-2">🔗</div>
            <div className="text-lg font-light text-gray-700">Join Group</div>
          </button>
        </div>

        {groups.length > 0 && (
          <div>
            <h2 className="text-2xl font-light text-gray-900 mb-4 border-b-2 border-orange-600 pb-2 inline-block">
              Your Groups
            </h2>
            <div className="grid gap-4 mt-6">
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => router.push(`/groups/${group.id}`)}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-light text-gray-900">{group.name}</h3>
                    {group.is_admin && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded font-light">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600 font-light">
                    <span>Code: {group.id}</span>
                    <span>•</span>
                    <span>{group.member_count} members</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

