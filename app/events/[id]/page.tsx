'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import Countdown from '@/components/Countdown';
import BetForm from '@/components/BetForm';
import Ledger from '@/components/Ledger';
import CommentForm from '@/components/CommentForm';
import ResolutionBanner from '@/components/ResolutionBanner';
import ConfirmationModal from '@/components/ConfirmationModal';
import { EventWithStats, NetResult, Comment } from '@/lib/types';
import { calculateNetResults } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type ConfirmationModalConfig = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  type: 'danger' | 'warning' | 'success';
  onConfirm: () => void;
};

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const user = useUser({ or: null });
  const [event, setEvent] = useState<EventWithStats | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [netResults, setNetResults] = useState<NetResult[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    type: 'danger',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchEvent();
  }, [params.id, user, router]);

  const fetchEvent = async () => {
    if (!params.id) {
      setLoading(false);
      return;
    }
    
    try {
      const [eventResponse, commentsResponse] = await Promise.all([
        fetch(`/api/events?id=${params.id}`),
        fetch(`/api/comments?eventId=${params.id}`)
      ]);
      
      if (!eventResponse.ok) {
        throw new Error(`Failed to fetch event: ${eventResponse.status}`);
      }
      const data = await eventResponse.json();
      
      if (data.error) {
        console.error('Event not found:', data.error);
        setLoading(false);
        return;
      }
      
      setEvent(data);

      // Fetch group info to check if it's public
      if (data.group_id) {
        try {
          const groupResponse = await fetch(`/api/groups?id=${data.group_id}`);
          if (groupResponse.ok) {
            const groupData = await groupResponse.json();
            setIsPublic(groupData.is_public || false);
          }
        } catch (error) {
          console.error('Failed to fetch group info:', error);
        }
      }

      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        setComments(Array.isArray(commentsData) ? commentsData : []);
      }

      if (data.status === 'resolved' && data.resolution) {
        const results = calculateNetResults(data.bets, data.resolution.winning_side);
        setNetResults(results);
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (winningSide: string) => {
    if (!event || !user) return;

    setConfirmationModal({
      isOpen: true,
      title: 'Resolve Event',
      message: `Are you sure you want to resolve this event as "${winningSide}"? This will calculate and update all user balances.`,
      confirmText: 'Resolve',
      type: 'success',
      onConfirm: () => confirmResolve(winningSide),
    });
  };

  const confirmResolve = async (winningSide: string) => {
    if (!user) return;
    
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
    setResolving(true);

    try {
      const response = await fetch('/api/events/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event!.id,
          winning_side: winningSide,
          resolved_by: user.id,
        }),
      });

      if (response.ok) {
        fetchEvent();
      }
    } catch (error) {
      console.error('Failed to resolve event:', error);
    } finally {
      setResolving(false);
    }
  };

  const handleUnresolve = async () => {
    if (!event || !user) return;

    setConfirmationModal({
      isOpen: true,
      title: 'Unresolve Event',
      message: 'Are you sure you want to unresolve this event? This will reverse all balance changes.',
      confirmText: 'Unresolve',
      type: 'warning',
      onConfirm: confirmUnresolve,
    });
  };

  const confirmUnresolve = async () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
    setResolving(true);

    try {
      const response = await fetch('/api/events/unresolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event!.id,
        }),
      });

      if (response.ok) {
        fetchEvent();
      }
    } catch (error) {
      console.error('Failed to unresolve event:', error);
    } finally {
      setResolving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    setConfirmationModal({
      isOpen: true,
      title: 'Delete Event',
      message: `Are you sure you want to delete "${event.title}"? This action cannot be undone and will remove all associated bets.`,
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: confirmDelete,
    });
  };

  const confirmDelete = async () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
    setDeleting(true);

    try {
      const response = await fetch('/api/events/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event!.id,
        }),
      });

      if (response.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setDeleting(false);
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

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 font-light">Event not found</p>
      </div>
    );
  }

  const isEnded = event.end_time < Date.now();
  const canResolve = event.status === 'active';
  const username = user.displayName || user.primaryEmail || 'User';

  return (
    <>
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        type={confirmationModal.type}
        loading={deleting || resolving}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 relative">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="absolute top-0 right-0 px-3 py-1 text-sm font-light text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete event"
          >
            Delete
          </button>
          
          <h1 className="text-3xl font-light text-gray-900 mb-3 pr-20">{event.title}</h1>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-lg text-sm font-light ${
              isEnded ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-800'
            }`}>
              {isEnded ? 'Event ended' : <Countdown endTime={event.end_time} />}
            </div>
            {event.status === 'resolved' && (
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-light">
                Resolved
              </div>
            )}
          </div>
        </div>

        {event.status === 'resolved' && netResults.length > 0 && (
          <>
            <ResolutionBanner event={event} netResults={netResults} isPublic={isPublic} />
            <div className="mb-6">
              <button
                onClick={handleUnresolve}
                disabled={resolving}
                className="px-4 py-2 bg-yellow-600 text-white text-sm font-light rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 transition-colors"
              >
                {resolving ? 'Unresolving...' : 'Unresolve Event'}
              </button>
            </div>
          </>
        )}

        {canResolve && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <h3 className="font-light text-orange-900 mb-2">
              If this event has been resolved, what has it been resolved to?
            </h3>
            <div className="flex gap-2 flex-wrap">
              {[event.side_a, event.side_b].map((side) => (
                <button
                  key={side}
                  onClick={() => handleResolve(side)}
                  disabled={resolving}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 transition-colors font-light"
                >
                  {side}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {[event.side_a, event.side_b].map((side) => {
            const stats = event.side_stats[side];
            return (
              <div
                key={side}
                className="bg-white border-2 border-gray-200 rounded-lg p-4"
              >
                <h3 className="text-xl font-light text-gray-900 mb-2 border-b border-gray-200 pb-2">{side}</h3>
                <div className="text-sm text-gray-600 font-light">
                  <div>{stats.count} participants</div>
                  <div className="text-2xl font-light text-gray-900 mt-1">${stats.total}</div>
                </div>
              </div>
            );
          })}
        </div>

        {event.status === 'active' && user && (
          <div className="mb-6">
            <BetForm
              sides={[event.side_a, event.side_b]}
              eventId={event.id}
              userId={user.id}
              username={username}
              onBetPlaced={fetchEvent}
              isPublic={isPublic}
            />
          </div>
        )}

        {user && (
          <div className="mb-6">
            <h3 className="text-lg font-light text-gray-900 mb-3">Add a Comment</h3>
            <CommentForm
              eventId={event.id}
              userId={user.id}
              username={username}
              onCommentPosted={fetchEvent}
            />
          </div>
        )}

        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-4 border-b-2 border-orange-600 pb-2 inline-block">Ledger</h2>
          <div className="mt-6">
            <Ledger 
              bets={event.bets} 
              comments={comments}
              onBetDeleted={fetchEvent}
              onCommentDeleted={fetchEvent}
              isPublic={isPublic}
            />
          </div>
        </div>
      </div>
    </>
  );
}

