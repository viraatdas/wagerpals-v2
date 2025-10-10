'use client';

import { useState } from 'react';
import { Bet, Comment } from '@/lib/types';
import { formatTimestamp, formatAmount } from '@/lib/utils';
import ConfirmationModal from './ConfirmationModal';

interface LedgerProps {
  bets: Bet[];
  comments?: Comment[];
  onBetDeleted?: () => void;
  onCommentDeleted?: () => void;
}

type LedgerEntry = (Bet & { type: 'bet' }) | (Comment & { type: 'comment' });

export default function Ledger({ bets, comments = [], onBetDeleted, onCommentDeleted }: LedgerProps) {
  const [deletingBets, setDeletingBets] = useState<Set<string>>(new Set());
  const [deletingComments, setDeletingComments] = useState<Set<string>>(new Set());
  const [betToDelete, setBetToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  
  // Combine bets and comments
  const entries: LedgerEntry[] = [
    ...bets.map(bet => ({ ...bet, type: 'bet' as const })),
    ...comments.map(comment => ({ ...comment, type: 'comment' as const }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const handleDeleteBet = async (betId: string) => {
    setBetToDelete(betId);
  };

  const confirmDeleteBet = async () => {
    if (!betToDelete) return;

    setBetToDelete(null);
    setDeletingBets(prev => new Set(prev).add(betToDelete));

    try {
      const response = await fetch(`/api/bets?id=${betToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete bet');
      }

      if (onBetDeleted) {
        onBetDeleted();
      }
    } catch (error: any) {
      console.error('Failed to delete bet:', error);
      alert(`Failed to delete bet: ${error.message}`);
    } finally {
      setDeletingBets(prev => {
        const newSet = new Set(prev);
        newSet.delete(betToDelete);
        return newSet;
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setCommentToDelete(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    setCommentToDelete(null);
    setDeletingComments(prev => new Set(prev).add(commentToDelete));

    try {
      const response = await fetch(`/api/comments?id=${commentToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete comment');
      }

      if (onCommentDeleted) {
        onCommentDeleted();
      }
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      alert(`Failed to delete comment: ${error.message}`);
    } finally {
      setDeletingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentToDelete);
        return newSet;
      });
    }
  };

  const getBetDetails = (betId: string) => {
    const bet = bets.find(b => b.id === betId);
    if (!bet) return '';
    return `@${bet.username}'s $${bet.amount.toFixed(2)} bet on ${bet.side}`;
  };

  const getCommentDetails = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return '';
    return `@${comment.username}'s comment`;
  };

  return (
    <>
      <ConfirmationModal
        isOpen={betToDelete !== null}
        onClose={() => setBetToDelete(null)}
        onConfirm={confirmDeleteBet}
        title="Delete Bet"
        message={`Are you sure you want to delete ${betToDelete ? getBetDetails(betToDelete) : 'this bet'}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        loading={betToDelete !== null && deletingBets.has(betToDelete)}
      />
      
      <ConfirmationModal
        isOpen={commentToDelete !== null}
        onClose={() => setCommentToDelete(null)}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        message={`Are you sure you want to delete ${commentToDelete ? getCommentDetails(commentToDelete) : 'this comment'}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        loading={commentToDelete !== null && deletingComments.has(commentToDelete)}
      />
      
      <div className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-gray-500 text-center py-8 font-light">No entries yet. Be the first!</p>
        ) : (
          entries.map((entry) => {
            if (entry.type === 'bet') {
              const bet = entry;
              return (
                <div
                  key={`bet-${bet.id}`}
                  className={`bg-white border rounded-lg p-4 ${
                    bet.is_late ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">@{bet.username}</span>
                        <span className="text-gray-500">→</span>
                        <span className="font-light text-gray-700">{bet.side}</span>
                        <span className="font-semibold text-gray-900">${bet.amount.toFixed(2)}</span>
                        {bet.is_late && (
                          <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-xs font-light rounded">
                            Late
                          </span>
                        )}
                      </div>
                      {bet.note && (
                        <p className="text-sm text-gray-600 mt-2 font-light italic">
                          "{bet.note}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-light">
                        {formatTimestamp(bet.timestamp)}
                      </span>
                      <button
                        onClick={() => handleDeleteBet(bet.id)}
                        disabled={deletingBets.has(bet.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-light px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete bet"
                      >
                        {deletingBets.has(bet.id) ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            } else {
              const comment = entry;
              return (
                <div
                  key={`comment-${comment.id}`}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-medium text-gray-900">@{comment.username}</span>
                        <span className="px-2 py-0.5 bg-blue-200 text-blue-800 text-xs font-light rounded">
                          💬 Comment
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 font-light">
                        {comment.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-light">
                        {formatTimestamp(comment.timestamp)}
                      </span>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingComments.has(comment.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-light px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete comment"
                      >
                        {deletingComments.has(comment.id) ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          })
        )}
      </div>
    </>
  );
}
