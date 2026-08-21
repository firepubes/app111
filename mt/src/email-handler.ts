import PostalMime from 'postal-mime';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import {
  createInbox,
  inboxExists,
  insertAttachment,
  insertMessage,
} from './db/queries';

export interface EmailHandlerEnv {
  DB: D1Database;
  ATTACHMENTS: R2Bucket;
  MAIL_DOMAIN: string;
}

function toArrayBuffer(value: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (value instanceof ArrayBuffer) return value;
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
}

export async function handleEmail(message: ForwardableEmailMessage, env: EmailHandlerEnv): Promise<void> {
  const to = message.to.toLowerCase();
  const from = message.from.toLowerCase();

  console.log(`[email] Received from=${from} to=${to}`);

  try {
    const parser = new PostalMime();
    const parsed = await parser.parse(message.raw);

    const subject = parsed.subject || '(no subject)';
    const textBody = parsed.text?.trim() || '';
    const htmlBody = parsed.html?.trim() || null;
    const body = textBody || htmlBody || '';

    const db = env.DB;
    if (!(await inboxExists(db, to))) {
      await createInbox(db, to);
      console.log(`[email] Created new inbox: ${to}`);
    }

    const msgId = `msg_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    await insertMessage(db, {
      id: msgId,
      inbox_address: to,
      from_address: from,
      subject,
      body,
      html_body: htmlBody,
    });

    const attachments = parsed.attachments ?? [];

    for (const attachment of attachments) {
      const attachmentId = `att_${crypto.randomUUID()}`;
      const objectKey = `messages/${msgId}/${attachmentId}`;
      const content = toArrayBuffer(attachment.content);

      await env.ATTACHMENTS.put(objectKey, content, {
        httpMetadata: {
          contentType: attachment.mimeType || 'application/octet-stream',
          contentDisposition: `attachment; filename="${attachment.filename || 'attachment'}"`,
        },
      });

      await insertAttachment(db, {
        id: attachmentId,
        message_id: msgId,
        filename: attachment.filename || 'attachment',
        content_type: attachment.mimeType || 'application/octet-stream',
        size: content.byteLength,
        object_key: objectKey,
      });
    }

    console.log(`[email] Stored message ${msgId} for ${to} with ${attachments.length} attachment(s)`);
  } catch (err) {
    console.error(`[email] Failed to process email for ${to}:`, err);
  }
}
