

# Inbox মেনু যোগ করা (Dropdown সহ Messenger ও WhatsApp)

## Overview
Admin sidebar এর **Operations** group এ নতুন "Inbox" মেনু যোগ করা হবে। এটা dropdown হবে যেখানে Messenger ও WhatsApp sub-items থাকবে।

---

## Implementation

### Step 1: Add Lucide Icons
AdminSidebar.tsx এ নতুন icons import করতে হবে:
- `Inbox` - main menu icon
- `MessageCircle` - Messenger এর জন্য
- `Phone` বা `MessageSquare` - WhatsApp এর জন্য (Lucide-তে dedicated WhatsApp icon নেই)

### Step 2: Update navGroups Array
Operations group এ Inbox menu item যোগ করা হবে children সহ:

```typescript
{
  label: 'Operations',
  items: [
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/tracking', label: 'Tracking', icon: Activity },
    { 
      href: '/admin/inbox', 
      label: 'Inbox', 
      icon: Inbox,
      children: [
        { href: '/admin/inbox/messenger', label: 'Messenger', icon: MessageCircle },
        { href: '/admin/inbox/whatsapp', label: 'WhatsApp', icon: MessageSquare },
      ]
    },
  ],
},
```

### Step 3: Rename ApiSubMenu to GenericSubMenu
বর্তমান `ApiSubMenu` component টা শুধু API এর জন্য না, সব dropdown menu এর জন্য কাজ করে। তাই এটাকে `GenericSubMenu` নাম দিলে ভালো হবে (optional - functionality same থাকবে)।

### Step 4: Create Placeholder Pages
নতুন routes এর জন্য placeholder pages তৈরি করতে হবে:
- `/admin/inbox/messenger` → `src/pages/admin/InboxMessenger.tsx`
- `/admin/inbox/whatsapp` → `src/pages/admin/InboxWhatsapp.tsx`

### Step 5: Update App.tsx Routes
নতুন routes register করতে হবে:
```typescript
<Route path="/admin/inbox" element={<Navigate to="/admin/inbox/messenger" replace />} />
<Route path="/admin/inbox/messenger" element={<ProtectedRoute requireAdmin><InboxMessenger /></ProtectedRoute>} />
<Route path="/admin/inbox/whatsapp" element={<ProtectedRoute requireAdmin><InboxWhatsapp /></ProtectedRoute>} />
```

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/components/admin/AdminSidebar.tsx` | Add Inbox menu with children |
| Create | `src/pages/admin/InboxMessenger.tsx` | Messenger inbox page |
| Create | `src/pages/admin/InboxWhatsapp.tsx` | WhatsApp inbox page |
| Modify | `src/App.tsx` | Add new routes |

---

## UI Preview

```text
Operations
├── Orders
├── Tracking
└── Inbox ▼
    ├── Messenger
    └── WhatsApp
```

---

## Technical Notes

- বিদ্যমান `ApiSubMenu` component reuse করা হবে - এটা যেকোনো dropdown menu handle করতে পারে
- Collapsed sidebar এ tooltip এ sub-items দেখাবে
- Active route হলে parent menu automatically expanded থাকবে

