'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';

export const dynamic = 'force-dynamic';

export default function GroupAdminPage() {
  const params = useParams();
  const router = useRouter();
  const user = useUser();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchGroup(user.id);
  }, [params.id, user, router]);

  const fetchGroup = async (uid: string) => {
    try {
      const response = await fetch(`/api/groups?id=${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch group');
      const data = await response.json();
      
      // Check if user is admin
      const userMember = data.members.find((m: any) => m.user_id === uid);
      if (userMember?.role !== 'admin') {
        router.push(`/groups/${params.id}`);
        return;
      }
      
      setGroup(data);
    } catch (error) {
      console.error('Failed to fetch group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberAction = async (action: string, targetUserId: string) => {
    if (!user) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/groups/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          group_id: params.id,
          target_user_id: targetUserId,
          admin_user_id: user.id,
        }),
      });

      if (response.ok) {
        fetchGroup(user.id);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to perform action');
      }
    } catch (error) {
      console.error('Failed to perform action:', error);
      alert('Failed to perform action');
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return null; // Will redirect to signin
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 font-light">Loading...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 font-light">Group not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.push(`/groups/${params.id}`)}
          className="text-orange-600 hover:text-orange-700 font-light mb-2"
        >
          ← Back to Group
        </button>
        <h1 className="text-3xl font-light text-gray-900">
          Manage {group.name}
        </h1>
        <p className="text-gray-600 font-light">Group Code: {group.id}</p>
      </div>

      {group.pending_requests && group.pending_requests.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-light text-gray-900 mb-4 border-b-2 border-orange-600 pb-2 inline-block">
            Pending Requests
          </h2>
          <div className="space-y-3 mt-6">
            {group.pending_requests.map((member: any) => (
              <div
                key={member.user_id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-light text-gray-900">{member.username}</p>
                  <p className="text-sm text-gray-600 font-light">
                    Requested: {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMemberAction('approve', member.user_id)}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 font-light text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleMemberAction('decline', member.user_id)}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 font-light text-sm"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-light text-gray-900 mb-4 border-b-2 border-gray-400 pb-2 inline-block">
          Members ({group.members.length})
        </h2>
        <div className="space-y-3 mt-6">
          {group.members.map((member: any) => (
            <div
              key={member.user_id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-light text-gray-900">{member.username}</p>
                  <p className="text-sm text-gray-600 font-light">
                    {member.role === 'admin' ? '👑 Admin' : 'Member'}
                  </p>
                </div>
              </div>
              {member.user_id !== group.created_by && member.user_id !== user.id && (
                <div className="flex gap-2">
                  {member.role === 'member' ? (
                    <button
                      onClick={() => handleMemberAction('promote', member.user_id)}
                      disabled={processing}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 font-light text-sm"
                    >
                      Promote to Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMemberAction('demote', member.user_id)}
                      disabled={processing}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 font-light text-sm"
                    >
                      Demote
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${member.username} from the group?`)) {
                        handleMemberAction('remove', member.user_id);
                      }
                    }}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 font-light text-sm"
                  >
                    Remove
                  </button>
                </div>
              )}
              {member.user_id === group.created_by && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded font-light">
                  Creator
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

