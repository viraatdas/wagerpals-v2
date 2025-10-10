'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();

  const handleLogout = async () => {
    await user?.signOut();
    router.push('/auth/signin');
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl sm:text-2xl font-extralight text-gray-900 flex-shrink-0">
            Wager<span className="font-semibold text-orange-600">Pals</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-3 md:gap-6">
            <Link
              href="/"
              className={`text-xs sm:text-sm font-light transition-colors ${
                isActive('/')
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Groups
            </Link>
            <Link
              href="/all-events"
              className={`text-xs sm:text-sm font-light transition-colors ${
                isActive('/all-events')
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Events
            </Link>
            <Link
              href="/activity"
              className={`text-xs sm:text-sm font-light transition-colors ${
                isActive('/activity')
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Activity
            </Link>
            <Link
              href="/users"
              className={`text-xs sm:text-sm font-light transition-colors ${
                isActive('/users')
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Users
            </Link>
            <Link
              href="/create"
              className="px-2 py-1.5 sm:px-4 sm:py-2 bg-orange-600 text-white text-xs sm:text-sm font-light rounded-lg hover:bg-orange-700 transition-colors"
            >
              <span className="hidden sm:inline">Create Event</span>
              <span className="sm:hidden">Create</span>
            </Link>
            {user && (
              <div className="hidden md:flex items-center gap-3 ml-2 pl-6 border-l border-gray-300">
                <span className="text-sm font-light text-gray-700">
                  {user.displayName || user.primaryEmail || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs font-light text-gray-500 hover:text-orange-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
            {user && (
              <div className="md:hidden flex items-center ml-1">
                <button
                  onClick={handleLogout}
                  className="text-xs font-light text-gray-600 hover:text-orange-600 transition-colors"
                  title={`${user.displayName || user.primaryEmail} - Sign Out`}
                >
                  {user.displayName?.split(' ')[0] || 'User'}
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

