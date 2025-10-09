'use client';

import { useState } from 'react';

interface UsernameModalProps {
  onSubmit: (username: string) => void;
}

export default function UsernameModal({ onSubmit }: UsernameModalProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
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
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 text-lg font-light border-b-2 border-gray-300 focus:border-orange-500 outline-none transition-colors bg-transparent"
              placeholder="your username"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={!username.trim()}
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

