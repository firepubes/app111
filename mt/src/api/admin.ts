import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

export interface AdminEnv {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
}

const admin = new Hono<{ Bindings: AdminEnv }>();

function unauthorized(c: any): Response {
  c.header('WWW-Authenticate', 'Basic realm="Ratiomail Admin"');
  return c.json({ error: 'Unauthorized' }, 401);
}

async function authorized(c: any): Promise<boolean> {
  const configured = c.env.ADMIN_PASSWORD;
  if (!configured) return false;
  const header = c.req.header('authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(':');
    if (separator < 0) return false;
    const password = decoded.slice(separator + 1);
    const a = new TextEncoder().encode(password);
    const b = new TextEncoder().encode(configured);
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  } catch {
    return false;
  }
}

admin.use('*', async (c, next) => {
  if (!(await authorized(c))) return unauthorized(c);
  await next();
});

admin.get('/auth', (c) => c.json({ ok: true }));

admin.get('/stats', async (c) => {
  const [inboxes, messages, sessions] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) AS count FROM inboxes').first<{ count: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) AS count FROM messages').first<{ count: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) AS count FROM sessions').first<{ count: number }>(),
  ]);
  return c.json({ inboxes: Number(inboxes?.count || 0), messages: Number(messages?.count || 0), sessions: Number(sessions?.count || 0) });
});

admin.get('/inboxes', async (c) => {
  const q = (c.req.query('q') || '').trim().toLowerCase();
  const result = q
    ? await c.env.DB.prepare(`SELECT i.address, i.created_at, COUNT(m.id) AS message_count
       FROM inboxes i LEFT JOIN messages m ON m.inbox_address=i.address
       WHERE lower(i.address) LIKE ? GROUP BY i.address ORDER BY i.created_at DESC LIMIT 500`).bind(`%${q}%`).all()
    : await c.env.DB.prepare(`SELECT i.address, i.created_at, COUNT(m.id) AS message_count
       FROM inboxes i LEFT JOIN messages m ON m.inbox_address=i.address
       GROUP BY i.address ORDER BY i.created_at DESC LIMIT 500`).all();
  return c.json(result.results);
});

admin.get('/inboxes/:address/messages', async (c) => {
  const address = decodeURIComponent(c.req.param('address'));
  const result = await c.env.DB.prepare('SELECT * FROM messages WHERE inbox_address = ? ORDER BY received_at DESC LIMIT 500').bind(address).all();
  return c.json(result.results);
});

admin.delete('/messages/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

admin.delete('/inboxes/:address', async (c) => {
  const address = decodeURIComponent(c.req.param('address'));
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM messages WHERE inbox_address = ?').bind(address),
    c.env.DB.prepare('DELETE FROM session_inboxes WHERE inbox_address = ?').bind(address),
    c.env.DB.prepare('DELETE FROM inboxes WHERE address = ?').bind(address),
  ]);
  return c.json({ ok: true });
});

admin.post('/cleanup', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const days = Number(body.days || 0);
  if (!Number.isFinite(days) || days <= 0) return c.json({ error: 'days must be greater than zero' }, 400);
  await c.env.DB.batch([
    c.env.DB.prepare(`DELETE FROM messages WHERE inbox_address IN (SELECT address FROM inboxes WHERE datetime(created_at) < datetime('now', '-' || ? || ' days'))`).bind(days),
    c.env.DB.prepare(`DELETE FROM session_inboxes WHERE inbox_address IN (SELECT address FROM inboxes WHERE datetime(created_at) < datetime('now', '-' || ? || ' days'))`).bind(days),
    c.env.DB.prepare(`DELETE FROM inboxes WHERE datetime(created_at) < datetime('now', '-' || ? || ' days')`).bind(days),
  ]);
  return c.json({ ok: true });
});

export default admin;
