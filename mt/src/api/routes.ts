import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import {
  getInbox,
  createInbox,
  inboxExists,
  getSessionInboxes,
  getMessages,
  ensureSession,
  linkInboxToSession,
  unlinkInboxFromSession,
  isInboxInSession,
} from '../db/queries';
import { generateUniqueAddress } from '../utils/random-address';

export interface ApiEnv {
  DB: D1Database;
  APP_NAME: string;
  MAIL_DOMAIN: string;
  WEB_HOST: string;
  EXPIRY_DAYS?: string;
}

function getDomains(env: ApiEnv): string[] {
  return env.MAIL_DOMAIN.split(',').map(d => d.trim()).filter(Boolean);
}

function defaultDomain(env: ApiEnv): string {
  return getDomains(env)[0] || 'example.com';
}

function sessionId(c: any): string | null {
  return (c.req.header('x-session-id') || '').trim() || null;
}

function requireSession(c: any): string {
  const sid = sessionId(c);
  if (!sid) {
    c.status(400);
    return '';
  }
  return sid;
}

const api = new Hono<{ Bindings: ApiEnv }>();

api.get('/config', (c) => {
  const domains = getDomains(c.env);
  return c.json({
    appName: c.env.APP_NAME || 'MailTune',
    mailDomain: domains[0] || 'example.com',
    mailDomains: domains,
    webHost: c.env.WEB_HOST || 'mailtune.example.com',
    expiryDays: parseInt(c.env.EXPIRY_DAYS || '0', 10),
  });
});

api.get('/session', async (c) => {
  let sid = sessionId(c);
  if (!sid) {
    sid = crypto.randomUUID();
  }
  await ensureSession(c.env.DB, sid);
  return c.json({ sessionId: sid });
});

api.get('/inboxes', async (c) => {
  const sid = requireSession(c);
  if (!sid) return c.json({ error: 'Missing x-session-id' }, 400);

  const inboxes = await getSessionInboxes(c.env.DB, sid);
  return c.json(inboxes);
});

api.post('/inboxes', async (c) => {
  const sid = requireSession(c);
  if (!sid) return c.json({ error: 'Missing x-session-id' }, 400);

  const body = await c.req.json().catch(() => ({}));
  const domains = getDomains(c.env);
  const requestedDomain: string = (body.domain || '').trim().toLowerCase();
  const domain = requestedDomain && domains.includes(requestedDomain)
    ? requestedDomain
    : defaultDomain(c.env);

  if (requestedDomain && !domains.includes(requestedDomain)) {
    return c.json({ error: `Invalid domain: ${requestedDomain}. Allowed: ${domains.join(', ')}` }, 400);
  }

  const requested: string = (body.localPart || '').trim().toLowerCase();

  let address: string;
  if (requested) {
    address = `${requested}@${domain}`;
  } else {
    address = await generateUniqueAddress(
      (addr) => inboxExists(c.env.DB, addr),
      domain
    );
  }

  await createInbox(c.env.DB, address);

  await linkInboxToSession(c.env.DB, sid, address);

  const inbox = await getInbox(c.env.DB, address);
  return c.json(inbox!, 201);
});

api.delete('/inboxes/:address', async (c) => {
  const sid = requireSession(c);
  if (!sid) return c.json({ error: 'Missing x-session-id' }, 400);

  const address = decodeURIComponent(c.req.param('address'));
  await unlinkInboxFromSession(c.env.DB, sid, address);
  return c.json({ ok: true });
});

api.get('/inboxes/:address/messages', async (c) => {
  const sid = requireSession(c);
  if (!sid) return c.json({ error: 'Missing x-session-id' }, 400);

  const address = decodeURIComponent(c.req.param('address'));

  if (!(await isInboxInSession(c.env.DB, sid, address))) {
    return c.json({ error: 'Inbox not in this session' }, 403);
  }

  const messages = await getMessages(c.env.DB, address);
  return c.json(messages);
});

export default api;
