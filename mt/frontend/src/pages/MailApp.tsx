import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, BellOff, Check, Clipboard, Clock3, Copy, Inbox, Loader2, Mail, Menu, Moon, Plus, RefreshCw, Search, Settings2, ShieldCheck, Sun, Trash2, X, Zap } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { CreateInbox } from '../components/CreateInbox';
import { LoadingState } from '../components/LoadingState';
import { useConfig } from '../hooks/useConfig';
import { useInboxes } from '../hooks/useInboxes';
import { useMessages } from '../hooks/useMessages';
import { useSession } from '../hooks/useSession';
import styles from './MailApp.module.css';

export default function MailApp() {
  const { config, loading: configLoading, error: configError } = useConfig();
  const { ready: sessionReady, error: sessionError } = useSession();
  const { inboxes, selectedAddress, setSelectedAddress, loadInboxes, addInbox, removeInbox } = useInboxes(sessionReady);
  const { messages, loading: messagesLoading, error: messagesError, refresh: refreshMessages } = useMessages(selectedAddress);
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [search, setSearch] = useState('');
  const [sortNewest, setSortNewest] = useState(true);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { return (localStorage.getItem('mailtune-theme') as 'light' | 'dark') || 'light'; } catch { return 'light'; }
  });
  const [notifications, setNotifications] = useState(false);
  const lastMessageCount = useRef(0);

  useEffect(() => { if (sessionReady && config) void loadInboxes(); }, [sessionReady, config, loadInboxes]);
  useEffect(() => { document.title = config ? `${config.appName} — Ratio Development` : 'MailTune — Ratio Development'; }, [config]);
  useEffect(() => { document.documentElement.dataset.mailtuneTheme = theme; try { localStorage.setItem('mailtune-theme', theme); } catch { /* ignore */ } }, [theme]);
  useEffect(() => {
    if (!selectedAddress) return;
    const timer = window.setInterval(() => void refreshMessages(), 10000);
    return () => window.clearInterval(timer);
  }, [selectedAddress, refreshMessages]);
  useEffect(() => {
    if (!notifications || messages.length <= lastMessageCount.current) { lastMessageCount.current = messages.length; return; }
    if (lastMessageCount.current > 0 && 'Notification' in window && Notification.permission === 'granted') new Notification('MailTune', { body: `New message in ${selectedAddress || 'your inbox'}` });
    lastMessageCount.current = messages.length;
  }, [messages.length, notifications, selectedAddress]);

  const domains = config?.mailDomains ?? (config?.mailDomain ? [config.mailDomain] : []);
  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = query ? messages.filter((message) => [message.from_address, message.subject, message.body].some((value) => value.toLowerCase().includes(query))) : [...messages];
    result.sort((a, b) => { const first = new Date(a.received_at).getTime(); const second = new Date(b.received_at).getTime(); return sortNewest ? second - first : first - second; });
    return result;
  }, [messages, search, sortNewest]);
  const selectedMessage = useMemo(() => filteredMessages.find((message) => message.id === selectedMessageId) ?? null, [filteredMessages, selectedMessageId]);

  const handleCreateCustom = useCallback(async (localPart: string, domain: string) => {
    try { await addInbox({ localPart, domain }); setShowCreateBox(false); toast.success('Inbox created'); } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to create inbox'); }
  }, [addInbox]);
  const handleCreateRandom = useCallback(async (domain: string) => {
    try { await addInbox({ domain }); setShowCreateBox(false); toast.success('Inbox created'); } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to create inbox'); }
  }, [addInbox]);
  const handleDelete = useCallback(async () => {
    if (!selectedAddress || !window.confirm(`Remove ${selectedAddress} from this session?`)) return;
    try { await removeInbox(selectedAddress); setSelectedMessageId(null); toast.success('Inbox removed'); } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to remove inbox'); }
  }, [selectedAddress, removeInbox]);
  const handleRefresh = useCallback(async () => {
    if (refreshing) return; setRefreshing(true);
    try { await refreshMessages(); } finally { window.setTimeout(() => setRefreshing(false), 350); }
  }, [refreshMessages, refreshing]);
  const copyAddress = useCallback(async () => {
    if (!selectedAddress) return;
    try { await navigator.clipboard.writeText(selectedAddress); toast.success('Address copied to clipboard'); } catch { toast.error('Clipboard access is unavailable'); }
  }, [selectedAddress]);
  const copyMessage = useCallback(async () => {
    if (!selectedMessage) return;
    try { await navigator.clipboard.writeText(`From: ${selectedMessage.from_address}\nSubject: ${selectedMessage.subject}\n\n${selectedMessage.body}`); toast.success('Message copied'); } catch { toast.error('Clipboard access is unavailable'); }
  }, [selectedMessage]);
  const toggleNotifications = useCallback(async () => {
    if (notifications) { setNotifications(false); return; }
    if (!('Notification' in window)) { toast.error('Desktop notifications are not supported'); return; }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') { setNotifications(true); toast.success('New-mail notifications enabled'); } else toast.error('Notification permission was not granted');
  }, [notifications]);

  if (configError || sessionError) return <div className={styles.errorPage}><div className={styles.errorCard}><Mail size={24} /><span>RATIO DEVELOPMENT / MAILTUNE</span><h2>Connection unavailable</h2><p>{configError || sessionError}</p></div><Toaster position="bottom-right" /></div>;
  if (configLoading || !config) return <div className={styles.loadingPage}><LoadingState lines={6} /><Toaster position="bottom-right" /></div>;

  return <div className={styles.page}>
    <header className={styles.topbar}>
      <div className={styles.brandBlock}><button className={styles.mobileMenu} onClick={() => setMobileSidebar((value) => !value)} aria-label="Toggle inbox sidebar"><Menu size={20} /></button><div className={styles.logo}><Mail size={19} /></div><div><strong>MailTune</strong><span>by Ratio Development</span></div></div>
      <div className={styles.topActions}><div className={styles.liveStatus}><span /> Live receiving</div><button className={styles.roundButton} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button><button className={`${styles.roundButton} ${notifications ? styles.activeButton : ''}`} onClick={toggleNotifications} title="Desktop notifications">{notifications ? <Bell size={17} /> : <BellOff size={17} />}</button></div>
    </header>
    <div className={styles.appShell}>
      <aside className={`${styles.sidebar} ${mobileSidebar ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTop}><button className={styles.createButton} onClick={() => setShowCreateBox((value) => !value)}><Plus size={18} /> New inbox</button><div className={styles.sidebarTitle}>YOUR INBOXES <span>{inboxes.length}</span></div><div className={styles.inboxList}>{inboxes.length === 0 ? <div className={styles.emptyInboxes}><Inbox size={19} /><span>No inboxes yet</span></div> : inboxes.map((inbox) => <button key={inbox.address} className={`${styles.inboxItem} ${selectedAddress === inbox.address ? styles.inboxActive : ''}`} onClick={() => { setSelectedAddress(inbox.address); setSelectedMessageId(null); setMobileSidebar(false); }}><div className={styles.inboxIcon}><Mail size={15} /></div><span>{inbox.address}</span>{selectedAddress === inbox.address && <Check size={15} />}</button>)}</div></div>
        <div className={styles.sidebarBottom}><div className={styles.securityCard}><ShieldCheck size={18} /><div><strong>Privacy mode</strong><span>Receive-only · no sending</span></div></div><div className={styles.cleanupRow}><Clock3 size={16} /><div><span>Auto cleanup</span><strong>{config.expiryDays === 0 ? 'Off' : `${config.expiryDays} day${config.expiryDays === 1 ? '' : 's'}`}</strong></div></div></div>
      </aside>
      <main className={styles.workspace}>
        {showCreateBox && <div className={styles.createPanel}><CreateInbox domains={domains} onCreateCustom={handleCreateCustom} onCreateRandom={handleCreateRandom} /></div>}
        <div className={styles.workspaceHeader}><div><span className={styles.eyebrow}>TEMPORARY MAILBOX</span><h1>Inbox</h1></div><div className={styles.headerTools}><button className={styles.toolButton} onClick={handleRefresh} disabled={refreshing}>{refreshing ? <Loader2 className={styles.spin} size={16} /> : <RefreshCw size={16} />} Refresh</button><button className={`${styles.toolButton} ${styles.dangerTool}`} onClick={handleDelete} disabled={!selectedAddress}><Trash2 size={16} /> Delete</button></div></div>
        <section className={styles.addressBar}><div className={styles.addressIcon}><Zap size={18} /></div><div className={styles.addressText}><span>ACTIVE ADDRESS</span><strong>{selectedAddress || 'Create an inbox to begin'}</strong></div>{selectedAddress && <button className={styles.copyAddress} onClick={copyAddress}><Copy size={16} /> Copy</button>}</section>
        <div className={styles.contentGrid}>
          <section className={styles.messagesPane}><div className={styles.messageToolbar}><div className={styles.searchBox}><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sender, subject or message…" aria-label="Search messages" />{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}</div><button className={styles.sortButton} onClick={() => setSortNewest((value) => !value)}>{sortNewest ? 'Newest first' : 'Oldest first'}</button></div><div className={styles.resultsMeta}><span>{filteredMessages.length} {filteredMessages.length === 1 ? 'message' : 'messages'}</span>{search && <span>matching “{search}”</span>}<span className={styles.autoRefresh}><span /> Auto-refresh 10s</span></div>
            {messagesLoading ? <LoadingState lines={5} /> : messagesError ? <div className={styles.inlineError}><Inbox size={19} /><span>{messagesError}</span></div> : !selectedAddress ? <div className={styles.emptyState}><div><Inbox size={30} /></div><h2>Create your first inbox</h2><p>Generate a disposable address and incoming messages will appear here instantly.</p><button onClick={() => setShowCreateBox(true)}><Plus size={16} /> Create inbox</button></div> : filteredMessages.length === 0 ? <div className={styles.emptyState}><div><Mail size={30} /></div><h2>{search ? 'No matches' : 'Waiting for mail'}</h2><p>{search ? 'Try a different sender, subject or keyword.' : 'Keep this page open. MailTune checks for new messages automatically.'}</p></div> : <div className={styles.messageList}>{filteredMessages.map((message) => <button key={message.id} className={`${styles.messageRow} ${selectedMessageId === message.id ? styles.messageRowActive : ''}`} onClick={() => setSelectedMessageId(message.id)}><div className={styles.senderAvatar}>{message.from_address.slice(0, 1).toUpperCase()}</div><div className={styles.messageSummary}><strong>{message.from_address}</strong><span>{message.subject || '(no subject)'}</span><p>{message.body.replace(/\s+/g, ' ').slice(0, 110)}</p></div><time>{new Date(message.received_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></button>)}</div>}
          </section>
          <aside className={styles.readerPane}>{selectedMessage ? <><div className={styles.readerHeader}><div><span className={styles.eyebrow}>MESSAGE</span><h2>{selectedMessage.subject || '(no subject)'}</h2></div><button className={styles.roundButton} onClick={copyMessage} title="Copy message"><Clipboard size={17} /></button></div><div className={styles.senderCard}><div className={styles.largeAvatar}>{selectedMessage.from_address.slice(0, 1).toUpperCase()}</div><div><strong>{selectedMessage.from_address}</strong><span>Received {new Date(selectedMessage.received_at).toLocaleString()}</span></div></div><div className={styles.readerBody}>{selectedMessage.body}</div><div className={styles.readerFooter}><ShieldCheck size={15} /> Receive-only message · Content may contain untrusted links</div></> : <div className={styles.readerEmpty}><Mail size={30} /><h3>Select a message</h3><p>Choose an email from the list to read it here.</p></div>}</aside>
        </div>
        <div className={styles.compatibilityPanel}><div><Settings2 size={18} /><div><strong>MailTune security</strong><span>Public temporary inboxes should never be used for banking, passwords or sensitive accounts.</span></div></div><div className={styles.privacyPill}><ShieldCheck size={15} /> Private by design</div></div>
      </main>
    </div>
    <footer className={styles.footer}><span>© {new Date().getFullYear()} Ratio Development</span><span>MailTune · Temporary email infrastructure</span><span>Receive-only service</span></footer>
    <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
  </div>;
}
