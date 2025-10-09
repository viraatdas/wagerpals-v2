'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from '@/lib/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedUsers = [...users].sort((a, b) => b.net_total - a.net_total);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 font-light">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extralight text-gray-900 mb-2">
        All <span className="font-semibold text-orange-600 border-b-2 border-orange-600">Users</span>
      </h1>
      <p className="text-gray-600 font-light mb-8">
        {users.length} {users.length === 1 ? 'person has' : 'people have'} joined WagerPals
      </p>

      {users.length === 0 ? (
        <p className="text-center text-gray-600 py-12 font-light">No users yet</p>
      ) : (
        <div className="grid gap-4">
          {sortedUsers.map((user, index) => (
            <div
              key={user.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl font-light text-gray-900">
                      @{user.username}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-light rounded">
                        Top Earner
                      </span>
                    )}
                    {user.streak > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-light rounded">
                        🔥 {user.streak} streak
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <div className="text-xs text-gray-500 font-light mb-1">Events Joined</div>
                      <div className="text-xl font-light text-gray-900">{user.events_joined}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-light mb-1">Net Total</div>
                      <div
                        className={`text-xl font-medium ${
                          user.net_total > 0
                            ? 'text-green-600'
                            : user.net_total < 0
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {user.net_total > 0 ? '+' : ''}${user.net_total}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-light mb-1">Win Streak</div>
                      <div className="text-xl font-light text-gray-900">{user.streak}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

