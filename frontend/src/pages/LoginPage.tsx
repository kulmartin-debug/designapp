import { useState } from 'react';
import { login } from '../api/auth';
import { ApiRequestError } from '../api/client';
import { sk } from '../i18n/sk';

export function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message || 'Nesprávne heslo.' : 'Prihlásenie zlyhalo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-line bg-card p-8 shadow-sm">
        <div className="text-center">
          <p className="text-xs font-medium tracking-[0.3em] text-ink-soft">{sk.appTagline.toUpperCase()}</p>
          <h1 className="mt-2 font-serif text-2xl uppercase tracking-[0.15em] text-ink">{sk.appName}</h1>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Heslo"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none"
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full rounded-md bg-ink px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
          >
            Prihlásiť sa
          </button>
        </form>
      </div>
    </div>
  );
}
