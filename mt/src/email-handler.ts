import PostalMime from 'postal-mime';
import type { D1Database } from '@cloudflare/workers-types';
import { createInbox, inboxExists, insertMessage } from './db/queries';
import type { Attachment } from './db/queries';

export interface EmailHandlerEnv { DB: D1Database; MAIL_DOMAIN: string; }
function toBase64(data: ArrayBuffer | Uint8Array): string { const bytes=data instanceof Uint8Array?data:new Uint8Array(data); let binary=''; for(let i=0;i<bytes.length;i+=0x8000) binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+0x8000,bytes.length))); return btoa(binary); }
async function emailLog(db:D1Database,level:string,event:string,details:unknown){ try { await db.prepare(`CREATE TABLE IF NOT EXISTS admin_logs (id TEXT PRIMARY KEY, level TEXT NOT NULL, event TEXT NOT NULL, details TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run(); await db.prepare('INSERT INTO admin_logs(id,level,event,details) VALUES(?,?,?,?)').bind(crypto.randomUUID(),level,event,JSON.stringify(details)).run(); } catch {} }

export async function handleEmail(message: ForwardableEmailMessage, env: EmailHandlerEnv): Promise<void> {
  const to=message.to.toLowerCase(); const from=message.from.toLowerCase(); console.log(`[email] Received from=${from} to=${to}`); await emailLog(env.DB,'info','email.received',{from,to});
  try {
    const parsed=await new PostalMime().parse(message.raw); const subject=parsed.subject||'(no subject)'; const body=parsed.text?.trim()||''; const htmlBody=parsed.html||''; const attachments:Attachment[]=[];
    for(const attachment of parsed.attachments||[]){ let data=''; if(attachment.content instanceof ArrayBuffer||attachment.content instanceof Uint8Array)data=toBase64(attachment.content); else if(attachment.content)data=toBase64(await new Response(attachment.content as BodyInit).arrayBuffer()); attachments.push({filename:attachment.filename||'attachment',mimeType:attachment.mimeType||'application/octet-stream',size:data?Math.floor(data.length*.75):0,contentId:attachment.contentId||undefined,data}); }
    const db=env.DB; if(!(await inboxExists(db,to))){await createInbox(db,to); await emailLog(db,'info','inbox.auto_created',{address:to});}
    const msgId=`msg_${Date.now()}_${crypto.randomUUID().slice(0,8)}`;
    await insertMessage(db,{id:msgId,inbox_address:to,from_address:from,subject,body,html_body:htmlBody,attachments:JSON.stringify(attachments)});
    console.log(`[email] Stored message ${msgId} for ${to} with ${attachments.length} attachment(s)`); await emailLog(db,'info','email.stored',{id:msgId,to,from,subject,attachments:attachments.length});
  } catch(err){ console.error(`[email] Failed to process email for ${to}:`,err); await emailLog(env.DB,'error','email.processing_failed',{to,from,error:err instanceof Error?err.message:String(err)}); }
}
