import { useMemo, useState } from 'react';
import { ArrowLeft, Download, FileText, Image as ImageIcon, Inbox, MailOpen, Paperclip } from 'lucide-react';
import type { Attachment, Message } from '../types';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import styles from './MessageList.module.css';

interface MessageListProps { address: string; messages: Message[]; loading: boolean; error: string | null; }

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? dateStr : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function parseAttachments(value: Message['attachments']): Attachment[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed as Attachment[] : []; } catch { return []; }
}

function AttachmentCard({ attachment }: { attachment: Attachment }) {
  const href = attachment.data ? `data:${attachment.mimeType};base64,${attachment.data}` : '#';
  const image = attachment.mimeType.startsWith('image/');
  const size = attachment.size < 1024 * 1024 ? `${Math.max(1, Math.round(attachment.size / 1024))} KB` : `${(attachment.size / 1024 / 1024).toFixed(1)} MB`;
  return (
    <div className={styles.attachmentCard}>
      {image && attachment.data ? <img className={styles.attachmentPreview} src={href} alt={attachment.filename} /> : <div className={styles.fileIcon}>{image ? <ImageIcon size={22} /> : <FileText size={22} />}</div>}
      <div className={styles.attachmentMeta}><strong title={attachment.filename}>{attachment.filename}</strong><span>{attachment.mimeType} · {size}</span></div>
      {attachment.data && <a className={styles.downloadButton} href={href} download={attachment.filename} title="Download attachment"><Download size={16} /></a>}
    </div>
  );
}

export function MessageList({ address, messages, loading, error }: MessageListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => messages.find((message) => message.id === selectedId) ?? null, [messages, selectedId]);

  if (loading) return <div className={styles.panel}><LoadingState lines={5} /></div>;
  if (error) return <div className={styles.panel}><EmptyState icon={<Inbox />} title="Error loading messages" description={error} /></div>;
  if (!address) return <div className={styles.panel}><EmptyState icon={<Inbox />} title="No inbox selected" description="Create a new inbox or select one to start receiving mail." /></div>;

  if (selected) {
    const attachments = parseAttachments(selected.attachments);
    return (
      <section className={styles.reader}>
        <button className={styles.backButton} onClick={() => setSelectedId(null)}><ArrowLeft size={16} /> Back to messages</button>
        <header className={styles.readerHeader}>
          <h2>{selected.subject || '(no subject)'}</h2>
          <time>{formatDate(selected.received_at)}</time>
          <div className={styles.sender}><span>From</span><strong>{selected.from_address}</strong></div>
          <div className={styles.recipient}><span>To</span><strong>{selected.inbox_address}</strong></div>
        </header>
        {selected.html_body ? <iframe className={styles.emailFrame} title={selected.subject || 'Email content'} sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={selected.html_body} /> : <div className={styles.plainBody}>{selected.body || '(empty message)'}</div>}
        {attachments.length > 0 && <section className={styles.attachments}><div className={styles.attachmentTitle}><Paperclip size={16} /> Attachments <span>{attachments.length}</span></div>{attachments.map((attachment, index) => <AttachmentCard key={`${attachment.filename}-${index}`} attachment={attachment} />)}</section>}
      </section>
    );
  }

  return (
    <section className={styles.list}>
      {messages.length === 0 ? <EmptyState icon={<MailOpen />} title="Inbox is empty" description="Emails sent to this address will appear here." /> : messages.map((message) => {
        const attachments = parseAttachments(message.attachments);
        return <button key={message.id} className={styles.messageRow} onClick={() => setSelectedId(message.id)}>
          <span className={styles.senderAvatar}>{(message.from_address[0] || '?').toUpperCase()}</span>
          <span className={styles.rowMain}><strong title={message.from_address}>{message.from_address}</strong><span className={styles.rowSubject}>{message.subject || '(no subject)'}</span><span className={styles.rowPreview}>{message.body || 'HTML email'}</span></span>
          <span className={styles.rowRight}>{attachments.length > 0 && <Paperclip size={15} />}<time>{formatDate(message.received_at)}</time></span>
        </button>;
      })}
    </section>
  );
}
