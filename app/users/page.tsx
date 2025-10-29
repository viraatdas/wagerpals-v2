
'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';

interface Group {
  id: string;
  name: string;
  member_count: number;
}

interface GroupMember {
  user_id: string;
  username: string;
  role: string;
  status: string;
}

export default function UsersPage() {
  const user = useUser({ or: "return-null" });
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchGroups();
  }, [user, router]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupMembers();
    }
  }, [selectedGroupId]);

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

  const fetchGroups = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/groups?userId=${user.id}`);
      const data = await response.json();
      setGroups(Array.isArray(data) ? data : []);
      
      // Auto-select first group if available
      if (data.length > 0) {
        setSelectedGroupId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await fetch(`/api/groups/members?groupId=${selectedGroupId}`);
      const members = await response.json();
      
      // Filter only active members
      const activeMembers = members.filter((m: GroupMember) => m.status === 'active');
      setGroupMembers(activeMembers);
      
      // Fetch user details for all members
      const userDetailsPromises = activeMembers.map((member: GroupMember) =>
        fetch(`/api/users?id=${member.user_id}`).then(res => res.json())
      );
      
      const userDetails = await Promise.all(userDetailsPromises);
      setUsers(userDetails.filter(u => u && !u.error));
    } catch (error) {
      console.error('Failed to fetch group members:', error);
      setGroupMembers([]);
      setUsers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    // Primary sort: net_total (descending)
    if (b.net_total !== a.net_total) {
      return b.net_total - a.net_total;
    }
    // Secondary sort: total_bet (descending)
    return b.total_bet - a.total_bet;
  });

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 font-light">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extralight text-gray-900 mb-2">
        <span className="font-semibold text-orange-600 border-b-2 border-orange-600">Users</span>
      </h1>
      <p className="text-gray-600 font-light mb-8">
        View members from your groups
      </p>

      {groups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 font-light mb-4">You're not part of any groups yet</p>
          <button
            onClick={() => router.push('/')}
            className="text-orange-600 hover:text-orange-700 font-light border-b border-orange-600"
          >
            Go to Home
          </button>
        </div>
      ) : (
        <>
          {/* Modern Group Selector */}
          <div className="mb-8">
            <label className="block text-sm font-light text-gray-700 mb-3">
              Select Group
            </label>
            <div className="relative group-dropdown">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-6 py-4 flex items-center justify-between hover:border-orange-300 transition-all focus:outline-none focus:border-orange-500"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    {selectedGroup?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{selectedGroup?.name}</div>
                    <div className="text-sm text-gray-500 font-light">
                      {selectedGroup?.member_count} {selectedGroup?.member_count === 1 ? 'member' : 'members'}
                    </div>
                  </div>
                </div>
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
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {groups.map((group) => (
                    <button
                      key={group.id}
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
                          {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                        </div>
                      </div>
                      {selectedGroupId === group.id && (
                        <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Users List */}
          {loadingMembers ? (
            <p className="text-center text-gray-600 font-light py-8">Loading members...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-600 py-12 font-light">No members in this group yet</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 font-light">
                  {users.length} {users.length === 1 ? 'member' : 'members'}
                </p>
              </div>
              <div className="grid gap-4">
                {sortedUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-200 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl font-light text-gray-900">
                            @{user.username}
                          </span>
                          {user.streak > 0 && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              🔥 {user.streak} streak
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <div className="text-xs text-gray-500 font-light mb-1">Total Bet</div>
                            <div className="text-xl font-medium text-blue-600">
                              ${user.total_bet.toFixed(2)}
                            </div>
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
                              {user.net_total > 0 ? '+' : ''}${user.net_total.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 font-light mb-1">Win Streak</div>
                            <div className="text-xl font-light text-gray-900">🔥 {user.streak}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

