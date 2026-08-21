import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Activity, Database, FileText, Inbox, LockKeyhole, RefreshCw, Search, ShieldAlert, Trash2, X, Eye, Paperclip, Clock3 } from 'lucide-react';
import styles from './Admin.module.css';

type Attachment = { id: string; filename: string; content_type: string; size: number };
type Message = { id: string; inbox_address: string; from_address: string; subject: string; body: string; received_at: string; attachments?: Attachment[] };
type Stats = { inboxes: number; messages: number; attachments: number };
type AdminInbox = { address: string; created_at: string; message_count: number };

const formatBytes = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function Admin() {
  const [key, setKey] = useState(() => sessionStorage.getItem('ratiomail-admin-key') || '');
  const [input, setInput] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [inboxes, setInboxes] = useState<AdminInbox[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedInbox, setSelectedInbox] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const headers = useMemo(() => ({ 'x-admin-key': key }), [key]);
  const load = useCallback(async (adminKey: string) => {
    if (!adminKey) return;
    setLoading(true); setError('');
    try {
      const h = { 'x-admin-key': adminKey };
      const [statsResponse, inboxResponse] = await Promise.all([fetch('/api/admin/stats', { headers: h }), fetch('/api/admin/inboxes', { headers: h })]);
      if (!statsResponse.ok || !inboxResponse.ok) throw new Error('Invalid admin key or admin API unavailable.');
      setStats(await statsResponse.json() as Stats); setInboxes(await inboxResponse.json() as AdminInbox[]);
      sessionStorage.setItem('ratiomail-admin-key', adminKey); setKey(adminKey);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load admin dashboard.'); }
    finally { setLoading(false); }
  }, []);

  const loadMessages = useCallback(async (address: string) => {
    setSelectedInbox(address); setSelectedMessage(null); setLoading(true); setError('');
    try {
      const response = await fetch(`/api/admin/inboxes/${encodeURIComponent(address)}/messages`, { headers });
      if (!response.ok) throw new Error('Unable to load inbox messages.');
      setMessages(await response.json() as Message[]);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load messages.'); }
    finally { setLoading(false); }
  }, [headers]);

  useEffect(() => { const saved = sessionStorage.getItem('ratiomail-admin-key'); if (saved) void load(saved); }, [load]);
  const login = async (event: FormEvent) => { event.preventDefault(); await load(input.trim()); };
  const deleteInbox = async (address: string) => { if (!window.confirm(`Permanently delete ${address} and all of its messages?`)) return; const response = await fetch(`/api/admin/inboxes/${encodeURIComponent(address)}`, { method: 'DELETE', headers }); if (!response.ok) { setError('Failed to delete inbox.'); return; } if (selectedInbox === address) { setSelectedInbox(null); setMessages([]); } await load(key); };
  const deleteMessage = async (id: string) => { if (!window.confirm('Permanently delete this message and its attachments?')) return; const response = await fetch(`/api/admin/messages/${encodeURIComponent(id)}`, { method: 'DELETE', headers }); if (!response.ok) { setError('Failed to delete message.'); return; } setSelectedMessage(null); if (selectedInbox) await loadMessages(selectedInbox); await load(key); };
  const logout = () => { sessionStorage.removeItem('ratiomail-admin-key'); setKey(''); setStats(null); setInboxes([]); setMessages([]); setSelectedInbox(null); setSelectedMessage(null); };

  if (!key || !stats) return <div className={styles.page}><div className={styles.loginCard}><div className={styles.logo}><LockKeyhole size={22}/></div><span className={styles.eyebrow}>RATIOMAIL CONTROL</span><h1>Administrator access</h1><p>Private control panel for monitoring and moderation.</p><form onSubmit={login}><input type="password" value={input} onChange={e => setInput(e.target.value)} placeholder="Admin key" autoFocus/><button type="submit" disabled={!input || loading}>{loading ? 'Checking…' : 'Sign in'}</button></form>{error && <div className={styles.error}><ShieldAlert size={17}/>{error}</div>}</div></div>;

  const filteredInboxes = inboxes.filter(i => i.address.toLowerCase().includes(search.toLowerCase()));
  return <div className={styles.page}>
    <header className={styles.header}><div><span className={styles.eyebrow}>RATIOMAIL CONTROL</span><h1>Administration</h1><p>Monitor, inspect and moderate temporary mail activity.</p></div><div className={styles.headerActions}><button onClick={() => void load(key)} disabled={loading}><RefreshCw size={16}/> Refresh</button><button onClick={logout}>Sign out</button></div></header>
    <section className={styles.stats}>{[{ label: 'Inboxes', value: stats.inboxes, Icon: Inbox }, { label: 'Messages', value: stats.messages, Icon: FileText }, { label: 'Attachments', value: stats.attachments, Icon: Database }].map(({ label, value, Icon }) => <article key={label}><div><Icon size={19}/></div><span>{label}</span><strong>{value}</strong></article>)}</section>
    <section className={styles.workspace}>
      <aside className={styles.inboxPanel}><div className={styles.panelHeader}><div><span className={styles.eyebrow}>MAILBOXES</span><h2>Temporary inboxes</h2></div><div className={styles.live}><Activity size={15}/> Live</div></div><div className={styles.search}><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inboxes…"/></div><div className={styles.table}>{filteredInboxes.length === 0 ? <div className={styles.empty}>No matching inboxes.</div> : filteredInboxes.map(inbox => <button className={`${styles.rowButton} ${selectedInbox === inbox.address ? styles.selected : ''}`} key={inbox.address} onClick={() => void loadMessages(inbox.address)}><div className={styles.address}><Inbox size={17}/><div><strong>{inbox.address}</strong><span>{new Date(inbox.created_at).toLocaleString()}</span></div></div><span className={styles.count}>{inbox.message_count}</span><span className={styles.rowDelete} onClick={e => { e.stopPropagation(); void deleteInbox(inbox.address); }} title="Delete inbox"><Trash2 size={15}/></span></button>)}</div></aside>
      <main className={styles.messagePanel}><div className={styles.panelHeader}><div><span className={styles.eyebrow}>INSPECTOR</span><h2>{selectedInbox || 'Select an inbox'}</h2></div>{selectedInbox && <span className={styles.live}>{messages.length} messages</span>}</div>{selectedInbox ? <div className={styles.messageWorkspace}><div className={styles.messageList}>{messages.length === 0 ? <div className={styles.empty}>No messages in this inbox.</div> : messages.map(message => <button className={`${styles.messageRow} ${selectedMessage?.id === message.id ? styles.selected : ''}`} key={message.id} onClick={() => setSelectedMessage(message)}><div className={styles.messageTop}><strong>{message.subject || '(no subject)'}</strong><span>{new Date(message.received_at).toLocaleString()}</span></div><span>{message.from_address}</span><p>{message.body.replace(/\s+/g, ' ').slice(0, 130)}</p>{Boolean(message.attachments?.length) && <small><Paperclip size={13}/> {message.attachments?.length} attachment{message.attachments?.length === 1 ? '' : 's'}</small>}</button>)}</div><div className={styles.reader}>{selectedMessage ? <><div className={styles.readerHeader}><div><span>{selectedMessage.from_address}</span><h3>{selectedMessage.subject || '(no subject)'}</h3><small><Clock3 size={13}/> {new Date(selectedMessage.received_at).toLocaleString()}</small></div><div><button className={styles.iconButton} onClick={() => void deleteMessage(selectedMessage.id)} title="Delete message"><Trash2 size={16}/></button><button className={styles.iconButton} onClick={() => setSelectedMessage(null)} title="Close"><X size={16}/></button></div></div><article className={styles.body}>{selectedMessage.body || '(empty message)'}</article>{Boolean(selectedMessage.attachments?.length) && <div className={styles.attachments}><h4><Paperclip size={16}/> Attachments</h4>{selectedMessage.attachments?.map(file => <a key={file.id} href={`/api/attachments/${encodeURIComponent(file.id)}?admin=1`} target="_blank" rel="noreferrer" className={styles.attachment} onClick={e => { e.preventDefault(); window.open(`/api/admin/attachments/${encodeURIComponent(file.id)}`, '_blank', 'noopener,noreferrer'); }}><Database size={16}/><span><strong>{file.filename}</strong><small>{file.content_type} · {formatBytes(file.size)}</small></span><Eye size={15}/></a>)}</div>}</> : <div className={styles.readerEmpty}><FileText size={42}/><h3>Select a message</h3><p>Choose a message to inspect its full contents and attachments.</p></div>}</div></div> : <div className={styles.readerEmpty}><Inbox size={42}/><h3>Choose an inbox</h3><p>Messages, metadata and attachments will appear here.</p></div>}</main>
    </section>
    <div className={styles.warning}><ShieldAlert size={18}/><span>Admin actions are permanent. Keep the admin key private and rotate it if exposed.</span></div>
  </div>;
}
