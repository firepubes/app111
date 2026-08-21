import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Activity, Code2, Database, Download, Eye, FileText, Inbox, LockKeyhole, Mail, Paperclip, RefreshCw, Search, ShieldAlert, Trash2, X, Clock3 } from 'lucide-react';
import styles from './Admin.module.css';

type Attachment = { id: string; filename: string; content_type: string; size: number };
type Message = { id: string; inbox_address: string; from_address: string; subject: string; body: string; html_body?: string | null; received_at: string; attachments?: Attachment[] };
type Stats = { inboxes: number; messages: number; attachments: number; messagesLast24h?: number };
type AdminInbox = { address: string; created_at: string; message_count: number };

const formatBytes = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
const cleanPreview = (value: string) => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);

export default function Admin() {
  const [key, setKey] = useState(() => sessionStorage.getItem('ratiomail-admin-key') || '');
  const [input, setInput] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [inboxes, setInboxes] = useState<AdminInbox[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedInbox, setSelectedInbox] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [inboxSearch, setInboxSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [showHtml, setShowHtml] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const headers = useMemo(() => ({ 'x-admin-key': key }), [key]);

  const load = useCallback(async (adminKey: string) => {
    if (!adminKey) return;
    setLoading(true); setError('');
    try {
      const h = { 'x-admin-key': adminKey };
      const [statsResponse, inboxResponse] = await Promise.all([
        fetch('/api/admin/stats', { headers: h }),
        fetch('/api/admin/inboxes', { headers: h }),
      ]);
      if (!statsResponse.ok || !inboxResponse.ok) throw new Error('Invalid admin key or admin API unavailable.');
      setStats(await statsResponse.json() as Stats);
      setInboxes(await inboxResponse.json() as AdminInbox[]);
      setKey(adminKey);
      sessionStorage.setItem('ratiomail-admin-key', adminKey);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load admin dashboard.'); }
    finally { setLoading(false); }
  }, []);

  const loadMessages = useCallback(async (address: string) => {
    setSelectedInbox(address); setSelectedMessage(null); setMessageSearch(''); setLoading(true); setError('');
    try {
      const response = await fetch(`/api/admin/inboxes/${encodeURIComponent(address)}/messages`, { headers });
      if (!response.ok) throw new Error('Unable to load inbox messages.');
      setMessages(await response.json() as Message[]);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load messages.'); }
    finally { setLoading(false); }
  }, [headers]);

  useEffect(() => { const saved = sessionStorage.getItem('ratiomail-admin-key'); if (saved) void load(saved); }, [load]);
  useEffect(() => {
    if (!key || !autoRefresh) return;
    const timer = window.setInterval(() => void load(key), 30000);
    return () => window.clearInterval(timer);
  }, [key, autoRefresh, load]);

  const login = async (event: FormEvent) => { event.preventDefault(); await load(input.trim()); };

  const deleteInbox = async (address: string) => {
    if (!window.confirm(`Permanently delete ${address} and all of its messages?`)) return;
    const response = await fetch(`/api/admin/inboxes/${encodeURIComponent(address)}`, { method: 'DELETE', headers });
    if (!response.ok) { setError('Failed to delete inbox.'); return; }
    if (selectedInbox === address) { setSelectedInbox(null); setMessages([]); setSelectedMessage(null); }
    await load(key);
  };

  const deleteMessage = async (id: string) => {
    if (!window.confirm('Permanently delete this message and its attachments?')) return;
    const response = await fetch(`/api/admin/messages/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
    if (!response.ok) { setError('Failed to delete message.'); return; }
    setSelectedMessage(null);
    if (selectedInbox) await loadMessages(selectedInbox);
    await load(key);
  };

  const fetchAttachment = async (attachment: Attachment) => {
    const response = await fetch(`/api/admin/attachments/${encodeURIComponent(attachment.id)}`, { headers });
    if (!response.ok) throw new Error('Unable to retrieve attachment.');
    return response.blob();
  };

  const openAttachment = async (attachment: Attachment) => {
    try { const url = URL.createObjectURL(await fetchAttachment(attachment)); window.open(url, '_blank', 'noopener,noreferrer'); window.setTimeout(() => URL.revokeObjectURL(url), 60000); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to open attachment.'); }
  };

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const url = URL.createObjectURL(await fetchAttachment(attachment));
      const link = document.createElement('a'); link.href = url; link.download = attachment.filename; document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to download attachment.'); }
  };

  const logout = () => { sessionStorage.removeItem('ratiomail-admin-key'); setKey(''); setStats(null); setInboxes([]); setMessages([]); setSelectedInbox(null); setSelectedMessage(null); };

  if (!key || !stats) return <div className={styles.page}><div className={styles.loginCard}>
    <div className={styles.logo}><LockKeyhole size={22} /></div><span className={styles.eyebrow}>RATIOMAIL CONTROL</span><h1>Administrator access</h1>
    <p>Private control panel for monitoring, inspection and moderation.</p>
    <form onSubmit={login}><input type="password" value={input} onChange={e => setInput(e.target.value)} placeholder="Admin key" autoFocus /><button type="submit" disabled={!input || loading}>{loading ? 'Checking…' : 'Sign in'}</button></form>
    {error && <div className={styles.error}><ShieldAlert size={17} />{error}</div>}
  </div></div>;

  const filteredInboxes = inboxes.filter(i => i.address.toLowerCase().includes(inboxSearch.toLowerCase()));
  const filteredMessages = messages.filter(m => `${m.subject} ${m.from_address} ${m.body}`.toLowerCase().includes(messageSearch.toLowerCase()));

  return <div className={styles.page}>
    <header className={styles.header}><div><span className={styles.eyebrow}>RATIOMAIL CONTROL</span><h1>Administration</h1><p>Inspect temporary mail activity and manage stored content.</p></div>
      <div className={styles.headerActions}><label className={styles.toggle}><input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} /> Auto refresh</label><button onClick={() => void load(key)} disabled={loading}><RefreshCw size={16} /> Refresh</button><button onClick={logout}>Sign out</button></div>
    </header>

    <section className={styles.stats}>
      {[
        { label: 'Inboxes', value: stats.inboxes, Icon: Inbox },
        { label: 'Messages', value: stats.messages, Icon: Mail },
        { label: 'Last 24 hours', value: stats.messagesLast24h ?? '—', Icon: Activity },
        { label: 'Attachments', value: stats.attachments, Icon: Database },
      ].map(({ label, value, Icon }) => <article key={label}><div><Icon size={19} /></div><span>{label}</span><strong>{value}</strong></article>)}
    </section>

    {error && <div className={styles.errorBanner}><ShieldAlert size={17} />{error}<button onClick={() => setError('')}><X size={15} /></button></div>}

    <section className={styles.workspace}>
      <aside className={styles.inboxPanel}>
        <div className={styles.panelHeader}><div><span className={styles.eyebrow}>MAILBOXES</span><h2>Temporary inboxes</h2></div><div className={styles.live}><Activity size={15} /> Live</div></div>
        <div className={styles.search}><Search size={16} /><input value={inboxSearch} onChange={e => setInboxSearch(e.target.value)} placeholder="Search inboxes…" /></div>
        <div className={styles.table}>{filteredInboxes.length === 0 ? <div className={styles.empty}>No matching inboxes.</div> : filteredInboxes.map(inbox => <button className={`${styles.rowButton} ${selectedInbox === inbox.address ? styles.selected : ''}`} key={inbox.address} onClick={() => void loadMessages(inbox.address)}>
          <div className={styles.address}><Inbox size={17} /><div><strong>{inbox.address}</strong><span>{new Date(inbox.created_at).toLocaleString()}</span></div></div><span className={styles.count}>{inbox.message_count}</span><span className={styles.rowDelete} onClick={e => { e.stopPropagation(); void deleteInbox(inbox.address); }} title="Delete inbox"><Trash2 size={15} /></span>
        </button>)}</div>
      </aside>

      <main className={styles.messagePanel}>
        <div className={styles.panelHeader}><div><span className={styles.eyebrow}>MESSAGE INSPECTOR</span><h2>{selectedInbox || 'Select an inbox'}</h2></div>{selectedInbox && <span className={styles.live}>{filteredMessages.length}/{messages.length} messages</span>}</div>
        {selectedInbox ? <div className={styles.messageWorkspace}>
          <div className={styles.messageList}>
            <div className={styles.search}><Search size={16} /><input value={messageSearch} onChange={e => setMessageSearch(e.target.value)} placeholder="Search sender, subject or body…" /></div>
            {filteredMessages.length === 0 ? <div className={styles.empty}>No matching messages.</div> : filteredMessages.map(message => <button className={`${styles.messageRow} ${selectedMessage?.id === message.id ? styles.selected : ''}`} key={message.id} onClick={() => setSelectedMessage(message)}>
              <div className={styles.messageTop}><strong>{message.subject || '(no subject)'}</strong><span>{new Date(message.received_at).toLocaleString()}</span></div><span>{message.from_address}</span><p>{cleanPreview(message.body || message.html_body || '')}</p>
              <div className={styles.messageMeta}>{message.html_body && <small><Code2 size={13} /> HTML</small>}{Boolean(message.attachments?.length) && <small><Paperclip size={13} /> {message.attachments?.length}</small>}</div>
            </button>)}
          </div>

          <div className={styles.reader}>{selectedMessage ? <>
            <div className={styles.readerHeader}><div><span>{selectedMessage.from_address}</span><h3>{selectedMessage.subject || '(no subject)'}</h3><small><Clock3 size={13} /> {new Date(selectedMessage.received_at).toLocaleString()}</small></div><div className={styles.readerActions}><button className={styles.iconButton} onClick={() => void deleteMessage(selectedMessage.id)} title="Delete message"><Trash2 size={16} /></button><button className={styles.iconButton} onClick={() => setSelectedMessage(null)} title="Close"><X size={16} /></button></div></div>
            <div className={styles.viewSwitch}><button className={showHtml ? styles.activeView : ''} disabled={!selectedMessage.html_body} onClick={() => setShowHtml(true)}><Eye size={14} /> Rendered</button><button className={!showHtml ? styles.activeView : ''} onClick={() => setShowHtml(false)}><Code2 size={14} /> Plain text</button></div>
            {showHtml && selectedMessage.html_body ? <iframe className={styles.htmlReader} title="Email HTML" sandbox="allow-same-origin" srcDoc={selectedMessage.html_body} /> : <article className={styles.body}>{selectedMessage.body || '(empty message)'}</article>}
            {Boolean(selectedMessage.attachments?.length) && <div className={styles.attachments}><h4><Paperclip size={16} /> Attachments</h4>{selectedMessage.attachments?.map(file => <div key={file.id} className={styles.attachment}><Database size={16} /><span><strong>{file.filename}</strong><small>{file.content_type} · {formatBytes(file.size)}</small></span><button className={styles.iconButton} onClick={() => void openAttachment(file)} title="View attachment"><Eye size={15} /></button><button className={styles.iconButton} onClick={() => void downloadAttachment(file)} title="Download attachment"><Download size={15} /></button></div>)}</div>}
          </> : <div className={styles.readerEmpty}><FileText size={42} /><h3>Select a message</h3><p>Choose a message to inspect its content, metadata and attachments.</p></div>}</div>
        </div> : <div className={styles.readerEmpty}><Inbox size={42} /><h3>Choose an inbox</h3><p>Messages, metadata and attachments will appear here.</p></div>}
      </main>
    </section>
    <div className={styles.warning}><ShieldAlert size={18} /><span>Admin actions are permanent. Keep the admin key private and rotate it if exposed.</span></div>
  </div>;
}
