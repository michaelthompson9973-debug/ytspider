
# 🚀 Enterprise Messenger CRM + AI Agent + Ads Hub - Full Blueprint

## প্রজেক্ট সারাংশ

এটি একটি **বিশ্বমানের Facebook Messenger Automation Hub** যেখানে থাকবে:

| মডিউল | বৈশিষ্ট্য |
|-------|----------|
| **Smart Inbox** | Real-time chat, multi-page support, filters |
| **AI Sales Agent** | Product training, auto-reply, FAQ handling |
| **Order CRM** | In-chat ordering, customer labels, history |
| **Ads Intelligence** | Campaign tracking, ROAS, optimization |
| **Agent System** | Multi-agent assign, SLA, performance |

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MESSENGER CRM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌─────────────┐     ┌─────────────────────────────────────────────┐     │
│    │  Facebook   │────►│           WEBHOOK RECEIVER                  │     │
│    │  Messenger  │     │        (Edge Function)                      │     │
│    │    API      │◄────│   messenger-webhook, messenger-send         │     │
│    └─────────────┘     └────────────────┬────────────────────────────┘     │
│                                         │                                   │
│                                         ▼                                   │
│    ┌────────────────────────────────────────────────────────────────┐      │
│    │                    SUPABASE DATABASE                            │      │
│    ├────────────────────────────────────────────────────────────────┤      │
│    │                                                                 │      │
│    │  messenger_connections    messenger_conversations              │      │
│    │  messenger_messages       customer_profiles (NEW)              │      │
│    │  customer_labels (NEW)    ai_training_data (NEW)               │      │
│    │  auto_reply_rules (NEW)   agent_assignments (NEW)              │      │
│    │  conversation_tags (NEW)  ad_sources (NEW)                     │      │
│    │                                                                 │      │
│    └────────────────────────────────────────────────────────────────┘      │
│                                         │                                   │
│                                         ▼                                   │
│    ┌────────────────────────────────────────────────────────────────┐      │
│    │                 REACT FRONTEND                                  │      │
│    ├────────────────────────────────────────────────────────────────┤      │
│    │                                                                 │      │
│    │  ┌───────────┐  ┌─────────────────┐  ┌───────────────────┐    │      │
│    │  │   LEFT    │  │     CENTER      │  │      RIGHT        │    │      │
│    │  │  SIDEBAR  │  │   CHAT WINDOW   │  │  CONTROL PANEL    │    │      │
│    │  │           │  │                 │  │                   │    │      │
│    │  │ • Pages   │  │ • Messages      │  │ • Customer Info   │    │      │
│    │  │ • Filters │  │ • AI Suggest    │  │ • Labels          │    │      │
│    │  │ • Search  │  │ • Quick Reply   │  │ • Orders          │    │      │
│    │  │ • Agents  │  │ • Order Form    │  │ • Ads Source      │    │      │
│    │  │           │  │                 │  │ • AI Training     │    │      │
│    │  └───────────┘  └─────────────────┘  └───────────────────┘    │      │
│    │                                                                 │      │
│    └────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│    ┌────────────────────────────────────────────────────────────────┐      │
│    │                    AI ENGINE (Lovable AI)                       │      │
│    ├────────────────────────────────────────────────────────────────┤      │
│    │  • Product Knowledge Vector Store                               │      │
│    │  • Auto-Reply Generator                                         │      │
│    │  • Intent Classification                                        │      │
│    │  • Agent Suggestion Engine                                      │      │
│    └────────────────────────────────────────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema (নতুন টেবিল)

### Existing Tables (Already Created)
- `messenger_connections` - Facebook Page connections
- `messenger_conversations` - Customer conversations  
- `messenger_messages` - Individual messages

### New Tables Required

