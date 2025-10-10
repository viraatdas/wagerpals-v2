'use client';

import { useState } from 'react';

export const dynamic = 'force-dynamic';

export default function TestNotifications() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const sendTestNotification = async (title: string, body: string) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          url: '/',
          tag: 'test-notification',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to send notification');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const testCases = [
    {
      name: 'Simple Test',
      title: '🧪 Test Notification',
      body: 'This is a test push notification!',
    },
    {
      name: 'Event Created',
      title: '🎲 New Bet Created!',
      body: 'Will it rain tomorrow? Place your bets now!',
    },
    {
      name: 'Bet Resolved',
      title: '🏆 Bet Resolved',
      body: 'The rain bet has been resolved. Check your winnings!',
    },
    {
      name: 'Emoji Test',
      title: '🎉🔥💰 Emojis Work!',
      body: 'Testing emoji support in notifications 🚀🎊',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔔 Push Notification Tester
          </h1>
          <p className="text-gray-600 mb-8">
            Test your push notifications to make sure they're working correctly.
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">
              📋 Before Testing:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
              <li>Make sure you've enabled notifications on the home page</li>
              <li>Grant permission when your browser asks</li>
              <li>Click any test button below to send a notification</li>
              <li>Check your browser/device for the notification</li>
            </ol>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {testCases.map((test) => (
              <button
                key={test.name}
                onClick={() => sendTestNotification(test.title, test.body)}
                disabled={loading}
                className="p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors text-left"
              >
                <div className="font-semibold mb-1">{test.name}</div>
                <div className="text-sm opacity-90">{test.title}</div>
                <div className="text-xs opacity-75 mt-1">{test.body}</div>
              </button>
            ))}
          </div>

          {/* Custom Test */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold mb-4">Custom Test Message</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get('title') as string;
                const body = formData.get('body') as string;
                sendTestNotification(title, body);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue="Custom Test Notification"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    name="body"
                    defaultValue="Testing custom notification message"
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Sending...' : 'Send Custom Notification'}
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          {result && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">
                ✅ Success!
              </h3>
              <div className="text-sm text-green-800">
                <p>Sent successfully: {result.success || 0}</p>
                <p>Failed: {result.failed || 0}</p>
                {result.success === 0 && (
                  <p className="mt-2 text-amber-700 bg-amber-50 p-2 rounded">
                    ⚠️ No subscribers found. Make sure you've enabled
                    notifications on the home page first!
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">❌ Error</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Debug Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">
              🔍 Debug Info
            </h3>
            <div className="text-xs text-gray-600 space-y-1 font-mono">
              <p>
                VAPID Key:{' '}
                {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                  ? '✅ Set'
                  : '❌ Missing'}
              </p>
              <p>
                Service Worker:{' '}
                {'serviceWorker' in navigator ? '✅ Supported' : '❌ Not supported'}
              </p>
              <p>
                Push API:{' '}
                {'PushManager' in window ? '✅ Supported' : '❌ Not supported'}
              </p>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <a
              href="/"
              className="inline-block px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

