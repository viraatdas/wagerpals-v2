
'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearCachePage() {
  const [status, setStatus] = useState<string>('Clearing cache...');
  const router = useRouter();

  useEffect(() => {
    const clearCache = async () => {
      try {
        // Unregister all service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
            console.log('Service worker unregistered:', registration);
          }
        }

        // Clear all caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
          console.log('Caches cleared:', cacheNames);
        }

        // Clear local storage
        localStorage.clear();
        
        // Clear session storage
        sessionStorage.clear();

        setStatus('✅ Cache cleared successfully! Redirecting...');
        
        // Wait a bit then redirect to home
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (error) {
        console.error('Error clearing cache:', error);
        setStatus('❌ Error clearing cache. Please try manually refreshing.');
      }
    };

    clearCache();
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <h1 className="text-3xl font-light text-gray-900 mb-4">
          Cache Management
        </h1>
        <p className="text-xl text-gray-700 mb-8">{status}</p>
        
        <div className="text-sm text-gray-600 space-y-2">
          <p>This page will:</p>
          <ul className="list-disc list-inside">
            <li>Unregister service workers</li>
            <li>Clear browser caches</li>
            <li>Clear local storage</li>
            <li>Clear session storage</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