```sql
-- 1. Customer Profiles (CRM Brain)
CREATE TABLE customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  psid text NOT NULL,
  connection_id uuid REFERENCES messenger_connections(id),
  name text,
  profile_pic text,
  phone text,
  email text,
  address text,
  city text,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  first_contact_at timestamptz,
  last_contact_at timestamptz,
  source_ad_id text,
  source_campaign_id text,
  is_vip boolean DEFAULT false,
  risk_score integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(psid, connection_id)
);

-- 2. Customer Labels (Dynamic Tags)
CREATE TABLE customer_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#3B82F6',
  description text,
  is_system boolean DEFAULT false,
  auto_rule jsonb, -- Auto-assign rules
  created_at timestamptz DEFAULT now()
);

-- 3. Customer Label Assignments
CREATE TABLE customer_label_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customer_profiles(id) ON DELETE CASCADE,
  label_id uuid REFERENCES customer_labels(id) ON DELETE CASCADE,
  assigned_by uuid, -- agent or 'system'
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, label_id)
);

-- 4. AI Training Data (Product Knowledge)
CREATE TABLE ai_training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, -- 'product', 'faq', 'policy', 'promo'
  title text NOT NULL,
  content text NOT NULL,
  keywords text[],
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Auto-Reply Rules (Rule Engine)
CREATE TABLE auto_reply_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL, -- 'keyword', 'intent', 'ad_source', 'time'
  trigger_conditions jsonb NOT NULL,
  response_type text NOT NULL, -- 'text', 'template', 'ai'
  response_content text,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  use_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 6. Agent System
CREATE TABLE messenger_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  avatar text,
  status text DEFAULT 'offline', -- online, offline, busy
  max_conversations integer DEFAULT 10,
  current_load integer DEFAULT 0,
  total_resolved integer DEFAULT 0,
  avg_response_time integer, -- seconds
  satisfaction_score numeric,
  created_at timestamptz DEFAULT now()
);

-- 7. Conversation Assignments
CREATE TABLE conversation_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES messenger_conversations(id),
  agent_id uuid REFERENCES messenger_agents(id),
  assigned_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  sla_breach boolean DEFAULT false,
  notes text
);

-- 8. Quick Replies / Saved Responses
CREATE TABLE quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  shortcut text, -- e.g., /price, /delivery
  category text,
  use_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 9. Ad Source Tracking
CREATE TABLE ad_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES messenger_conversations(id),
  ad_id text,
  campaign_id text,
  adset_id text,
  ad_name text,
  campaign_name text,
  placement text,
  click_timestamp timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 10. Conversation Tags (Hot, Complaint, etc.)
CREATE TABLE conversation_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES messenger_conversations(id),
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, tag)
);
```

---

