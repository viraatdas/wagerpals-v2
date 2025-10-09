'use client';

import { useState } from 'react';
import { validateUsername } from '@/lib/utils';

interface UsernameModalProps {
  onSubmit: (username: string) => Promise<void>;
}

export default function UsernameModal({ onSubmit }: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    
    // Real-time validation
    if (value.trim().length > 0) {
      const validation = validateUsername(value);
      setError(validation.valid ? null : validation.error || null);
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateUsername(username);
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid username');
      return;
    }
    
    if (username.trim()) {
      try {
        setError(null);
        await onSubmit(username.trim());
      } catch (error: any) {
        setError(error.message || 'Failed to create username');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extralight text-gray-900 mb-2">
            Welcome to <span className="font-semibold text-orange-600">WagerPals</span>
          </h2>
          <p className="text-gray-600 font-light">Enter your username to continue</p>
          <p className="text-sm text-gray-500 font-light mt-2">
            Returning user? Just enter your existing username
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="text"
              value={username}
              onChange={handleChange}
              className={`w-full px-4 py-3 text-lg font-light border-b-2 ${
                error ? 'border-red-500' : 'border-gray-300 focus:border-orange-500'
              } outline-none transition-colors bg-transparent`}
              placeholder="your username"
              autoFocus
              required
            />
            {error && (
              <p className="text-red-500 text-sm mt-2 font-light">{error}</p>
            )}
            <p className="text-xs text-gray-400 mt-2 font-light">
              Letters, numbers, and underscores only
            </p>
          </div>

          <button
            type="submit"
            disabled={!username.trim() || !!error}
            className="w-full bg-orange-600 text-white py-3 rounded-xl font-light text-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all hover:shadow-lg"
          >
            Continue
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6 font-light">
          No password needed. Just pick a name and start betting!
        </p>
      </div>
    </div>
  );
}

