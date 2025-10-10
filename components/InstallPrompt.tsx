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
    <div className="fixed bottom-4 left-4 max-w-sm bg-white rounded-lg shadow-lg p-4 border-2 border-orange-600 z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">📱</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            Install WagerPals
          </h3>
          {isIOS ? (
            <div className="mt-2 text-sm text-gray-600">
              <p className="mb-2">Install this app on your iPhone:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Tap the Share button <span className="inline-block">⎙</span></li>
                <li>Scroll and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right</li>
              </ol>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-600">
              Add WagerPals to your home screen for quick access and a better experience.
            </p>
          )}
          <div className="mt-4 flex gap-2">
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700"
              >
                Install
              </button>
            )}
            <button
              onClick={dismissPrompt}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300"
            >
              {isIOS ? 'Got it' : 'Maybe Later'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

