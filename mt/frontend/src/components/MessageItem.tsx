import { useState } from 'react';
import { Download, File, Paperclip } from 'lucide-react';
import type { Attachment, Message } from '../types';
import { fetchAttachment } from '../api/client';
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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentButton({ messageId, attachment }: { messageId: string; attachment: Attachment }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const blob = await fetchAttachment(messageId, attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className={styles.attachment} onClick={handleDownload} disabled={loading}>
      <File size={18} />
      <span className={styles.attachmentInfo}>
        <strong>{attachment.filename}</strong>
        <small>{attachment.content_type} · {formatSize(attachment.size)}</small>
      </span>
      <Download size={17} />
    </button>
  );
}

export function MessageItem({ message }: MessageItemProps) {
  return (
    <article className={styles.item}>
      <div className={styles.header}>
        <div className={styles.meta}>
          <Badge variant="teal">{message.from_address}</Badge>
          {message.attachments.length > 0 && (
            <Badge variant="muted">
              <Paperclip size={13} /> {message.attachments.length}
            </Badge>
          )}
          <time className={styles.time} dateTime={message.received_at}>
            {formatDate(message.received_at)}
          </time>
        </div>
      </div>

      <h4 className={styles.subject}>{message.subject}</h4>

      <p className={styles.body}>{message.body}</p>

      {message.html_body && message.html_body !== message.body && (
        <details className={styles.htmlPreview}>
          <summary>View HTML version</summary>
          <iframe
            className={styles.htmlFrame}
            title={`HTML version of ${message.subject}`}
            srcDoc={message.html_body}
            sandbox=""
          />
        </details>
      )}

      {message.attachments.length > 0 && (
        <div className={styles.attachments}>
          <div className={styles.attachmentHeading}>
            <Paperclip size={16} />
            Attachments
          </div>
          <div className={styles.attachmentList}>
            {message.attachments.map((attachment) => (
              <AttachmentButton
                key={attachment.id}
                messageId={message.id}
                attachment={attachment}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
