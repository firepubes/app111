-- Existing installations: run this once against the remote D1 database.
-- This migration is intentionally separate from schema.sql so a fresh database can use schema.sql directly.

ALTER TABLE messages ADD COLUMN html_body TEXT DEFAULT NULL;

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size INTEGER NOT NULL DEFAULT 0,
  object_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_message ON attachments(message_id);
