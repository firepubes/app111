import PostalMime from 'postal-mime';
import type { D1Database } from '@cloudflare/workers-types';
import type { R2Bucket } from '@cloudflare/workers-types';
import { createInbox, inboxExists, insertAttachment, insertMessage } from './db/queries';

export interface EmailHandlerEnv {
  DB: D1Database;
  MAIL_DOMAIN: string;
  ATTACHMENTS: R2Bucket;
}

export async function handleEmail(message: ForwardableEmailMessage, env: EmailHandlerEnv): Promise<void> {
  const to = message.to.toLowerCase();
  const from = message.from.toLowerCase();
  console.log(`[email] Received from=${from} to=${to}`);

  try {
    const parser = new PostalMime();
    const parsed = await parser.parse(message.raw);
    const subject = parsed.subject || '(no subject)';
    const body = parsed.text?.trim() || parsed.html || '';
    const db = env.DB;

    if (!(await inboxExists(db, to))) {
      await createInbox(db, to);
      console.log(`[email] Created new inbox: ${to}`);
    }

    const msgId = `msg_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await insertMessage(db, { id: msgId, inbox_address: to, from_address: from, subject, body });

    const attachments = parsed.attachments || [];
    for (const attachment of attachments) {
      const attachmentId = `att_${crypto.randomUUID()}`;
      const objectKey = `messages/${msgId}/${attachmentId}`;
      const content = attachment.content instanceof Uint8Array
        ? attachment.content
        : new Uint8Array(attachment.content as ArrayBuffer);
      const filename = attachment.filename || 'attachment';
      const contentType = attachment.mimeType || 'application/octet-stream';

      await env.ATTACHMENTS.put(objectKey, content, {
        httpMetadata: { contentType, contentDisposition: `inline; filename="${filename.replace(/["\\\r\n]/g, '_')}"` },
      });
      await insertAttachment(db, {
        id: attachmentId,
        message_id: msgId,
        filename,
        content_type: contentType,
        size: content.byteLength,
        object_key: objectKey,
      });
    }

    console.log(`[email] Stored message ${msgId} for ${to} with ${attachments.length} attachment(s)`);
  } catch (err) {
    console.error(`[email] Failed to process email for ${to}:`, err);
  }
}