## 🎨 UI Layout Design

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📨 Messenger Inbox          [🔍 Search] [👤 Agent: Online] [⚙️ Settings]    │
├────────────────┬───────────────────────────────────┬─────────────────────────┤
│                │                                   │                         │
│  LEFT PANEL    │        CENTER PANEL               │     RIGHT PANEL         │
│  (280px)       │        (flex-1)                   │     (320px)             │
│                │                                   │                         │
│ ┌────────────┐ │  ┌─────────────────────────────┐  │  ┌───────────────────┐  │
│ │📄 Pages    │ │  │ 👤 John Doe                 │  │  │ TABS:             │  │
│ │ • My Shop  │ │  │ From: Ad Campaign X         │  │  │ 👤 Customer       │  │
│ │ • Store 2  │ │  │ Labels: VIP, Hot Lead       │  │  │ 🏷️ Labels         │  │
│ └────────────┘ │  └─────────────────────────────┘  │  │ 🛒 Orders         │  │
│                │                                   │  │ 📊 Ads            │  │
│ ┌────────────┐ │  ┌─────────────────────────────┐  │  │ 🤖 AI             │  │
│ │🔖 Filters  │ │  │                             │  │  │ 📈 History        │  │
│ │ ○ All      │ │  │    MESSAGE HISTORY          │  │  └───────────────────┘  │
│ │ ○ Unread   │ │  │                             │  │                         │
│ │ ○ From Ads │ │  │  [Customer] Hi, price?      │  │  ┌───────────────────┐  │
│ │ ○ VIP      │ │  │                             │  │  │ 👤 CUSTOMER       │  │
│ │ ○ Hot Lead │ │  │  [You] ৳550                 │  │  │ ───────────────   │  │
│ │ ○ Pending  │ │  │                             │  │  │ Name: John Doe    │  │
│ │ ○ Complaint│ │  │  [Customer] Order korbo     │  │  │ Phone: 017...     │  │
│ └────────────┘ │  │                             │  │  │ Orders: 3         │  │
│                │  │  💡 AI SUGGESTION:          │  │  │ Spent: ৳2,500     │  │
│ ┌────────────┐ │  │  ┌───────────────────────┐  │  │  │ VIP: ✅           │  │
│ │💬 CHATS    │ │  │  │ "অর্ডার করতে নাম ও   │  │  │  │ Risk: Low         │  │
│ │            │ │  │  │  ঠিকানা দিন"          │  │  │  └───────────────────┘  │
│ │ ▪ John Doe │ │  │  │        [Use]           │  │  │                         │
│ │   "order"  │ │  │  └───────────────────────┘  │  │  ┌───────────────────┐  │
│ │   🔴 2m ago│ │  │                             │  │  │ 🏷️ LABELS        │  │
│ │            │ │  └─────────────────────────────┘  │  │ ───────────────   │  │
│ │ ▪ Jane     │ │                                   │  │ [+VIP] [+Hot]     │  │
│ │   "hi"     │ │  ┌─────────────────────────────┐  │  │ [+From Ad]        │  │
│ │   ✅ Read  │ │  │     QUICK ACTIONS           │  │  │ [+Complaint]      │  │
│ │            │ │  │ [📦Order] [💰Price] [🚚Del] │  │  └───────────────────┘  │
│ │ ▪ Ahmed    │ │  └─────────────────────────────┘  │                         │
│ │   "price?" │ │                                   │  ┌───────────────────┐  │
│ │   🔴 5m    │ │  ┌─────────────────────────────┐  │  │ 🛒 QUICK ORDER    │  │
│ └────────────┘ │  │ [Message input...]          │  │  │ ───────────────   │  │
│                │  │              [📎] [😀] [➤]  │  │  │ Product: [Select] │  │
│ ┌────────────┐ │  └─────────────────────────────┘  │  │ Qty: [1]          │  │
│ │👥 AGENTS   │ │                                   │  │ [Create Order]    │  │
│ │ 🟢 You     │ │                                   │  └───────────────────┘  │
│ │ 🟡 Agent 2 │ │                                   │                         │
│ │ ⚫ Agent 3 │ │                                   │                         │
│ └────────────┘ │                                   │                         │
│                │                                   │                         │
└────────────────┴───────────────────────────────────┴─────────────────────────┘
```

---

## 🤖 AI Agent System

### Training Data Structure

```json
{
  "products": [
    {
      "name": "প্যান্ট ডায়পার",
      "price": 550,
      "stock": "available",
      "sizes": ["S", "M", "L"],
      "description": "...",
      "faq": [
        {"q": "সাইজ কোনটা নিব?", "a": "০-৩ মাসের জন্য S, ৩-১৫ মাসের জন্য M..."}
      ]
    }
  ],
  "policies": {
    "delivery": "সারা বাংলাদেশে ফ্রি ডেলিভারি...",
    "return": "৭ দিনের মধ্যে ফেরত...",
    "cod": "ক্যাশ অন ডেলিভারি সুবিধা..."
  },
  "promos": [
    {"code": "EID10", "discount": "10%", "valid_until": "..."}
  ]
}
```

### AI Reply Flow

```text
┌──────────────────────────────────────────────────────────────────┐
│                    AI AUTO-REPLY FLOW                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Customer Message: "দাম কত?"                                     │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────┐                                           │
│  │ INTENT DETECTION │                                           │
│  │  → "price_query" │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ CONTEXT LOOKUP   │                                           │
│  │  → Last product  │                                           │
│  │  → Customer hist │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ KNOWLEDGE BASE   │                                           │
│  │  → Product price │                                           │
│  │  → Current promo │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ GENERATED REPLY:                                          │   │
│  │ "৩ পিস প্যান্ট ডায়পার ৳৫৫০।                              │   │
│  │  🎁 এখন অর্ডারে ফ্রি ডেলিভারি!                           │   │
│  │  অর্ডার করতে নাম ও ঠিকানা দিন।"                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Options: [✅ Send Auto] [✏️ Edit] [👤 Assign Agent]            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Edge Functions Required

| Function | Purpose |
|----------|---------|
| `messenger-webhook` | Receive Facebook webhook events |
| `messenger-send` | Send messages via Graph API |
| `messenger-ai-reply` | Generate AI responses |
| `messenger-sync-profile` | Fetch customer info from FB |
| `messenger-label-sync` | Update FB persona labels |

---

## 📢 Facebook API Integration

### Required Permissions
```text
pages_messaging
pages_show_list
pages_read_engagement
pages_manage_metadata
ads_read (for ad tracking)
```

### Webhook Events to Handle
```text
messages          → New incoming message
message_echoes    → Sent message confirmation
message_reads     → Message read receipt
messaging_postbacks → Button clicks
messaging_referrals → Ad click with referral data
```

