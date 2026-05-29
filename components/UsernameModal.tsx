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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-3xl max-w-md w-full p-8 animate-slide-up relative overflow-hidden">
        {/* decorative ember glow */}
        <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-brand-2/20 blur-3xl" />

        <div className="text-center mb-6 relative">
          <h2 className="font-display text-3xl font-semibold text-foreground mb-2">
            Welcome to <span className="text-gradient">WagerPals</span>
          </h2>
          <p className="text-muted">Enter your username to continue</p>
          <p className="text-sm text-muted-2 mt-2">
            Returning user? Just enter your existing username
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="mb-6">
            <input
              type="text"
              inputMode="text"
              value={username}
              onChange={handleChange}
              onClick={(e) => e.currentTarget.focus()}
              onTouchStart={(e) => e.currentTarget.focus()}
              className={`w-full px-4 py-3 text-lg bg-white/5 border text-foreground placeholder:text-muted-2 rounded-xl outline-none transition ${
                error
                  ? 'border-neon-rose/50 focus:ring-2 focus:ring-neon-rose/20'
                  : 'border-white/10 focus:border-brand-2/50 focus:ring-2 focus:ring-brand-2/20'
              }`}
              placeholder="your username"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              required
            />
            {error && (
              <p className="text-neon-rose text-sm mt-2">{error}</p>
            )}
            <p className="text-xs text-muted-2 mt-2">
              Letters, numbers, and underscores only
            </p>
          </div>

          <button
            type="submit"
            disabled={!username.trim() || !!error}
            className="btn-primary w-full py-3 text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Continue
          </button>
        </form>

        <p className="text-xs text-muted-2 text-center mt-6 relative">
          No password needed. Just pick a name and start betting!
        </p>
      </div>
    </div>
  );
}

