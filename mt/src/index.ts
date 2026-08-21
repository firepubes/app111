import api from './api/routes';
import admin from './api/admin';
import { handleEmail } from './email-handler';
import type { EmailHandlerEnv } from './email-handler';
import type { ApiEnv } from './api/routes';
import type { AdminEnv } from './api/admin';

export interface Env extends ApiEnv, EmailHandlerEnv, AdminEnv {
  EXPIRY_DAYS?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/admin/')) {
      const adminUrl = new URL(request.url);
      adminUrl.pathname = url.pathname.slice('/api/admin'.length);
      const adminRequest = new Request(adminUrl, request);
      return admin.fetch(adminRequest, env, ctx);
    }

    if (url.pathname.startsWith('/api/')) {
      const apiUrl = new URL(request.url);
      apiUrl.pathname = url.pathname.slice(4);
      const apiRequest = new Request(apiUrl, request);
      return api.fetch(apiRequest, env, ctx);
    }

    return new Response('Not found', { status: 404 });
  },

  async email(message: ForwardableEmailMessage, env: Env, _ctx: ExecutionContext): Promise<void> {
    await handleEmail(message, env);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const expiryDays = parseInt(env.EXPIRY_DAYS || '0', 10);
    if (expiryDays > 0) {
      const { cleanupExpired } = await import('./db/queries');
      ctx.waitUntil(cleanupExpired(env.DB, expiryDays));
    }
  },
};
