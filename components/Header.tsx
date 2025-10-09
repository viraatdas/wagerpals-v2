'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCookie, deleteCookie } from '@/lib/cookies';

export default function Header() {
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setUsername(getCookie('username'));
  }, []);

  const handleLogout = () => {
    deleteCookie('userId');
    deleteCookie('username');
    window.location.reload();
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-extralight text-gray-900">
            Wager<span className="font-semibold text-orange-600">Pals</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-light transition-colors ${
                isActive('/')
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Home
            </Link>
            <Link
              href="/activity"
              className={`text-sm font-light transition-colors ${
                isActive('/activity')
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Activity
            </Link>
            <Link
              href="/users"
              className={`text-sm font-light transition-colors ${
                isActive('/users')
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Users
            </Link>
            <Link
              href="/create"
              className="px-4 py-2 bg-orange-600 text-white text-sm font-light rounded-lg hover:bg-orange-700 transition-colors"
            >
              Create Event
            </Link>
            {username && (
              <div className="flex items-center gap-3 ml-2 pl-6 border-l border-gray-300">
                <span className="text-sm font-light text-gray-700">@{username}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs font-light text-gray-500 hover:text-orange-600 transition-colors"
                >
                  Switch User
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

