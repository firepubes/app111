import { useState, useEffect } from 'react';
import { initSession, getCurrentSessionId } from '../api/client';

interface UseSessionReturn {
  sessionId: string;
  ready: boolean;
  error: string | null;
}

export function useSession(): UseSessionReturn {
  const [sessionId, setSessionId] = useState(getCurrentSessionId);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    initSession()
      .then((id) => {
        if (!cancelled) {
          setSessionId(id);
          setReady(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Session init failed');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { sessionId, ready, error };
}
