'use client';

import { useEffect, useState } from 'react';

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        setIsSubscribed(true);
      } else {
        // Check if user has already dismissed the prompt
        const dismissed = localStorage.getItem('pushNotificationPromptDismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPushNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        setShowPrompt(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (response.ok) {
        console.log('Successfully subscribed to push notifications');
        setIsSubscribed(true);
        setShowPrompt(false);
      } else {
        console.error('Failed to save subscription on server');
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('pushNotificationPromptDismissed', 'true');
  };

  if (!showPrompt || isSubscribed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-2xl border-2 border-orange-500 z-50 overflow-hidden animate-fade-in">
      {/* Orange accent bar */}
      <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
      
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🔔</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              Want Notifications?
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">
              Get notified when new bets are created, placed, and resolved!
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={subscribeToPushNotifications}
                className="w-full px-5 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Yes, Enable Notifications
              </button>
              <button
                onClick={dismissPrompt}
                className="w-full px-5 py-2 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

