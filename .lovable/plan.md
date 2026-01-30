

# Facebook Page Connection ও Meta Graph API Integration Plan

## Overview

Messenger Inbox পেজে Facebook Page connection setup করা হবে Meta Graph API integration সহ। এই integration এ:

1. **Facebook Login** - Meta OAuth দিয়ে Page Access Token collect
2. **Page Connection** - Connected Facebook Pages manage
3. **Webhook Setup** - Real-time message notifications receive
4. **Conversations API** - Messages fetch ও reply করা
5. **Real-time Chat UI** - Conversation view ও reply interface

---

## Phase 1: Database Schema

### New Tables

```text
+--------------------------------+        +--------------------------------+
|     messenger_connections      |        |      messenger_messages        |
+--------------------------------+        +--------------------------------+
| id (uuid, PK)                  |        | id (uuid, PK)                  |
| page_id (text)                 |        | connection_id (uuid, FK)       |
| page_name (text)               |        | sender_psid (text)             |
| page_access_token (text)       |        | sender_name (text, nullable)   |
| user_access_token (text)       |        | message_id (text)              |
| token_expires_at (timestamptz) |        | message_text (text, nullable)  |
| is_active (boolean)            |        | attachments (jsonb, nullable)  |
| app_id (text, nullable)        |        | is_from_page (boolean)         |
| webhook_verify_token (text)    |        | timestamp (timestamptz)        |
| created_at (timestamptz)       |        | read_at (timestamptz, nullable)|
| updated_at (timestamptz)       |        | created_at (timestamptz)       |
+--------------------------------+        +--------------------------------+
                                                        |
                                          +-------------+
                                          |
+--------------------------------+        v
|   messenger_conversations      |<-------+
+--------------------------------+
| id (uuid, PK)                  |
| connection_id (uuid, FK)       |
| sender_psid (text)             |
| sender_name (text, nullable)   |
| sender_profile_pic (text, null)|
| last_message_at (timestamptz)  |
| unread_count (int)             |
| created_at (timestamptz)       |
| updated_at (timestamptz)       |
+--------------------------------+
```

---

## Phase 2: Edge Functions

### 2.1 `messenger-auth/index.ts`

**Purpose**: Facebook OAuth token exchange

```text
POST /messenger-auth
Body: { code: string, redirectUri: string }

Flow:
1. Exchange authorization code for access token
2. Get long-lived user access token
3. Fetch user's Facebook Pages
4. Return pages list for selection
```

**Meta Graph API Calls:**
- Token Exchange: `https://graph.facebook.com/v21.0/oauth/access_token`
- Long-lived Token: `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token`
- Pages List: `https://graph.facebook.com/v21.0/me/accounts`

### 2.2 `messenger-connect-page/index.ts`

**Purpose**: Connect a Facebook Page

```text
POST /messenger-connect-page
Body: { pageId: string, pageName: string, pageAccessToken: string }

Flow:
1. Validate page access token
2. Subscribe to webhooks for the page
3. Save connection to database
4. Return connection details
```

**Meta Graph API Calls:**
- Subscribe Webhooks: `POST /{page-id}/subscribed_apps`
  - Fields: `messages, messaging_postbacks, messaging_optins`

### 2.3 `messenger-webhook/index.ts`

**Purpose**: Receive webhook events from Meta

```text
GET /messenger-webhook (Verification)
Query: hub.mode, hub.verify_token, hub.challenge

POST /messenger-webhook (Events)
Body: { object: "page", entry: [...] }

Flow:
1. Verify signature using App Secret
2. Parse incoming messages
3. Save to messenger_messages table
4. Update conversation last_message_at
5. Trigger realtime update
```

### 2.4 `messenger-conversations/index.ts`

**Purpose**: Fetch conversations list

```text
GET /messenger-conversations?connectionId=xxx

Flow:
1. Query messenger_conversations table
2. Return with last message preview
```

### 2.5 `messenger-messages/index.ts`

**Purpose**: Fetch messages for a conversation

```text
GET /messenger-messages?conversationId=xxx&psid=xxx

Flow:
1. Query messenger_messages table
2. Mark as read if needed
3. Return messages in chronological order
```

### 2.6 `messenger-send/index.ts`

**Purpose**: Send a message to customer

```text
POST /messenger-send
Body: { connectionId: string, recipientPsid: string, message: string }

Flow:
1. Fetch page access token
2. Call Meta Send API
3. Save outgoing message to DB
4. Return confirmation
```

**Meta Graph API Call:**
```text
POST https://graph.facebook.com/v21.0/{page-id}/messages
Body: {
  recipient: { id: "{PSID}" },
  message: { text: "Hello!" },
  messaging_type: "RESPONSE"
}
```

---

## Phase 3: Admin UI Components

### 3.1 Page Layout Structure

```text
+------------------------------------------+
|  Messenger Inbox                          |
|  Manage your Facebook Messenger conversations |
+------------------------------------------+
|                                          |
|  [No Connection State]                   |
|  +--------------------------------------+|
|  | Connect Facebook Page                ||
|  | [Connect with Facebook] Button       ||
|  +--------------------------------------+|
|                                          |
|  [Connected State - Chat Interface]      |
|  +----------------+---------------------+|
|  | Conversations  | Chat Area           ||
|  | List (Left)    | (Right)             ||
|  |                |                     ||
|  | [User 1] 2m    | From: John Doe      ||
|  | Last msg...    | ------------------- ||
|  |                | [Message bubbles]   ||
|  | [User 2] 1h    |                     ||
|  | Last msg...    | ------------------- ||
|  |                | [Reply Input]       ||
|  +----------------+---------------------+|
|                                          |
+------------------------------------------+
```

