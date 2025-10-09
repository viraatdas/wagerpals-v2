'use client';

import { useState } from 'react';

interface BetFormProps {
  sides: string[];
  eventId: string;
  userId: string;
  username: string;
  onBetPlaced: () => void;
}

export default function BetForm({ sides, eventId, userId, username, onBetPlaced }: BetFormProps) {
  const [selectedSide, setSelectedSide] = useState(sides[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseInt(amount) <= 0) return;

    setLoading(true);

    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          user_id: userId,
          username,
          side: selectedSide,
          amount: parseInt(amount),
          note: note.trim() || undefined,
        }),
      });

      if (response.ok) {
        setAmount('');
        setNote('');
        onBetPlaced();
      }
    } catch (error) {
      console.error('Failed to place bet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-light mb-4 border-b border-gray-200 pb-2">Place Your Bet</h3>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-light text-gray-700 mb-3">
            Pick a side
          </label>
          <div className="grid grid-cols-2 gap-2">
            {sides.map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setSelectedSide(side)}
                className={`px-4 py-2 rounded-lg font-light transition-colors ${
                  selectedSide === side
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {side}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-light text-gray-700 mb-3">
            Amount ($)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            className="w-full px-3 py-2 font-light border-b-2 border-gray-300 focus:border-orange-500 outline-none transition-colors bg-transparent"
            placeholder="10"
            required
          />
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-light text-gray-700 mb-3">
            Note (optional)
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 font-light border-b-2 border-gray-300 focus:border-orange-500 outline-none transition-colors bg-transparent resize-none"
            placeholder="Your prediction or reasoning..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || !amount || parseInt(amount) <= 0}
          className="w-full bg-orange-600 text-white py-3 rounded-xl font-light hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all hover:shadow-lg"
        >
          {loading ? 'Placing...' : 'Place Bet'}
        </button>
      </div>
    </form>
  );
}

