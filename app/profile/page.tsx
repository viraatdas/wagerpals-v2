'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/navigation';
import Toast, { ToastType } from '@/components/Toast';
import { validateUsername } from '@/lib/utils';

export default function ProfilePage() {
  const user = useUser({ or: null });
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [newUsername, setNewUsername] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchUserData();
  }, [user, router]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/users?id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setNewUsername(data.username);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewUsername(value);
    
    // Real-time validation
    if (value.trim().length > 0 && value !== userData?.username) {
      const validation = validateUsername(value);
      setError(validation.valid ? null : validation.error || null);
    } else {
      setError(null);
    }
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newUsername.trim() || newUsername === userData?.username) return;

    const validation = validateUsername(newUsername);
    if (!validation.valid) {
      setError(validation.error || 'Invalid username');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: user.id,
          username: newUsername.trim(),
          username_selected: true,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setUserData(updated);
        setEditing(false);
        setToast({ message: 'Username updated successfully!', type: 'success' });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update username');
      }
    } catch (error: any) {
      setError('Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 font-light">Loading...</p>
      </div>
    );
  }

  if (!user || !userData) {
    return null;
  }

  return (
    <>
      <Toast
        isOpen={toast !== null}
        onClose={() => setToast(null)}
        message={toast?.message || ''}
        type={toast?.type || 'info'}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extralight text-gray-900 mb-2">
          <span className="font-semibold text-orange-600 border-b-2 border-orange-600">Profile</span>
        </h1>
        <p className="text-gray-600 font-light mb-8">
          Manage your account settings
        </p>

        {/* Username Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-light text-gray-900 mb-4">Username</h2>
          
          {!editing ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xl sm:text-2xl font-medium text-gray-900 mb-1 break-words">@{userData.username}</p>
                <p className="text-sm text-gray-500 font-light">
                  This is how you appear on the ledger and throughout the app
                </p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-light hover:bg-orange-700 transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                Change Username
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveUsername}>
              <div className="mb-4">
                <input
                  type="text"
                  value={newUsername}
                  onChange={handleUsernameChange}
                  className={`w-full px-4 py-3 text-base sm:text-lg font-light border-b-2 ${
                    error ? 'border-red-500' : 'border-gray-300 focus:border-orange-500'
                  } outline-none transition-colors bg-transparent`}
                  placeholder="new username"
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  required
                />
                {error && (
                  <p className="text-red-500 text-sm mt-2 font-light break-words">{error}</p>
                )}
                <p className="text-xs text-gray-400 mt-2 font-light">
                  Letters, numbers, and underscores only
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setNewUsername(userData.username);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-light hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !!error || newUsername === userData.username}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-light hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Stats Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <h2 className="text-xl font-light text-gray-900 mb-4">Your Stats</h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <div>
              <div className="text-xs sm:text-sm text-gray-500 font-light mb-1">Total Bet</div>
              <div className="text-lg sm:text-2xl font-medium text-blue-600 break-words">
                ${userData.total_bet?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-500 font-light mb-1">Net Total</div>
              <div
                className={`text-lg sm:text-2xl font-medium break-words ${
                  userData.net_total > 0
                    ? 'text-green-600'
                    : userData.net_total < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {userData.net_total > 0 ? '+' : ''}${userData.net_total?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-500 font-light mb-1">Win Streak</div>
              <div className="text-lg sm:text-2xl font-light text-gray-900">
                🔥 {userData.streak || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mt-6">
          <h2 className="text-xl font-light text-gray-900 mb-4">Account Info</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-500 font-light">Email</div>
              <div className="text-gray-900 break-words">{user.primaryEmail}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 font-light">User ID</div>
              <div className="text-gray-900 text-xs sm:text-sm font-mono break-all">{user.id}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

