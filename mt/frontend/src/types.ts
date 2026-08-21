export interface Message {
  id: string;
  inbox_address: string;
  from_address: string;
  subject: string;
  body: string;
  html_body?: string | null;
  created_at: string;
}