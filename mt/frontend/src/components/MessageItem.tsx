import type { Message } from '../types';
import { Badge } from './Badge';
import styles from './MessageItem.module.css';

interface MessageItemProps {
  message: Message;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function MessageItem({ message }: MessageItemProps) {
  return (
    <article className={styles.item}>
      <div className={styles.header}>
        <div className={styles.meta}>
          <Badge variant="teal">{message.from_address}</Badge>
          <time className={styles.time} dateTime={message.received_at}>
            {formatDate(message.received_at)}
          </time>
        </div>
      </div>
      <h4 className={styles.subject}>{message.subject}</h4>
      <p className={styles.body}>{message.body}</p>
    </article>
  );
}
