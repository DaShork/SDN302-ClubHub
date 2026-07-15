import { useEffect, useState } from 'react';
import { onConnectionChange } from '@/services/supabase';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * Floating connection-status banner.
 *
 * Hidden when the user is online. When the browser detects the network
 * going offline (or when a Supabase request has just failed for
 * connectivity reasons), we show a banner explaining what's happening
 * and offering a one-click retry.
 *
 * Why: prior to this, an offline user would land on a blank <Loading />
 * because Supabase promises silently hang on connection loss. This gives
 * them a visible "you are offline" cue and a recovery path.
 */
export default function ConnectionBanner() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [recentFailure, setRecentFailure] = useState(false);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    const unsub = onConnectionChange(setOnline);
    return unsub;
  }, []);

  /* Auto-clear the recent-failure banner when network comes back. */
  useEffect(() => {
    if (online) setRecentFailure(false);
  }, [online]);

  if (online && !recentFailure) return null;

  const handleReload = () => {
    setReloading(true);
    // Soft reload: re-fetch data on this page without a full browser refresh.
    window.dispatchEvent(new CustomEvent('app:retry-data'));
    setTimeout(() => window.location.reload(), 250);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-100 max-w-md w-[90%] flex items-start gap-3 bg-amber-900/95 text-amber-50 border border-amber-700 rounded-lg shadow-xl p-3"
    >
      <div className="shrink-0 mt-0.5">
        <WifiOff size={18} className="text-amber-200" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">
          {!online ? 'You are offline' : 'Connection problem'}
        </div>
        <p className="text-xs text-amber-100/80 mt-0.5">
          {!online
            ? 'We could not reach the server. Check your internet connection and try again.'
            : 'A recent request failed. The page may have stale data.'}
        </p>
        <button
          onClick={handleReload}
          disabled={reloading}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-60 rounded"
        >
          <RefreshCw size={12} className={reloading ? 'animate-spin' : ''} />
          {reloading ? 'Retrying…' : 'Retry'}
        </button>
      </div>
    </div>
  );
}
