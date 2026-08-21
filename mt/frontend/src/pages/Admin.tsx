import { useEffect, useState, type CSSProperties } from 'react';

type Stats = { inboxes: number; messages: number; sessions: number };
type Inbox = { address: string; created_at: string; message_count: number };
type Message = { id: string; inbox_address: string; from_address: string; subject: string; body: string; received_at: string };

const key = 'ratiomail_admin_auth';

function authHeader(): string { return sessionStorage.getItem(key) || ''; }

export default function Admin() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(Boolean(sessionStorage.getItem(key)));
  const [stats, setStats] = useState<Stats | null>(null);
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  async function request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set('Authorization', authHeader());
    if (init.body) headers.set('Content-Type', 'application/json');
    const response = await fetch(`/api/admin${path}`, { ...init, headers });
    if (response.status === 401) throw new Error('Invalid admin password');
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }

  async function login() {
    const value = `Basic ${btoa(`admin:${password}`)}`;
    sessionStorage.setItem(key, value);
    try {
      const response = await fetch('/api/admin/auth', { headers: { Authorization: value } });
      if (!response.ok) throw new Error('Invalid admin password');
      setAuthed(true); setPassword(''); setError('');
    } catch (e) { sessionStorage.removeItem(key); setError(e instanceof Error ? e.message : 'Login failed'); }
  }

  async function load() {
    try {
      const [s, i] = await Promise.all([request('/stats'), request(`/inboxes${search ? `?q=${encodeURIComponent(search)}` : ''}`)]);
      setStats(s); setInboxes(i); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load admin data'); }
  }

  async function openInbox(address: string) {
    try { setSelected(address); setMessages(await request(`/inboxes/${encodeURIComponent(address)}/messages`)); } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load messages'); }
  }

  async function deleteMessage(id: string) {
    if (!confirm('Delete this message permanently?')) return;
    await request(`/messages/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (selected) await openInbox(selected);
    await load();
  }

  async function cleanup() {
    const value = prompt('Delete inboxes older than how many days?', '1');
    if (!value) return;
    await request('/cleanup', { method: 'POST', body: JSON.stringify({ days: Number(value) }) });
    await load();
  }

  useEffect(() => { if (authed) void load(); }, [authed]);
  useEffect(() => { if (!authed) return; const timer = window.setInterval(() => void load(), 15000); return () => clearInterval(timer); }, [authed, search]);

  if (!authed) return <div style={styles.page}><div style={styles.login}><div style={styles.logo}>RM</div><h1>Ratiomail Admin</h1><p>Restricted administration console.</p><input style={styles.input} type="password" placeholder="Admin password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && void login()} /><button style={styles.primary} onClick={() => void login()}>Sign in</button>{error && <div style={styles.error}>{error}</div>}</div></div>;

  return <div style={styles.page}>
    <header style={styles.header}><div><div style={styles.kicker}>RATIOMAIL / CONTROL</div><h1>Administration</h1><p>Monitor, inspect and manage the disposable mail platform.</p></div><div style={styles.actions}><button style={styles.secondary} onClick={() => void load()}>Refresh</button><button style={styles.danger} onClick={() => { sessionStorage.removeItem(key); setAuthed(false); }}>Sign out</button></div></header>
    {error && <div style={styles.error}>{error}</div>}
    <section style={styles.stats}>{[['Inboxes', stats?.inboxes ?? '—'], ['Messages', stats?.messages ?? '—'], ['Sessions', stats?.sessions ?? '—']].map(([label,value]) => <div style={styles.stat} key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}</section>
    <div style={styles.grid}>
      <section style={styles.panel}><div style={styles.panelHead}><div><h2>Inboxes</h2><span>{inboxes.length} shown</span></div><button style={styles.secondary} onClick={() => void cleanup()}>Run cleanup</button></div><input style={styles.input} placeholder="Search inboxes…" value={search} onChange={e => setSearch(e.target.value)} /><div style={styles.list}>{inboxes.map(i => <button key={i.address} style={{ ...styles.row, ...(selected === i.address ? styles.selected : {}) }} onClick={() => void openInbox(i.address)}><div><strong>{i.address}</strong><small>{i.created_at}</small></div><span>{i.message_count} msgs</span></button>)}</div></section>
      <section style={styles.panel}><div style={styles.panelHead}><div><h2>{selected || 'Messages'}</h2><span>{messages.length} messages</span></div></div>{!selected ? <div style={styles.empty}>Select an inbox to inspect its messages.</div> : <div style={styles.messages}>{messages.map(m => <article style={styles.message} key={m.id}><div style={styles.messageTop}><div><strong>{m.subject || '(no subject)'}</strong><small>From {m.from_address} · {m.received_at}</small></div><button style={styles.dangerSmall} onClick={() => void deleteMessage(m.id)}>Delete</button></div><pre style={styles.body}>{m.body}</pre></article>)}</div>}</section>
    </div>
  </div>;
}

const styles: Record<string, CSSProperties> = {
  page:{minHeight:'100vh',background:'#0b0d12',color:'#f5f7fa',padding:'40px',fontFamily:'Inter,system-ui,sans-serif'},
  header:{maxWidth:1500,margin:'0 auto 28px',display:'flex',justifyContent:'space-between',gap:20,alignItems:'flex-end'},
  kicker:{fontSize:12,letterSpacing:3,color:'#7c8cff',fontWeight:800},
  actions:{display:'flex',gap:10},
  primary:{width:'100%',padding:14,border:0,borderRadius:10,background:'#7c8cff',color:'white',fontWeight:800,cursor:'pointer'},
  secondary:{padding:'10px 14px',border:'1px solid #2b3040',borderRadius:9,background:'#151923',color:'#fff',cursor:'pointer'},
  danger:{padding:'10px 14px',border:'1px solid #5a252d',borderRadius:9,background:'#251318',color:'#ff9da8',cursor:'pointer'},
  dangerSmall:{padding:'6px 9px',border:0,borderRadius:7,background:'#32151a',color:'#ff9da8',cursor:'pointer'},
  stats:{maxWidth:1500,margin:'0 auto 24px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14},
  stat:{background:'#12151d',border:'1px solid #252a36',borderRadius:14,padding:20},
  grid:{maxWidth:1500,margin:'0 auto',display:'grid',gridTemplateColumns:'minmax(300px,420px) 1fr',gap:18},
  panel:{background:'#12151d',border:'1px solid #252a36',borderRadius:14,padding:18,minHeight:500},
  panelHead:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14},
  input:{width:'100%',boxSizing:'border-box',padding:12,border:'1px solid #303644',borderRadius:9,background:'#0b0d12',color:'#fff',marginBottom:12},
  list:{display:'flex',flexDirection:'column',gap:6},
  row:{display:'flex',justifyContent:'space-between',alignItems:'center',textAlign:'left',padding:12,border:'1px solid #252a36',borderRadius:9,background:'#0e1118',color:'#fff',cursor:'pointer'},
  selected:{borderColor:'#7c8cff',background:'#171b29'},
  empty:{display:'grid',placeItems:'center',height:350,color:'#737b8d'},
  messages:{display:'flex',flexDirection:'column',gap:10},
  message:{border:'1px solid #292f3b',borderRadius:10,overflow:'hidden'},
  messageTop:{padding:14,display:'flex',justifyContent:'space-between',gap:10,background:'#171a22'},
  body:{whiteSpace:'pre-wrap',overflowX:'auto',padding:16,margin:0,fontFamily:'ui-monospace,monospace',fontSize:13,lineHeight:1.6},
  login:{maxWidth:400,margin:'15vh auto',background:'#12151d',border:'1px solid #292f3b',borderRadius:16,padding:28,boxShadow:'0 30px 80px #0008'},
  logo:{width:48,height:48,display:'grid',placeItems:'center',borderRadius:12,background:'#7c8cff',fontWeight:900,marginBottom:18},
  error:{maxWidth:1500,margin:'0 auto 16px',padding:12,borderRadius:9,background:'#32151a',color:'#ff9da8'}
};
