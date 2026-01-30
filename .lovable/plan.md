

# API Dropdown এ "Messaging" Menu Item যোগ করা

## Overview

API dropdown menu তে নতুন "Messaging" sub-item যোগ করা হবে যেখানে Messenger এবং WhatsApp এর API credentials manage করা যাবে।

---

## Current Structure

```text
Settings
├── Allowed Domains
├── Webhooks
└── API ▼
    ├── AI ✓
    ├── Fraud Check ✓
    └── Courier (N/A)
```

## New Structure

```text
Settings
├── Allowed Domains
├── Webhooks
└── API ▼
    ├── AI ✓
    ├── Fraud Check ✓
    ├── Courier (N/A)
    └── Messaging ▼
        ├── Messenger
        └── WhatsApp
```

---

## Implementation

### Step 1: Update AdminSidebar.tsx

API dropdown এ নতুন Messaging item যোগ করা হবে:

```typescript
{
  href: '/admin/api',
  label: 'API',
  icon: Key,
  children: [
    { href: '/admin/api/ai', label: 'AI', icon: Bot, badge: 'available' },
    { href: '/admin/api/fraud-check', label: 'Fraud Check', icon: ShieldAlert, badge: 'available' },
    { href: '/admin/api/courier', label: 'Courier', icon: Truck, badge: 'N/A' },
    { href: '/admin/api/messaging/messenger', label: 'Messenger', icon: MessageCircle },
    { href: '/admin/api/messaging/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  ]
}
```

**Note:** Single-level dropdown রাখা হবে কারণ nested dropdown (dropdown এর ভিতরে dropdown) complex হয়ে যাবে। তাই Messenger এবং WhatsApp সরাসরি API dropdown এ থাকবে।

### Step 2: Create New Pages

দুটি নতুন page তৈরি করা হবে:

| File | Route | Purpose |
|------|-------|---------|
| `src/pages/admin/ApiMessenger.tsx` | `/admin/api/messaging/messenger` | Messenger API credentials (App ID, App Secret) |
| `src/pages/admin/ApiWhatsapp.tsx` | `/admin/api/messaging/whatsapp` | WhatsApp Business API credentials |

### Step 3: Update App.tsx Routes

নতুন routes register করা হবে:

```typescript
<Route path="/admin/api/messaging/messenger" element={<ProtectedRoute requireAdmin><ApiMessenger /></ProtectedRoute>} />
<Route path="/admin/api/messaging/whatsapp" element={<ProtectedRoute requireAdmin><ApiWhatsapp /></ProtectedRoute>} />
```

---

## ApiMessenger Page এ যা থাকবে

Messenger API settings page এ:

1. **Facebook App ID Input** - Text input for Meta App ID
2. **Facebook App Secret Input** - Password input for App Secret
3. **Save Button** - Credentials save করার জন্য
4. **Connection Status** - API connected কিনা দেখাবে
5. **Setup Guide** - Meta Developer Console এ কিভাবে App তৈরি করতে হয় তার instructions

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/components/admin/AdminSidebar.tsx` | Add Messenger & WhatsApp to API dropdown |
| Create | `src/pages/admin/ApiMessenger.tsx` | Messenger API credentials page |
| Create | `src/pages/admin/ApiWhatsapp.tsx` | WhatsApp API credentials page |
| Modify | `src/App.tsx` | Add new routes |

---

## Technical Notes

- Icons ইতিমধ্যে imported আছে (`MessageCircle`, `MessageSquare`)
- Messenger এবং WhatsApp এর credentials আলাদা tables এ store হবে অথবা existing `messenger_connections` table এ `app_id` field আছে সেটা ব্যবহার করা যাবে
- InboxMessenger page এ শুধু Chat UI থাকবে, credentials manage করার জন্য admin ApiMessenger page এ redirect করা হবে

