'use client';

import { Bet } from '@/lib/types';
import { formatTimestamp, formatAmount } from '@/lib/utils';

interface LedgerProps {
  bets: Bet[];
}

export default function Ledger({ bets }: LedgerProps) {
  const sortedBets = [...bets].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-3">
      {sortedBets.length === 0 ? (
        <p className="text-gray-500 text-center py-8 font-light">No entries yet. Be the first!</p>
      ) : (
        sortedBets.map((bet) => (
          <div
            key={bet.id}
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
                  <span className="font-semibold text-gray-900">${bet.amount}</span>
                  {bet.is_late && (
                    <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-xs font-light rounded">
                      Late
                    </span>
                  )}
                </div>
                {bet.note && (
                  <p className="text-sm text-gray-600 mt-2 font-light italic">{bet.note}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 ml-2 font-light">
                {formatTimestamp(bet.timestamp)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

