import { useState, useEffect } from 'react';
import { fetchConfig } from '../api/client';
import type { Config } from '../types';

interface UseConfigReturn {
  config: Config | null;
  loading: boolean;
  error: string | null;
}

export function useConfig(): UseConfigReturn {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchConfig()
      .then((data) => {
        if (!cancelled) {
          setConfig(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load config');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading, error };
}
