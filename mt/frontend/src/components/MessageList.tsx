import { Inbox, MailOpen } from 'lucide-react';
import type { Message } from '../types';
import { MessageItem } from './MessageItem';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { Badge } from './Badge';
import styles from './MessageList.module.css';

interface MessageListProps {
  address: string;
  messages: Message[];
  loading: boolean;
  error: string | null;
}

export function MessageList({ address, messages, loading, error }: MessageListProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle}>
          {address || 'No inbox selected'}
        </h2>
        <Badge variant={messages.length > 0 ? 'orange' : 'muted'}>
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </Badge>
      </div>

      <div className={styles.panelBody}>
        {loading ? (
          <LoadingState lines={4} />
        ) : error ? (
          <EmptyState
            icon={<Inbox />}
            title="Error loading messages"
            description={error}
          />
        ) : !address ? (
          <EmptyState
            icon={<Inbox />}
            title="No inbox selected"
            description="Create a new inbox or select one from the dropdown above."
          />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<MailOpen />}
            title="Inbox is empty"
            description="Emails sent to this address will appear here. Hit refresh to check."
          />
        ) : (
          messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))
        )}
      </div>
    </section>
  );
}
