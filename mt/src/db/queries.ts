import type { D1Database } from '@cloudflare/workers-types';

export interface Inbox { address: string; created_at: string; }
export interface Attachment { id: string; message_id: string; filename: string; content_type: string; size: number; object_key: string; created_at: string; }
export interface Message { id: string; inbox_address: string; from_address: string; subject: string; body: string; received_at: string; attachments?: Attachment[]; }
export interface Session { id: string; created_at: string; }

export async function getInbox(db: D1Database, address: string): Promise<Inbox | null> { return db.prepare('SELECT * FROM inboxes WHERE address = ?').bind(address).first<Inbox>(); }
export async function createInbox(db: D1Database, address: string): Promise<void> { await db.prepare('INSERT OR IGNORE INTO inboxes (address) VALUES (?)').bind(address).run(); }
export async function inboxExists(db: D1Database, address: string): Promise<boolean> { return !!(await db.prepare('SELECT 1 FROM inboxes WHERE address = ? LIMIT 1').bind(address).first()); }
export async function getSessionInboxes(db: D1Database, sessionId: string): Promise<Inbox[]> { return db.prepare(`SELECT i.* FROM inboxes i INNER JOIN session_inboxes si ON si.inbox_address = i.address WHERE si.session_id = ? ORDER BY i.created_at DESC`).bind(sessionId).all<Inbox>().then(r => r.results); }

async function attachMessages(db: D1Database, messages: Omit<Message, 'attachments'>[]): Promise<Message[]> {
  if (!messages.length) return [];
  const ids = messages.map(m => m.id); const placeholders = ids.map(() => '?').join(',');
  const attachments = await db.prepare(`SELECT * FROM attachments WHERE message_id IN (${placeholders}) ORDER BY created_at ASC`).bind(...ids).all<Attachment>();
  const map = new Map<string, Attachment[]>();
  for (const attachment of attachments.results) map.set(attachment.message_id, [...(map.get(attachment.message_id) || []), attachment]);
  return messages.map(message => ({ ...message, attachments: map.get(message.id) || [] }));
}

export async function getMessages(db: D1Database, inboxAddress: string): Promise<Message[]> {
  const result = await db.prepare('SELECT * FROM messages WHERE inbox_address = ? ORDER BY received_at DESC').bind(inboxAddress).all<Omit<Message, 'attachments'>>();
  return attachMessages(db, result.results);
}
export async function getMessage(db: D1Database, messageId: string): Promise<Message | null> { const message = await db.prepare('SELECT * FROM messages WHERE id = ?').bind(messageId).first<Omit<Message, 'attachments'>>(); return message ? (await attachMessages(db, [message]))[0] : null; }
export async function insertMessage(db: D1Database, msg: Omit<Message, 'received_at' | 'attachments'>): Promise<void> { await db.prepare('INSERT INTO messages (id, inbox_address, from_address, subject, body) VALUES (?, ?, ?, ?, ?)').bind(msg.id, msg.inbox_address, msg.from_address, msg.subject, msg.body).run(); }
export async function insertAttachment(db: D1Database, attachment: Omit<Attachment, 'created_at'>): Promise<void> { await db.prepare('INSERT INTO attachments (id, message_id, filename, content_type, size, object_key) VALUES (?, ?, ?, ?, ?, ?)').bind(attachment.id, attachment.message_id, attachment.filename, attachment.content_type, attachment.size, attachment.object_key).run(); }
export async function ensureSession(db: D1Database, sessionId: string): Promise<void> { await db.prepare('INSERT OR IGNORE INTO sessions (id) VALUES (?)').bind(sessionId).run(); }
export async function sessionExists(db: D1Database, sessionId: string): Promise<boolean> { return !!(await db.prepare('SELECT 1 FROM sessions WHERE id = ? LIMIT 1').bind(sessionId).first()); }
export async function linkInboxToSession(db: D1Database, sessionId: string, address: string): Promise<void> { await db.prepare('INSERT OR IGNORE INTO session_inboxes (session_id, inbox_address) VALUES (?, ?)').bind(sessionId, address).run(); }
export async function unlinkInboxFromSession(db: D1Database, sessionId: string, address: string): Promise<void> { await db.prepare('DELETE FROM session_inboxes WHERE session_id = ? AND inbox_address = ?').bind(sessionId, address).run(); }
export async function isInboxInSession(db: D1Database, sessionId: string, address: string): Promise<boolean> { return !!(await db.prepare('SELECT 1 FROM session_inboxes WHERE session_id = ? AND inbox_address = ? LIMIT 1').bind(sessionId, address).first()); }
export async function getAttachment(db: D1Database, attachmentId: string): Promise<Attachment | null> { return db.prepare('SELECT * FROM attachments WHERE id = ?').bind(attachmentId).first<Attachment>(); }

export async function getAdminStats(db: D1Database) {
  const [inboxes, messages, attachments] = await Promise.all([db.prepare('SELECT COUNT(*) AS count FROM inboxes').first<{ count: number }>(), db.prepare('SELECT COUNT(*) AS count FROM messages').first<{ count: number }>(), db.prepare('SELECT COUNT(*) AS count FROM attachments').first<{ count: number }>()]);
  return { inboxes: Number(inboxes?.count || 0), messages: Number(messages?.count || 0), attachments: Number(attachments?.count || 0) };
}
export async function getAdminInboxes(db: D1Database) { return db.prepare(`SELECT i.address, i.created_at, (SELECT COUNT(*) FROM messages m WHERE m.inbox_address = i.address) AS message_count FROM inboxes i ORDER BY i.created_at DESC LIMIT 500`).all<Inbox & { message_count: number }>().then(r => r.results); }
export async function getAdminMessages(db: D1Database, address: string): Promise<Message[]> { const result = await db.prepare('SELECT * FROM messages WHERE inbox_address = ? ORDER BY received_at DESC LIMIT 500').bind(address).all<Omit<Message, 'attachments'>>(); return attachMessages(db, result.results); }

export async function deleteInbox(db: D1Database, address: string): Promise<Attachment[]> { const attachments = await db.prepare('SELECT a.* FROM attachments a INNER JOIN messages m ON m.id = a.message_id WHERE m.inbox_address = ?').bind(address).all<Attachment>(); await db.batch([db.prepare('DELETE FROM attachments WHERE message_id IN (SELECT id FROM messages WHERE inbox_address = ?)').bind(address), db.prepare('DELETE FROM messages WHERE inbox_address = ?').bind(address), db.prepare('DELETE FROM session_inboxes WHERE inbox_address = ?').bind(address), db.prepare('DELETE FROM inboxes WHERE address = ?').bind(address)]); return attachments.results; }
export async function deleteMessage(db: D1Database, messageId: string): Promise<Attachment[]> { const attachments = await db.prepare('SELECT * FROM attachments WHERE message_id = ?').bind(messageId).all<Attachment>(); await db.batch([db.prepare('DELETE FROM attachments WHERE message_id = ?').bind(messageId), db.prepare('DELETE FROM messages WHERE id = ?').bind(messageId)]); return attachments.results; }
export async function cleanupExpired(db: D1Database, expiryDays: number): Promise<void> { if (expiryDays <= 0) return; const expired = await db.prepare(`SELECT address FROM inboxes WHERE datetime(created_at) < datetime('now', '-' || ? || ' days')`).bind(expiryDays).all<{ address: string }>(); for (const inbox of expired.results) await deleteInbox(db, inbox.address); await db.prepare(`DELETE FROM sessions WHERE datetime(created_at) < datetime('now', '-' || ? || ' days')`).bind(expiryDays).run(); }
