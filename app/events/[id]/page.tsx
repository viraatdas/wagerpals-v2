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

type EventPageData = EventWithStats & {
  is_public?: boolean;
  resolver?: {
    user_id: string;
    username?: string;
  } | null;
};

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
  const user = useUser({ or: "return-null" });
  const [event, setEvent] = useState<EventPageData | null>(null);
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

      setIsPublic(data.is_public || false);

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
        headers: { 'Content-Type': 'application/json', 'x-stack-user-id': user.id },
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
        headers: { 'Content-Type': 'application/json', 'x-stack-user-id': user?.id ?? '' },
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
        headers: { 'Content-Type': 'application/json', 'x-stack-user-id': user?.id ?? '' },
        body: JSON.stringify({
          event_id: event!.id,
        }),
      });

      if (response.ok) {
        router.push('/');
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
      <div className="max-w-4xl mx-auto px-4 py-8 mobile-page">
        <div className="space-y-4">
          <div className="skeleton h-9 w-3/4 rounded-xl" />
          <div className="skeleton h-9 w-40 rounded-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="skeleton h-28 rounded-2xl" />
            <div className="skeleton h-28 rounded-2xl" />
          </div>
          <div className="skeleton h-40 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 mobile-page">
        <div className="glass rounded-3xl text-center py-14 px-6">
          <p className="text-muted font-light">Event not found</p>
        </div>
      </div>
    );
  }

  const isEnded = event.end_time < Date.now();
  const paidResolver = !isPublic ? event.resolver : null;
  const canResolve = event.status === 'active' && (!paidResolver || paidResolver.user_id === user.id);
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
      
      <div className="max-w-4xl mx-auto px-4 py-8 mobile-page animate-rise">
        <div className="mb-6 relative">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="absolute top-0 right-0 hidden sm:inline-flex px-3 py-1 text-sm font-medium text-muted-2 hover:text-neon-rose hover:bg-neon-rose/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete event"
          >
            Delete
          </button>

          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-3 sm:pr-20 break-words leading-tight">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {isEnded ? (
              <span className="chip">⏳ Event ended</span>
            ) : (
              <span className="chip chip-live">
                <span className="live-dot" /> <Countdown endTime={event.end_time} />
              </span>
            )}
            {event.status === 'resolved' && (
              <span className="chip chip-yes">✓ Resolved</span>
            )}
            {paidResolver && (
              <span className="chip text-neon-cyan bg-neon-cyan/10 border-neon-cyan/25 break-all">
                Resolver: @{paidResolver.username || 'Unknown'}
              </span>
            )}
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="mt-3 inline-flex sm:hidden px-3 py-1 text-sm font-medium text-neon-rose hover:bg-neon-rose/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete event"
          >
            Delete Event
          </button>
        </div>

        {event.status === 'resolved' && netResults.length > 0 && (
          <>
            <ResolutionBanner event={event} netResults={netResults} isPublic={isPublic} />
            <div className="mb-6">
              <button
                onClick={handleUnresolve}
                disabled={resolving}
                className="px-4 py-2 text-neon-amber bg-neon-amber/10 border border-neon-amber/30 text-sm font-medium rounded-full hover:bg-neon-amber/20 disabled:opacity-50 transition-colors"
              >
                {resolving ? 'Unresolving...' : 'Unresolve Event'}
              </button>
            </div>
          </>
        )}

        {event.status === 'active' && paidResolver && paidResolver.user_id !== user.id && (
          <div className="glass rounded-2xl p-4 mb-6 text-sm text-muted font-light border-neon-cyan/20">
            @{paidResolver.username || 'The chosen resolver'} is responsible for resolving this paid event.
          </div>
        )}

        {canResolve && (
          <div className="glass rounded-3xl p-5 mb-6">
            <h3 className="font-medium text-foreground mb-3">
              If this event has been resolved, what has it been resolved to?
            </h3>
            <div className="flex gap-2 flex-wrap">
              {[event.side_a, event.side_b].map((side) => (
                <button
                  key={side}
                  onClick={() => handleResolve(side)}
                  disabled={resolving}
                  className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {side}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          {[
            { side: event.side_a, tone: 'mint' as const },
            { side: event.side_b, tone: 'rose' as const },
          ].map(({ side, tone }) => {
            const stats = event.side_stats[side];
            const isMint = tone === 'mint';
            return (
              <div
                key={side}
                className={`glass rounded-3xl p-5 relative overflow-hidden transition-shadow ${
                  isMint
                    ? 'border-neon-mint/25 hover:shadow-[0_0_40px_-12px_var(--neon-mint)]'
                    : 'border-neon-rose/25 hover:shadow-[0_0_40px_-12px_var(--neon-rose)]'
                }`}
              >
                <div
                  className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-40 pointer-events-none ${
                    isMint ? 'bg-neon-mint/40' : 'bg-neon-rose/40'
                  }`}
                />
                <h3 className={`text-lg sm:text-xl font-semibold mb-2 border-b border-white/10 pb-2 break-words ${
                  isMint ? 'text-neon-mint' : 'text-neon-rose'
                }`}>{side}</h3>
                <div className="text-sm text-muted font-light">
                  <div>{stats.count} participants</div>
                  <div className="text-3xl font-semibold text-foreground mt-1 tabular-nums">${stats.total}</div>
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
            <h3 className="font-display text-lg font-semibold text-foreground mb-3">Add a Comment</h3>
            <CommentForm
              eventId={event.id}
              userId={user.id}
              username={username}
              onCommentPosted={fetchEvent}
            />
          </div>
        )}

        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4 border-b-2 border-brand-2/50 pb-2 inline-block">Ledger</h2>
          <div className="mt-6">
            <Ledger
              bets={event.bets}
              comments={comments}
              currentUserId={user?.id}
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
