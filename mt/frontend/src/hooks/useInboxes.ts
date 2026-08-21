import { useState, useCallback } from 'react';
import { fetchInboxes, createInbox, deleteInbox } from '../api/client';
import type { Inbox } from '../types';

interface UseInboxesReturn {
  inboxes: Inbox[];
  selectedAddress: string;
  loading: boolean;
  error: string | null;
  setSelectedAddress: (address: string) => void;
  loadInboxes: (selectAddress?: string) => Promise<void>;
  addInbox: (options: { localPart?: string; domain?: string }) => Promise<Inbox>;
  removeInbox: (address: string) => Promise<void>;
}

export function useInboxes(sessionReady: boolean): UseInboxesReturn {
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInboxes = useCallback(async (selectAddress?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInboxes();
      setInboxes(data);

      if (selectAddress && data.some((i) => i.address === selectAddress)) {
        setSelectedAddress(selectAddress);
      } else if (data.length > 0 && data[0]) {
        setSelectedAddress(data[0].address);
      } else {
        setSelectedAddress('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load inboxes');
    } finally {
      setLoading(false);
    }
  }, []);

  const addInbox = useCallback(async (options: { localPart?: string; domain?: string }): Promise<Inbox> => {
    const inbox = await createInbox(options);
    await loadInboxes(inbox.address);
    return inbox;
  }, [loadInboxes]);

  const removeInbox = useCallback(async (address: string) => {
    await deleteInbox(address);
    await loadInboxes();
  }, [loadInboxes]);

  useState(() => {
    if (sessionReady) {
      void loadInboxes();
    }
  });

  return {
    inboxes,
    selectedAddress,
    loading,
    error,
    setSelectedAddress,
    loadInboxes,
    addInbox,
    removeInbox,
  };
}
