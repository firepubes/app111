import type { Config, Inbox, Message, Session } from '../types';

const SESSION_KEY = 'mailtune_session_id';

function getStoredSessionId(): string {
  return localStorage.getItem(SESSION_KEY) ?? '';
}

function storeSessionId(id: string): void {
  localStorage.setItem(SESSION_KEY, id);
}

let sessionId = getStoredSessionId();

export function getCurrentSessionId(): string {
  return sessionId;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (sessionId) {
    headers['x-session-id'] = sessionId;
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchConfig(): Promise<Config> {
  return request<Config>('/api/config');
}

export async function initSession(): Promise<string> {
  const data = await request<Session>('/api/session');
  sessionId = data.sessionId;
  storeSessionId(sessionId);
  return sessionId;
}

export async function fetchInboxes(): Promise<Inbox[]> {
  return request<Inbox[]>('/api/inboxes');
}

export async function createInbox(options: {
  localPart?: string;
  domain?: string;
}): Promise<Inbox> {
  return request<Inbox>('/api/inboxes', {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

export async function deleteInbox(address: string): Promise<void> {
  await request<{ ok: boolean }>(
    `/api/inboxes/${encodeURIComponent(address)}`,
    { method: 'DELETE' },
  );
}

export async function fetchMessages(address: string): Promise<Message[]> {
  return request<Message[]>(
    `/api/inboxes/${encodeURIComponent(address)}/messages`,
  );
}
