-- RatioMail D1 Schema
CREATE TABLE IF NOT EXISTS inboxes (
  address TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  inbox_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  subject TEXT DEFAULT '(no subject)',
  body TEXT DEFAULT '',
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (inbox_address) REFERENCES inboxes(address)
);

CREATE INDEX IF NOT EXISTS idx_messages_inbox ON messages(inbox_address);
CREATE INDEX IF NOT EXISTS idx_messages_received ON messages(inbox_address, received_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session_inboxes (
  session_id TEXT NOT NULL,
  inbox_address TEXT NOT NULL,
  PRIMARY KEY (session_id, inbox_address),
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (inbox_address) REFERENCES inboxes(address)
);

CREATE INDEX IF NOT EXISTS idx_session_inboxes_session ON session_inboxes(session_id);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  object_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (message_id) REFERENCES messages(id)
);

CREATE INDEX IF NOT EXISTS idx_attachments_message ON attachments(message_id);