### 3.2 Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `MessengerConnectionCard.tsx` | `src/components/admin/messenger/` | Connect/Disconnect Facebook Page |
| `MessengerConversationList.tsx` | `src/components/admin/messenger/` | Conversations sidebar |
| `MessengerChatWindow.tsx` | `src/components/admin/messenger/` | Message display area |
| `MessengerMessageInput.tsx` | `src/components/admin/messenger/` | Reply input box |
| `MessengerWebhookSetup.tsx` | `src/components/admin/messenger/` | Webhook URL ও setup guide |

### 3.3 Custom Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useMessengerConnection.ts` | `src/hooks/` | Connection CRUD operations |
| `useMessengerConversations.ts` | `src/hooks/` | Fetch conversations |
| `useMessengerMessages.ts` | `src/hooks/` | Fetch ও send messages |
| `useMessengerRealtime.ts` | `src/hooks/` | Realtime message updates |

---

## Phase 4: Facebook OAuth Flow

### User Flow Diagram

```text
+--------+     +------------+     +----------+     +------------+
| Admin  |---->| Click      |---->| Facebook |---->| Select     |
| Panel  |     | "Connect"  |     | Login    |     | Page       |
+--------+     +------------+     +----------+     +------------+
                                       |                 |
                                       v                 v
                              +------------------+  +-------------+
                              | Grant Permission |  | Page        |
                              | - pages_show_list|  | Connected!  |
                              | - pages_messaging|  +-------------+
                              | - pages_read_engmt|
                              +------------------+
```

### Required Meta App Permissions

| Permission | Purpose |
|------------|---------|
| `pages_show_list` | List user's Facebook Pages |
| `pages_messaging` | Send/receive messages |
| `pages_read_engagement` | Read page data |
| `pages_manage_metadata` | Subscribe to webhooks |

---

## Phase 5: Webhook Integration

### Webhook URL
Custom domain routing via vercel.json:
```
yourdomain.com/api/messenger-webhook
```

### Webhook Verification
Meta sends GET request with:
- `hub.mode=subscribe`
- `hub.verify_token={YOUR_TOKEN}`
- `hub.challenge={RANDOM_STRING}`

Server must respond with `hub.challenge` value.

### Incoming Message Payload
```json
{
  "object": "page",
  "entry": [{
    "id": "{PAGE_ID}",
    "time": 1458692752478,
    "messaging": [{
      "sender": { "id": "{PSID}" },
      "recipient": { "id": "{PAGE_ID}" },
      "timestamp": 1458692752478,
      "message": {
        "mid": "{MESSAGE_ID}",
        "text": "Hello!"
      }
    }]
  }]
}
```

---

## Files to Create

### Edge Functions

| File | Description |
|------|-------------|
| `supabase/functions/messenger-auth/index.ts` | OAuth token exchange |
| `supabase/functions/messenger-connect-page/index.ts` | Page connection |
| `supabase/functions/messenger-webhook/index.ts` | Webhook handler |
| `supabase/functions/messenger-conversations/index.ts` | List conversations |
| `supabase/functions/messenger-messages/index.ts` | Fetch messages |
| `supabase/functions/messenger-send/index.ts` | Send message |

### UI Components

| File | Description |
|------|-------------|
| `src/components/admin/messenger/MessengerConnectionCard.tsx` | Facebook connect UI |
| `src/components/admin/messenger/MessengerConversationList.tsx` | Conversations sidebar |
| `src/components/admin/messenger/MessengerChatWindow.tsx` | Chat display |
| `src/components/admin/messenger/MessengerMessageInput.tsx` | Reply input |
| `src/components/admin/messenger/MessengerWebhookSetup.tsx` | Webhook guide |
| `src/components/admin/messenger/index.ts` | Barrel exports |

### Hooks

| File | Description |
|------|-------------|
| `src/hooks/useMessengerConnection.ts` | Connection management |
| `src/hooks/useMessengerConversations.ts` | Conversations data |
| `src/hooks/useMessengerMessages.ts` | Messages CRUD |
| `src/hooks/useMessengerRealtime.ts` | Realtime subscriptions |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/admin/InboxMessenger.tsx` | Full UI implementation |
| `supabase/config.toml` | New edge function configs |
| `vercel.json` | Messenger webhook route |

---

## API Secrets Required

Admin এ এই credentials দিতে হবে (Meta App Dashboard থেকে):

| Secret | Description |
|--------|-------------|
| `FACEBOOK_APP_ID` | Meta App ID |
| `FACEBOOK_APP_SECRET` | Meta App Secret |

---

## Security Considerations

1. **Webhook Signature Validation**: `X-Hub-Signature-256` header verify করা হবে
2. **Token Encryption**: Page access tokens encrypted store করা হবে
3. **Admin Only Access**: সব endpoints admin-only
4. **Rate Limiting**: Meta API rate limits handle করা হবে

---

## Realtime Features

Supabase Realtime enable করা হবে `messenger_messages` table এ:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messenger_messages;
```

এতে নতুন message আসলে UI instantly update হবে।

---

## Implementation Order

1. Database schema migration
2. Meta App secrets setup
3. Edge functions (messenger-auth, messenger-webhook)
4. MessengerConnectionCard UI
5. Webhook verification ও testing
6. Edge functions (conversations, messages, send)
7. Chat UI components
8. Realtime integration
9. Vercel webhook route

