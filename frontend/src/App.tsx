import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppRoutes } from './router';
import { sk } from './i18n/sk';
import { getAuthStatus, logout } from './api/auth';
import { LoginPage } from './pages/LoginPage';

function App() {
  const [authRequired, setAuthRequired] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    const status = await getAuthStatus();
    setAuthRequired(status.authRequired);
    setAuthenticated(status.authenticated);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refreshAuth();
    function handleUnauthorized() {
      setAuthenticated(false);
    }
    window.addEventListener('app:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('app:unauthorized', handleUnauthorized);
  }, [refreshAuth]);

  async function handleLogout() {
    await logout();
    setAuthenticated(false);
  }

  if (isLoading) return null;

  if (authRequired && !authenticated) {
    return <LoginPage onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-[0.15em] text-ink">
              {sk.appName.toUpperCase()}
            </span>
            <span className="hidden text-xs tracking-wide text-ink-soft sm:inline">{sk.appTagline}</span>
          </Link>
          <nav className="flex items-center gap-5">
            <Link
              to="/"
              className="text-xs font-medium tracking-[0.2em] text-ink-soft transition-colors hover:text-brand-600"
            >
              PROJEKTY
            </Link>
            <Link
              to="/nastavenia"
              className="text-xs font-medium tracking-[0.2em] text-ink-soft transition-colors hover:text-brand-600"
            >
              NASTAVENIA
            </Link>
            <Link
              to="/popis"
              className="text-xs font-medium tracking-[0.2em] text-ink-soft transition-colors hover:text-brand-600"
            >
              POPIS
            </Link>
            {authRequired && (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="text-xs font-medium tracking-[0.2em] text-ink-soft transition-colors hover:text-brand-600"
              >
                ODHLÁSIŤ
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
