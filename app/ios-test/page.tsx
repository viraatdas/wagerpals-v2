'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

export default function IOSTest() {
  const [checks, setChecks] = useState({
    isIOS: false,
    isStandalone: false,
    hasServiceWorker: false,
    hasPushManager: false,
    notificationPermission: '',
    hasSubscription: false,
    vapidKeySet: false,
    isHTTPS: false,
    iOSVersion: '',
  });
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkEnvironment();
  }, []);

  const checkEnvironment = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const notificationPermission = 'Notification' in window ? Notification.permission : 'not-supported';
    const vapidKeySet = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const isHTTPS = window.location.protocol === 'https:';
    
    // Try to detect iOS version
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
    const iOSVersion = match ? `${match[1]}.${match[2]}` : 'Unknown';

    let hasSubscription = false;
    let sub = null;

    if (hasServiceWorker && hasPushManager) {
      try {
        const registration = await navigator.serviceWorker.ready;
        sub = await registration.pushManager.getSubscription();
        hasSubscription = !!sub;
        setSubscription(sub);
      } catch (err) {
        console.error('Error checking subscription:', err);
      }
    }

    setChecks({
      isIOS,
      isStandalone,
      hasServiceWorker,
      hasPushManager,
      notificationPermission,
      hasSubscription,
      vapidKeySet,
      isHTTPS,
      iOSVersion,
    });
  };

  const testSubscription = async () => {
    setError('');
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      console.log('Permission:', permission);

      if (permission !== 'granted') {
        setError('Notification permission denied');
        return;
      }

      // Get service worker
      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker ready:', registration);

      // Subscribe
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError('VAPID key not set');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log('Subscription:', subscription);

      // Save to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (response.ok) {
        setSubscription(subscription);
        await checkEnvironment();
      } else {
        const data = await response.json();
        setError(`Failed to save subscription: ${data.error}`);
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(`Error: ${err.message}`);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const sendTestNotification = async () => {
    setError('');
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🧪 iOS Test',
          body: 'Testing iOS push notification!',
          url: '/',
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Notification sent! Success: ${data.success}, Failed: ${data.failed}`);
      } else {
        setError(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    }
  };

  const getIcon = (value: boolean) => (value ? '✅' : '❌');
  const getColor = (value: boolean) => (value ? 'text-green-600' : 'text-red-600');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">📱 iOS Push Notification Debugger</h1>

        {/* Environment Checks */}
        <div className="space-y-3 mb-6">
          <h2 className="text-lg font-semibold mb-3">Environment Checks:</h2>
          
          <div className={`flex items-center justify-between p-3 rounded ${checks.isIOS ? 'bg-green-50' : 'bg-red-50'}`}>
            <span>Is iOS Device</span>
            <span className={`font-bold ${getColor(checks.isIOS)}`}>
              {getIcon(checks.isIOS)}
            </span>
          </div>

          {checks.isIOS && (
            <div className="pl-4 text-sm text-gray-600">
              iOS Version: {checks.iOSVersion}
              {parseFloat(checks.iOSVersion) < 16.4 && (
                <div className="text-red-600 font-semibold mt-1">
                  ⚠️ iOS 16.4+ required for push notifications!
                </div>
              )}
            </div>
          )}

          <div className={`flex items-center justify-between p-3 rounded ${checks.isStandalone ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <span>Installed as PWA (Add to Home Screen)</span>
            <span className={`font-bold ${getColor(checks.isStandalone)}`}>
              {getIcon(checks.isStandalone)}
            </span>
          </div>

          {!checks.isStandalone && checks.isIOS && (
            <div className="pl-4 text-sm text-amber-700 bg-amber-50 p-2 rounded">
              ⚠️ On iOS, push notifications only work after adding to home screen!
              <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                <li>Tap the Share button in Safari</li>
                <li>Scroll and tap "Add to Home Screen"</li>
                <li>Open the app from your home screen</li>
                <li>Return to this page and test again</li>
              </ol>
            </div>
          )}

          <div className={`flex items-center justify-between p-3 rounded ${checks.isHTTPS ? 'bg-green-50' : 'bg-red-50'}`}>
            <span>HTTPS (Required)</span>
            <span className={`font-bold ${getColor(checks.isHTTPS)}`}>
              {getIcon(checks.isHTTPS)}
            </span>
          </div>

          <div className={`flex items-center justify-between p-3 rounded ${checks.hasServiceWorker ? 'bg-green-50' : 'bg-red-50'}`}>
            <span>Service Worker Support</span>
            <span className={`font-bold ${getColor(checks.hasServiceWorker)}`}>
              {getIcon(checks.hasServiceWorker)}
            </span>
          </div>

          <div className={`flex items-center justify-between p-3 rounded ${checks.hasPushManager ? 'bg-green-50' : 'bg-red-50'}`}>
            <span>Push API Support</span>
            <span className={`font-bold ${getColor(checks.hasPushManager)}`}>
              {getIcon(checks.hasPushManager)}
            </span>
          </div>

          <div className={`flex items-center justify-between p-3 rounded ${checks.vapidKeySet ? 'bg-green-50' : 'bg-red-50'}`}>
            <span>VAPID Key Configured</span>
            <span className={`font-bold ${getColor(checks.vapidKeySet)}`}>
              {getIcon(checks.vapidKeySet)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded bg-gray-50">
            <span>Notification Permission</span>
            <span className={`font-bold ${
              checks.notificationPermission === 'granted' ? 'text-green-600' :
              checks.notificationPermission === 'denied' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {checks.notificationPermission}
            </span>
          </div>

          <div className={`flex items-center justify-between p-3 rounded ${checks.hasSubscription ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <span>Has Active Subscription</span>
            <span className={`font-bold ${getColor(checks.hasSubscription)}`}>
              {getIcon(checks.hasSubscription)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={testSubscription}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            🔔 Subscribe to Notifications
          </button>

          <button
            onClick={sendTestNotification}
            disabled={!checks.hasSubscription}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
          >
            📤 Send Test Notification
          </button>

          <button
            onClick={checkEnvironment}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            🔄 Refresh Checks
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Subscription Details */}
        {subscription && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Subscription Details:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(subscription.toJSON(), null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📋 iOS Requirements:</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>iOS 16.4 or later</li>
            <li>Safari browser (not Chrome/Firefox)</li>
            <li>Must be added to Home Screen</li>
            <li>HTTPS required (localhost doesn't work on iOS)</li>
            <li>Must grant notification permission</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-orange-600 hover:text-orange-700">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

