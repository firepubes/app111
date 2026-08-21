import { useState, useEffect, useCallback } from 'react';
import { fetchMessages } from '../api/client';
import type { Message } from '../types';

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMessages(address: string): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!address) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchMessages(address);
      setMessages(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  return {
    messages,
    loading,
    error,
    refresh: loadMessages,
  };
}
