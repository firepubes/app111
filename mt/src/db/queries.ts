import type { D1Database } from '@cloudflare/workers-types';

export interface Inbox {
  address: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  message_id: string;
  filename: string;
  content_type: string;
  size: number;
  object_key: string;
  created_at: string;
}

export interface Message {
  id: string;
  inbox_address: string;
  from_address: string;
  subject: string;
  body: string;
  html_body: string | null;
  received_at: string;
  attachments: Attachment[];
}

interface MessageRow {
  id: string;
  inbox_address: string;
  from_address: string;
  subject: string;
  body: string;
  html_body: string | null;
  received_at: string;
}

export interface Session {
  id: string;
  created_at: string;
}

export async function getInbox(db: D1Database, address: string): Promise<Inbox | null> {
  return db.prepare('SELECT * FROM inboxes WHERE address = ?').bind(address).first<Inbox>();
}

export async function createInbox(db: D1Database, address: string): Promise<void> {
  await db.prepare('INSERT OR IGNORE INTO inboxes (address) VALUES (?)').bind(address).run();
}

export async function inboxExists(db: D1Database, address: string): Promise<boolean> {
  const row = await db.prepare('SELECT 1 FROM inboxes WHERE address = ? LIMIT 1').bind(address).first();
  return !!row;
}

export async function getSessionInboxes(db: D1Database, sessionId: string): Promise<Inbox[]> {
  return db
    .prepare(
      `SELECT i.* FROM inboxes i
       INNER JOIN session_inboxes si ON si.inbox_address = i.address
       WHERE si.session_id = ?
       ORDER BY i.created_at DESC`
    )
    .bind(sessionId)
    .all<Inbox>()
    .then((r) => r.results);
}

export async function getMessageAttachments(db: D1Database, messageId: string): Promise<Attachment[]> {
  return db
    .prepare('SELECT * FROM attachments WHERE message_id = ? ORDER BY created_at ASC')
    .bind(messageId)
    .all<Attachment>()
    .then((r) => r.results);
}

export async function getAttachment(db: D1Database, attachmentId: string): Promise<Attachment | null> {
  return db
    .prepare('SELECT * FROM attachments WHERE id = ? LIMIT 1')
    .bind(attachmentId)
    .first<Attachment>();
}

export async function getMessages(db: D1Database, inboxAddress: string): Promise<Message[]> {
  const rows = await db
    .prepare(
      'SELECT id, inbox_address, from_address, subject, body, html_body, received_at FROM messages WHERE inbox_address = ? ORDER BY received_at DESC'
    )
    .bind(inboxAddress)
    .all<MessageRow>()
    .then((r) => r.results);

  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      attachments: await getMessageAttachments(db, row.id),
    }))
  );
}

export async function insertMessage(
  db: D1Database,
  msg: {
    id: string;
    inbox_address: string;
    from_address: string;
    subject: string;
    body: string;
    html_body?: string | null;
  }
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO messages (id, inbox_address, from_address, subject, body, html_body)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      msg.id,
      msg.inbox_address,
      msg.from_address,
      msg.subject,
      msg.body,
      msg.html_body ?? null,
    )
    .run();
}

export async function insertAttachment(
  db: D1Database,
  attachment: Omit<Attachment, 'created_at'>
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO attachments (id, message_id, filename, content_type, size, object_key)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      attachment.id,
      attachment.message_id,
      attachment.filename,
      attachment.content_type,
      attachment.size,
      attachment.object_key,
    )
    .run();
}

export async function ensureSession(db: D1Database, sessionId: string): Promise<void> {
  await db.prepare('INSERT OR IGNORE INTO sessions (id) VALUES (?)').bind(sessionId).run();
}

export async function sessionExists(db: D1Database, sessionId: string): Promise<boolean> {
  const row = await db.prepare('SELECT 1 FROM sessions WHERE id = ? LIMIT 1').bind(sessionId).first();
  return !!row;
}

export async function linkInboxToSession(
  db: D1Database,
  sessionId: string,
  address: string
): Promise<void> {
  await db
    .prepare(
      'INSERT OR IGNORE INTO session_inboxes (session_id, inbox_address) VALUES (?, ?)'
    )
    .bind(sessionId, address)
    .run();
}

export async function unlinkInboxFromSession(
  db: D1Database,
  sessionId: string,
  address: string
): Promise<void> {
  await db
    .prepare('DELETE FROM session_inboxes WHERE session_id = ? AND inbox_address = ?')
    .bind(sessionId, address)
    .run();
}

export async function isInboxInSession(
  db: D1Database,
  sessionId: string,
  address: string
): Promise<boolean> {
  const row = await db
    .prepare('SELECT 1 FROM session_inboxes WHERE session_id = ? AND inbox_address = ? LIMIT 1')
    .bind(sessionId, address)
    .first();
  return !!row;
}

export async function isAttachmentInSession(
  db: D1Database,
  sessionId: string,
  attachmentId: string
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1
       FROM attachments a
       INNER JOIN messages m ON m.id = a.message_id
       INNER JOIN session_inboxes si ON si.inbox_address = m.inbox_address
       WHERE a.id = ? AND si.session_id = ?
       LIMIT 1`
    )
    .bind(attachmentId, sessionId)
    .first();
  return !!row;
}

export async function cleanupExpired(db: D1Database, expiryDays: number): Promise<void> {
  if (expiryDays <= 0) return;

  await db.prepare(`
    DELETE FROM attachments
    WHERE message_id IN (
      SELECT id FROM messages
      WHERE inbox_address IN (
        SELECT address FROM inboxes
        WHERE datetime(created_at) < datetime('now', '-' || ? || ' days')
      )
    )
  `).bind(expiryDays).run();

  await db.prepare(`
    DELETE FROM messages
    WHERE inbox_address IN (
      SELECT address FROM inboxes
      WHERE datetime(created_at) < datetime('now', '-' || ? || ' days')
    )
  `).bind(expiryDays).run();

  await db.prepare(`
    DELETE FROM session_inboxes
    WHERE inbox_address IN (
      SELECT address FROM inboxes
      WHERE datetime(created_at) < datetime('now', '-' || ? || ' days')
    )
  `).bind(expiryDays).run();

  await db.prepare(`
    DELETE FROM inboxes
    WHERE datetime(created_at) < datetime('now', '-' || ? || ' days')
  `).bind(expiryDays).run();

  await db.prepare(`
    DELETE FROM sessions
    WHERE datetime(created_at) < datetime('now', '-' || ? || ' days')
  `).bind(expiryDays).run();
}
