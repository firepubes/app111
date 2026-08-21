import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Inbox,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { CreateInbox } from '../components/CreateInbox';
import { LoadingState } from '../components/LoadingState';
import { MessageList } from '../components/MessageList';
import { useConfig } from '../hooks/useConfig';
import { useInboxes } from '../hooks/useInboxes';
import { useMessages } from '../hooks/useMessages';
import { useSession } from '../hooks/useSession';

import styles from './MailApp.module.css';

export default function MailApp() {
  const { config, loading: configLoading, error: configError } = useConfig();
  const { ready: sessionReady, error: sessionError } = useSession();

  const {
    inboxes,
    selectedAddress,
    setSelectedAddress,
    loadInboxes,
    addInbox,
    removeInbox,
  } = useInboxes(sessionReady);

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    refresh: refreshMessages,
  } = useMessages(selectedAddress);

  const [showCreateBox, setShowCreateBox] = useState(false);
  const [copying, setCopying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (sessionReady && config) {
      void loadInboxes();
    }
  }, [sessionReady, config, loadInboxes]);

  useEffect(() => {
    if (config) {
      document.title = `${config.appName} — MailTune`;
    }
  }, [config]);

  const handleCreateCustom = useCallback(
    async (localPart: string, domain: string) => {
      try {
        await addInbox({ localPart, domain });
        setShowCreateBox(false);
        toast.success('Inbox created');
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to create inbox'
        );
      }
    },
    [addInbox]
  );

  const handleCreateRandom = useCallback(
    async (domain: string) => {
      try {
        await addInbox({ domain });
        setShowCreateBox(false);
        toast.success('Inbox created');
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to create inbox'
        );
      }
    },
    [addInbox]
  );

  const handleDelete = useCallback(async () => {
    if (!selectedAddress) return;

    const confirmed = window.confirm(
      `Remove ${selectedAddress} from your current session?`
    );

    if (!confirmed) return;

    try {
      await removeInbox(selectedAddress);
      toast.success('Inbox removed');
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to remove inbox'
      );
    }
  }, [selectedAddress, removeInbox]);

  const handleCopy = useCallback(async () => {
    if (!selectedAddress) return;

    try {
      setCopying(true);
      await navigator.clipboard.writeText(selectedAddress);
      toast.success('Address copied');
    } catch {
      toast.error('Unable to copy address');
    } finally {
      setTimeout(() => setCopying(false), 500);
    }
  }, [selectedAddress]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);
      await refreshMessages();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [refreshMessages, refreshing]);

  if (configError || sessionError) {
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>
            <Mail size={22} />
          </div>

          <span>MAILTUNE</span>
          <h2>Connection unavailable</h2>

          <p>{configError || sessionError}</p>
        </div>

        <Toaster position="bottom-right" />
      </div>
    );
  }

  if (configLoading || !config) {
    return (
      <div className={styles.loadingPage}>
        <LoadingState lines={6} />
        <Toaster position="bottom-right" />
      </div>
    );
  }

  const domains = config.mailDomains ?? [config.mailDomain];

  return (
    <div className={styles.page}>
      <div className={styles.background} />

      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <Mail size={17} />
          </div>

          <div>
            <strong>MailTune</strong>
            <span>by Ratiodevelopment</span>
          </div>
        </div>

        <div className={styles.systemStatus}>
          <span />
          System operational
        </div>
      </header>

      <main className={styles.layout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <button
            className={styles.newInboxButton}
            onClick={() => setShowCreateBox((value) => !value)}
          >
            <Plus size={17} />
            New inbox
          </button>

          <div className={styles.sidebarSection}>
            <span className={styles.sidebarLabel}>YOUR INBOXES</span>

            <div className={styles.inboxList}>
              {inboxes.length === 0 ? (
                <div className={styles.emptyInboxes}>
                  <Inbox size={18} />
                  <span>No inboxes yet</span>
                </div>
              ) : (
                inboxes.map((inbox) => (
                  <button
                    key={inbox.address}
                    className={`${styles.inboxItem} ${
                      selectedAddress === inbox.address
                        ? styles.inboxItemActive
                        : ''
                    }`}
                    onClick={() => setSelectedAddress(inbox.address)}
                  >
                    <div className={styles.inboxItemIcon}>
                      <Mail size={15} />
                    </div>

                    <span>{inbox.address}</span>

                    {selectedAddress === inbox.address && (
                      <CheckCircle2 size={14} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className={styles.sidebarBottom}>
            <div className={styles.expiryInfo}>
              <div className={styles.expiryIcon}>
                <RefreshCw size={15} />
              </div>

              <div>
                <strong>Automatic cleanup</strong>
                <span>
                  {config.expiryDays === 0
                    ? 'Disabled'
                    : `${config.expiryDays} day${
                        config.expiryDays === 1 ? '' : 's'
                      }`}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main inbox */}
        <section className={styles.workspace}>
          <div className={styles.workspaceHeader}>
            <div>
              <span className={styles.sectionLabel}>MAILBOX</span>
              <h1>Inbox</h1>
            </div>

            <div className={styles.toolbar}>
              <button
                className={styles.iconButton}
                onClick={handleRefresh}
                title="Refresh inbox"
              >
                {refreshing ? (
                  <Loader2 size={17} className={styles.spin} />
                ) : (
                  <RefreshCw size={17} />
                )}
              </button>

              <button
                className={`${styles.iconButton} ${styles.dangerButton}`}
                onClick={handleDelete}
                disabled={!selectedAddress}
                title="Remove inbox"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>

          {showCreateBox && (
            <div className={styles.createPanel}>
              <CreateInbox
                domains={domains}
                onCreateCustom={handleCreateCustom}
                onCreateRandom={handleCreateRandom}
              />
            </div>
          )}

          <div className={styles.addressCard}>
            <div className={styles.addressDetails}>
              <span>ACTIVE ADDRESS</span>

              <strong>
                {selectedAddress || 'Create an inbox to get started'}
              </strong>

              {selectedAddress && (
                <div className={styles.receiving}>
                  <span />
                  Receiving incoming mail
                </div>
              )}
            </div>

            {selectedAddress && (
              <button
                className={styles.copyButton}
                onClick={handleCopy}
                disabled={copying}
              >
                {copying ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {copying ? 'Copied' : 'Copy address'}
              </button>
            )}
          </div>

          <div className={styles.messagePanel}>
            <div className={styles.messagePanelHeader}>
              <div>
                <strong>Messages</strong>
                <span>
                  {messages.length}{' '}
                  {messages.length === 1 ? 'message' : 'messages'}
                </span>
              </div>

              {selectedAddress && (
                <button onClick={handleRefresh}>
                  <RefreshCw size={14} />
                  Refresh
                </button>
              )}
            </div>

            <div className={styles.messageContent}>
              <MessageList
                address={selectedAddress}
                messages={messages}
                loading={messagesLoading}
                error={messagesError}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>MailTune</span>
        <span>Ratiodevelopment</span>
        <span>Receive-only temporary email</span>
      </footer>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
        }}
      />
    </div>
  );
}