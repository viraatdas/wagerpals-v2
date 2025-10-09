'use client';

import { Event, NetResult, Payment } from '@/lib/types';
import { calculatePayments, formatAmount } from '@/lib/utils';

interface ResolutionBannerProps {
  event: Event;
  netResults: NetResult[];
}

export default function ResolutionBanner({ event, netResults }: ResolutionBannerProps) {
  if (!event.resolution) return null;

  const payments = calculatePayments([...netResults]);
  const sortedResults = [...netResults].sort((a, b) => b.net - a.net);

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-light text-green-900 border-b-2 border-green-600 pb-1 inline-block">Event Resolved</h3>
          <p className="text-green-700 mt-2 font-light">
            Winning side: <span className="font-semibold">{event.resolution.winning_side}</span>
          </p>
        </div>
        <div className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-light">
          Final
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-light text-gray-900 mb-2 border-b border-gray-200 pb-1">Net Results</h4>
          <div className="space-y-1">
            {sortedResults.map((result) => (
              <div
                key={result.user_id}
                className="flex justify-between items-center py-2 px-3 bg-white rounded"
              >
                <span className="text-gray-700 font-light">@{result.username}</span>
                <span
                  className={`font-medium ${
                    result.net > 0
                      ? 'text-green-600'
                      : result.net < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {formatAmount(result.net)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {payments.length > 0 && (
          <div>
            <h4 className="font-light text-gray-900 mb-2 border-b border-gray-200 pb-1">Payments</h4>
            <div className="space-y-1">
              {payments.map((payment, i) => (
                <div
                  key={i}
                  className="py-2 px-3 bg-white rounded text-sm text-gray-700 font-light"
                >
                  <span className="font-medium">{payment.from}</span>
                  {' → '}
                  <span className="font-medium">{payment.to}</span>
                  {': '}
                  <span className="font-semibold">${payment.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

