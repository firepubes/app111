import PostalMime from 'postal-mime';
import type { D1Database } from '@cloudflare/workers-types';
import { createInbox, inboxExists, insertMessage } from './db/queries';
import type { Attachment } from './db/queries';

export interface EmailHandlerEnv { DB: D1Database; MAIL_DOMAIN: string; }

function toBase64(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  return btoa(binary);
}

export async function handleEmail(message: ForwardableEmailMessage, env: EmailHandlerEnv): Promise<void> {
  const to = message.to.toLowerCase();
  const from = message.from.toLowerCase();
  console.log(`[email] Received from=${from} to=${to}`);
  try {
    const parsed = await new PostalMime().parse(message.raw);
    const subject = parsed.subject || '(no subject)';
    const body = parsed.text?.trim() || '';
    const htmlBody = parsed.html || '';
    const attachments: Attachment[] = [];

    for (const attachment of parsed.attachments || []) {
      let data = '';
      if (attachment.content instanceof ArrayBuffer || attachment.content instanceof Uint8Array) data = toBase64(attachment.content);
      else if (attachment.content) data = toBase64(await new Response(attachment.content as BodyInit).arrayBuffer());
      attachments.push({
        filename: attachment.filename || 'attachment',
        mimeType: attachment.mimeType || 'application/octet-stream',
        size: data ? Math.floor(data.length * 0.75) : 0,
        contentId: attachment.contentId || undefined,
        data,
      });
    }

    const db = env.DB;
    if (!(await inboxExists(db, to))) await createInbox(db, to);
    const msgId = `msg_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await insertMessage(db, {
      id: msgId,
      inbox_address: to,
      from_address: from,
      subject,
      body,
      html_body: htmlBody,
      attachments: JSON.stringify(attachments),
    });
    console.log(`[email] Stored message ${msgId} for ${to} with ${attachments.length} attachment(s)`);
  } catch (err) {
    console.error(`[email] Failed to process email for ${to}:`, err);
  }
}
