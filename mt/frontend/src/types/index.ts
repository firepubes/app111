export interface Config { appName: string; mailDomain: string; mailDomains: string[]; webHost: string; expiryDays: number; }
export interface Inbox { address: string; created_at: string; }
export interface Attachment { filename: string; mimeType: string; size: number; contentId?: string; data: string; }
export interface Message { id: string; inbox_address: string; from_address: string; subject: string; body: string; html_body: string; attachments: string | Attachment[]; received_at: string; }
export interface Session { sessionId: string; }
