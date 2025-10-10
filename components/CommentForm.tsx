'use client';

import { useState } from 'react';

interface CommentFormProps {
  eventId: string;
  userId: string;
  username: string;
  onCommentPosted: () => void;
}

export default function CommentForm({ eventId, userId, username, onCommentPosted }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          user_id: userId,
          username,
          content: content.trim(),
        }),
      });

      if (response.ok) {
        setContent('');
        onCommentPosted();
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="mb-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 font-light border border-gray-300 rounded-lg focus:border-orange-500 outline-none transition-colors resize-none"
          placeholder="Add a comment..."
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="px-4 py-2 bg-orange-600 text-white rounded-lg font-light hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
      >
        {loading ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
}

