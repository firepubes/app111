# MailTune API Reference

The MailTune REST API is served via Hono on Cloudflare Workers. It uses a session-based approach without requiring user registration.

## Authentication

All API endpoints (except `/api/config` and `/api/session`) require an `x-session-id` header.

```http
x-session-id: <your-session-id>
```

You can obtain a session ID by calling `GET /api/session`.

---

## Endpoints

### 1. Get Configuration
Retrieves the application configuration.

**Request:**
`GET /api/config`

**Response:**
```json
{
  "appName": "MailTune",
  "mailDomain": "example.com",
  "mailDomains": ["example.com", "alt.example.com"],
  "webHost": "mailtune.example.com"
}
```

### 2. Initialize Session
Creates a new anonymous session.

**Request:**
`GET /api/session`

**Response:**
```json
{
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### 3. List Inboxes
Retrieves all inboxes owned by the current session.

**Request:**
`GET /api/inboxes`
Headers: `x-session-id`

**Response:**
```json
[
  {
    "address": "cool-user@example.com",
    "created_at": "2024-01-01T12:00:00Z"
  }
]
```

### 4. Create Inbox
Creates a new disposable inbox.

**Request:**
`POST /api/inboxes`
Headers: `x-session-id`, `Content-Type: application/json`

**Body (Optional):**
```json
{
  "localPart": "custom-name",
  "domain": "example.com"
}
```
*If `localPart` is omitted, a random 10-character string will be generated. If `domain` is omitted, the default domain is used.*

**Response:**
```json
{
  "address": "custom-name@example.com",
  "created_at": "2024-01-01T12:00:00Z"
}
```

### 5. Delete Inbox
Deletes an inbox and unlinks it from the session.

**Request:**
`DELETE /api/inboxes/:address`
Headers: `x-session-id`

**Response:**
```json
{
  "ok": true
}
```

### 6. List Messages
Retrieves all emails received by a specific inbox.

**Request:**
`GET /api/inboxes/:address/messages`
Headers: `x-session-id`

**Response:**
```json
[
  {
    "id": "msg_123456",
    "inbox_address": "cool-user@example.com",
    "from_address": "sender@external.com",
    "subject": "Welcome to MailTune!",
    "body": "Hello there,\n\nThis is a plain text email body.",
    "received_at": "2024-01-01T12:05:00Z"
  }
]
```
