import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

export interface AdminEnv { DB: D1Database; ADMIN_PASSWORD?: string; MAIL_DOMAIN?: string; EXPIRY_DAYS?: string; }
const admin = new Hono<{ Bindings: AdminEnv }>();

function unauthorized(c: any): Response { c.header('WWW-Authenticate', 'Basic realm="RatioMail Admin"'); return c.json({ error: 'Unauthorized' }, 401); }
async function authorized(c: any): Promise<boolean> {
  const configured = c.env.ADMIN_PASSWORD;
  const header = c.req.header('authorization') || '';
  if (!configured || !header.startsWith('Basic ')) return false;
  try {
    const decoded = atob(header.slice(6)); const i = decoded.indexOf(':'); if (i < 0) return false;
    const a = new TextEncoder().encode(decoded.slice(i + 1)); const b = new TextEncoder().encode(configured);
    if (a.length !== b.length) return false; let diff = 0; for (let n = 0; n < a.length; n++) diff |= a[n] ^ b[n]; return diff === 0;
  } catch { return false; }
}

async function ensureAdminTables(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS admin_logs (id TEXT PRIMARY KEY, level TEXT NOT NULL, event TEXT NOT NULL, details TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS admin_domains (domain TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS admin_audit (id TEXT PRIMARY KEY, action TEXT NOT NULL, target TEXT, details TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`),
  ]);
}
async function log(db: D1Database, level: string, event: string, details?: unknown) {
  await db.prepare('INSERT INTO admin_logs (id, level, event, details) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), level, event, details == null ? null : JSON.stringify(details)).run();
}
async function audit(db: D1Database, action: string, target?: string, details?: unknown) {
  await db.prepare('INSERT INTO admin_audit (id, action, target, details) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), action, target || null, details == null ? null : JSON.stringify(details)).run();
}

admin.use('*', async (c, next) => { await ensureAdminTables(c.env.DB); if (!(await authorized(c))) return unauthorized(c); await next(); });
admin.get('/auth', c => c.json({ ok: true }));

admin.get('/stats', async c => {
  const [inboxes, messages, sessions, recent, today] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) count FROM inboxes').first<{ count: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) count FROM messages').first<{ count: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) count FROM sessions').first<{ count: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) count FROM messages WHERE received_at >= datetime('now','-24 hours')`).first<{ count: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) count FROM messages WHERE date(received_at)=date('now')`).first<{ count: number }>(),
  ]);
  return c.json({ inboxes: Number(inboxes?.count || 0), messages: Number(messages?.count || 0), sessions: Number(sessions?.count || 0), last24h: Number(recent?.count || 0), today: Number(today?.count || 0) });
});

admin.get('/analytics', async c => {
  const [hourly, domains, senders, sizes] = await Promise.all([
    c.env.DB.prepare(`SELECT strftime('%Y-%m-%d %H:00', received_at) bucket, COUNT(*) count FROM messages WHERE received_at >= datetime('now','-7 days') GROUP BY bucket ORDER BY bucket`).all(),
    c.env.DB.prepare(`SELECT substr(inbox_address, instr(inbox_address,'@')+1) domain, COUNT(*) count FROM inboxes GROUP BY domain ORDER BY count DESC`).all(),
    c.env.DB.prepare(`SELECT from_address sender, COUNT(*) count FROM messages GROUP BY from_address ORDER BY count DESC LIMIT 10`).all(),
    c.env.DB.prepare(`SELECT COUNT(*) count, AVG(length(body)) avg_body FROM messages`).first(),
  ]);
  return c.json({ hourly: hourly.results, domains: domains.results, senders: senders.results, sizes });
});

admin.get('/health', async c => {
  const started = Date.now(); let dbOk = false; let dbMs = 0;
  try { const t = Date.now(); await c.env.DB.prepare('SELECT 1').first(); dbMs = Date.now() - t; dbOk = true; } catch { dbOk = false; }
  return c.json({ ok: dbOk, database: { ok: dbOk, latencyMs: dbMs }, worker: 'online', checkedAt: new Date().toISOString(), responseMs: Date.now() - started });
});

admin.get('/logs', async c => {
  const limit = Math.min(Math.max(Number(c.req.query('limit') || 100), 1), 500);
  const level = c.req.query('level');
  const result = level ? await c.env.DB.prepare('SELECT * FROM admin_logs WHERE level=? ORDER BY created_at DESC LIMIT ?').bind(level, limit).all() : await c.env.DB.prepare('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT ?').bind(limit).all();
  return c.json(result.results);
});
admin.get('/audit', async c => { const limit = Math.min(Math.max(Number(c.req.query('limit') || 100), 1), 500); return c.json((await c.env.DB.prepare('SELECT * FROM admin_audit ORDER BY created_at DESC LIMIT ?').bind(limit).all()).results); });

admin.get('/inboxes', async c => {
  const q = (c.req.query('q') || '').trim().toLowerCase();
  const sql = q ? `SELECT i.address,i.created_at,COUNT(m.id) message_count FROM inboxes i LEFT JOIN messages m ON m.inbox_address=i.address WHERE lower(i.address) LIKE ? GROUP BY i.address ORDER BY i.created_at DESC LIMIT 500` : `SELECT i.address,i.created_at,COUNT(m.id) message_count FROM inboxes i LEFT JOIN messages m ON m.inbox_address=i.address GROUP BY i.address ORDER BY i.created_at DESC LIMIT 500`;
  const result = q ? await c.env.DB.prepare(sql).bind(`%${q}%`).all() : await c.env.DB.prepare(sql).all(); return c.json(result.results);
});
admin.get('/inboxes/:address/messages', async c => { const address = decodeURIComponent(c.req.param('address')); return c.json((await c.env.DB.prepare('SELECT * FROM messages WHERE inbox_address=? ORDER BY received_at DESC LIMIT 500').bind(address).all()).results); });
admin.delete('/messages/:id', async c => { const id=c.req.param('id'); await c.env.DB.prepare('DELETE FROM messages WHERE id=?').bind(id).run(); await audit(c.env.DB,'message.delete',id); return c.json({ok:true}); });
admin.delete('/inboxes/:address', async c => { const address=decodeURIComponent(c.req.param('address')); await c.env.DB.batch([c.env.DB.prepare('DELETE FROM messages WHERE inbox_address=?').bind(address),c.env.DB.prepare('DELETE FROM session_inboxes WHERE inbox_address=?').bind(address),c.env.DB.prepare('DELETE FROM inboxes WHERE address=?').bind(address)]); await audit(c.env.DB,'inbox.delete',address); return c.json({ok:true}); });

admin.get('/domains', async c => {
  const configured = (c.env.MAIL_DOMAIN || '').split(',').map(x=>x.trim()).filter(Boolean);
  const rows = (await c.env.DB.prepare('SELECT domain,enabled,created_at FROM admin_domains ORDER BY domain').all()).results as any[];
  const map = new Map(rows.map(x=>[x.domain,x]));
  for (const domain of configured) if (!map.has(domain)) map.set(domain,{domain,enabled:1,source:'environment'});
  return c.json([...map.values()]);
});
admin.post('/domains', async c => { const body=await c.req.json().catch(()=>({})); const domain=String(body.domain||'').trim().toLowerCase(); if(!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return c.json({error:'Invalid domain'},400); await c.env.DB.prepare('INSERT OR REPLACE INTO admin_domains(domain,enabled) VALUES(?,1)').bind(domain).run(); await audit(c.env.DB,'domain.add',domain); return c.json({ok:true,domain}); });
admin.patch('/domains/:domain', async c => { const domain=decodeURIComponent(c.req.param('domain')); const body=await c.req.json().catch(()=>({})); await c.env.DB.prepare('INSERT OR REPLACE INTO admin_domains(domain,enabled) VALUES(?,?)').bind(domain,body.enabled?1:0).run(); await audit(c.env.DB,'domain.toggle',domain,{enabled:Boolean(body.enabled)}); return c.json({ok:true}); });
admin.delete('/domains/:domain', async c => { const domain=decodeURIComponent(c.req.param('domain')); await c.env.DB.prepare('DELETE FROM admin_domains WHERE domain=?').bind(domain).run(); await audit(c.env.DB,'domain.remove',domain); return c.json({ok:true}); });

admin.get('/retention', async c => { const row=await c.env.DB.prepare(`SELECT value FROM admin_settings WHERE key='retention_days'`).first<{value:string}>(); return c.json({days:Number(row?.value || c.env.EXPIRY_DAYS || 1)}); });
admin.put('/retention', async c => { const body=await c.req.json().catch(()=>({})); const days=Math.floor(Number(body.days)); if(!Number.isFinite(days)||days<0||days>3650) return c.json({error:'Retention must be between 0 and 3650 days'},400); await c.env.DB.prepare(`INSERT OR REPLACE INTO admin_settings(key,value,updated_at) VALUES('retention_days',?,CURRENT_TIMESTAMP)`).bind(String(days)).run(); await audit(c.env.DB,'retention.update',String(days)); return c.json({ok:true,days}); });

admin.post('/cleanup', async c => { const body=await c.req.json().catch(()=>({})); const days=Number(body.days); if(!Number.isFinite(days)||days<=0)return c.json({error:'days must be greater than zero'},400); const result=await c.env.DB.batch([c.env.DB.prepare(`DELETE FROM messages WHERE inbox_address IN (SELECT address FROM inboxes WHERE datetime(created_at)<datetime('now','-'||?||' days'))`).bind(days),c.env.DB.prepare(`DELETE FROM session_inboxes WHERE inbox_address IN (SELECT address FROM inboxes WHERE datetime(created_at)<datetime('now','-'||?||' days'))`).bind(days),c.env.DB.prepare(`DELETE FROM inboxes WHERE datetime(created_at)<datetime('now','-'||?||' days')`).bind(days)]); await audit(c.env.DB,'cleanup.run',String(days),result); return c.json({ok:true}); });

export default admin;
