export interface Config {
  appName: string;
  mailDomain: string;
  mailDomains: string[];
  webHost: string;
  expiryDays: number;
}

export interface Inbox {
  address: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
}

export interface Message {
  id: string;
  inbox_address: string;
  from_address: string;
  subject: string;
  body: string;
  html_body?: string | null;
  received_at: string;
  attachments: Attachment[];
}

export interface Session {
  sessionId: string;
}