---

## 📋 Implementation Phases

### Phase 1: Core Inbox (1-2 weeks)
| Task | Components |
|------|------------|
| ✅ Database schema | All new tables |
| ✅ Webhook receiver | Edge function |
| ✅ 3-panel UI | Left, Center, Right |
| ✅ Realtime messages | Supabase Realtime |
| ✅ Send messages | Graph API integration |

### Phase 2: AI Agent (1 week)
| Task | Components |
|------|------------|
| ✅ Training data UI | Admin panel |
| ✅ AI reply generator | Lovable AI Edge Function |
| ✅ Intent detection | Classification system |
| ✅ Suggestion box | In-chat AI suggestions |

### Phase 3: Order + CRM (1 week)
| Task | Components |
|------|------------|
| ✅ In-chat order form | Quick order creation |
| ✅ Customer profiles | CRM panel |
| ✅ Labels system | Dynamic tags |
| ✅ Order history | Per-customer view |

### Phase 4: Agent System (1 week)
| Task | Components |
|------|------------|
| ✅ Multi-agent | Assignment system |
| ✅ SLA tracking | Response time alerts |
| ✅ Performance metrics | Agent dashboard |

### Phase 5: Ads Intelligence (1 week)
| Task | Components |
|------|------------|
| ✅ Ad source tracking | Referral parsing |
| ✅ Campaign analytics | ROAS dashboard |
| ✅ Audience sync | Lookalike/retarget |

---

## 📁 File Structure

```text
src/
├── pages/admin/
│   └── InboxMessenger.tsx (Main page - REWRITE)
│
├── components/admin/messenger/
│   ├── index.ts
│   ├── types.ts
│   │
│   ├── layout/
│   │   ├── InboxLayout.tsx
│   │   ├── LeftSidebar.tsx
│   │   ├── ChatWindow.tsx
│   │   └── RightPanel.tsx
│   │
│   ├── sidebar/
│   │   ├── PagesList.tsx
│   │   ├── ConversationFilters.tsx
│   │   ├── ConversationList.tsx
│   │   ├── ConversationItem.tsx
│   │   └── AgentStatus.tsx
│   │
│   ├── chat/
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── AISuggestionBox.tsx
│   │   ├── QuickActions.tsx
│   │   └── AttachmentPicker.tsx
│   │
│   ├── control-panel/
│   │   ├── CustomerTab.tsx
│   │   ├── LabelsTab.tsx
│   │   ├── OrdersTab.tsx
│   │   ├── AdsTab.tsx
│   │   ├── AITrainingTab.tsx
│   │   └── HistoryTab.tsx
│   │
│   ├── modals/
│   │   ├── QuickOrderModal.tsx
│   │   ├── LabelManagerModal.tsx
│   │   ├── AITrainingModal.tsx
│   │   └── AgentAssignModal.tsx
│   │
│   └── hooks/
│       ├── useConversations.ts
│       ├── useMessages.ts
│       ├── useCustomerProfile.ts
│       ├── useLabels.ts
│       ├── useAIReply.ts
│       └── useMessengerRealtime.ts
│
supabase/functions/
├── messenger-webhook/index.ts
├── messenger-send/index.ts
├── messenger-ai-reply/index.ts
├── messenger-sync-profile/index.ts
└── messenger-label-sync/index.ts
```

---

## 🎯 MVP Focus (Phase 1 Recommendation)

সবচেয়ে গুরুত্বপূর্ণ features দিয়ে শুরু:

1. **3-Panel Layout** - Left sidebar, Chat, Right control panel
2. **Conversation List** - Real-time with Supabase Realtime
3. **Message Send/Receive** - Facebook Graph API integration
4. **Basic Customer Info** - Name, phone, order count
5. **Quick Reply** - Saved responses
6. **In-chat Order** - Simple order creation

---

## 🔐 Security Considerations

- Page Access Token encryption
- Webhook signature verification
- Admin-only RLS policies
- Rate limiting on AI calls
- Audit logging for messages

---

## সারাংশ

এই blueprint অনুযায়ী একটি **বিশ্বমানের Messenger CRM** তৈরি করা সম্ভব। প্রতিটি phase আলাদাভাবে implement করা যাবে এবং ধাপে ধাপে features যোগ হবে।

**Approve করলে Phase 1 (Core Inbox) implementation শুরু করব।**
