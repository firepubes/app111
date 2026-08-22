import api from './api/routes';
import admin from './api/admin';
import { handleEmail } from './email-handler';
import type { EmailHandlerEnv } from './email-handler';
import type { ApiEnv } from './api/routes';
import type { AdminEnv } from './api/admin';
export interface Env extends ApiEnv, EmailHandlerEnv, AdminEnv { EXPIRY_DAYS?:string; ASSETS:Fetcher; }
export default {
 async fetch(request:Request,env:Env,ctx:ExecutionContext):Promise<Response>{const url=new URL(request.url);if(url.pathname.startsWith('/api/admin/')){const u=new URL(request.url);u.pathname=url.pathname.slice('/api/admin'.length);return admin.fetch(new Request(u,request),env,ctx);}if(url.pathname.startsWith('/api/')){const u=new URL(request.url);u.pathname=url.pathname.slice(4);return api.fetch(new Request(u,request),env,ctx);}return env.ASSETS.fetch(request);},
 async email(message:ForwardableEmailMessage,env:Env,_ctx:ExecutionContext):Promise<void>{await handleEmail(message,env);},
 async scheduled(_event:ScheduledEvent,env:Env,ctx:ExecutionContext):Promise<void>{
   const configured=await env.DB.prepare(`SELECT value FROM admin_settings WHERE key='retention_days'`).first<{value:string}>().catch(()=>null);
   const expiryDays=parseInt(configured?.value || env.EXPIRY_DAYS || '0',10);
   if(expiryDays>0){const {cleanupExpired}=await import('./db/queries');ctx.waitUntil(cleanupExpired(env.DB,expiryDays));}
 },
};
