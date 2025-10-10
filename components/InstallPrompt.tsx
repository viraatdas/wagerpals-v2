'use client';

import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Check if user has dismissed the prompt
    const dismissed = localStorage.getItem('installPromptDismissed');
    
    if (!isInStandaloneMode && !dismissed) {
      // For Android/Chrome - listen for beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // For iOS - show instructions after a delay
      if (ios && !isInStandaloneMode) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 animate-slide-up">
      <div className="max-w-md mx-auto bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-2xl border border-orange-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-lg">
                📱
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Install WagerPals</h3>
                <p className="text-orange-100 text-xs">Access instantly from your home screen</p>
              </div>
            </div>
            <button
              onClick={dismissPrompt}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {isIOS ? (
            <div className="space-y-4">
              <p className="text-gray-700 font-medium">Follow these steps to install:</p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 text-orange-600 font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium text-sm">Tap the Share button</p>
                    <p className="text-gray-500 text-xs mt-1">Look for <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded text-xs mx-1">↑</span> at the bottom of Safari</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 text-orange-600 font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium text-sm">Scroll down in the menu</p>
                    <p className="text-gray-500 text-xs mt-1">Find and tap "Add to Home Screen"</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 text-orange-600 font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium text-sm">Tap "Add" to confirm</p>
                    <p className="text-gray-500 text-xs mt-1">The app will appear on your home screen</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs text-orange-800">
                  <span className="font-semibold">💡 Tip:</span> Once installed, you'll get push notifications for new bets!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700">
                Get the full experience with offline access, push notifications, and faster loading.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Install Now
                </button>
              </div>
            </div>
          )}

          {isIOS && (
            <button
              onClick={dismissPrompt}
              className="w-full mt-4 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
            >
              Maybe Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

