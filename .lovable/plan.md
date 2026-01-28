
# API Sub-menu + নতুন Pages - Implementation Plan

## Overview

Sidebar এ "API" item এর বদলে একটা collapsible dropdown menu তৈরি করা হবে যেখানে তিনটা sub-item থাকবে:
- **AI** (বর্তমান `/admin/api` page - rename করে `/admin/api/ai`)
- **Fraud Check** (নতুন page - `/admin/api/fraud-check`)
- **Courier** (নতুন page - `/admin/api/courier`)

---

## বর্তমান Structure

```
Settings
├── Allowed Domains
├── Webhooks
└── API (single page)
```

## নতুন Structure

```
Settings
├── Allowed Domains
├── Webhooks
└── API (dropdown)
    ├── AI
    ├── Fraud Check
    └── Courier
```

---

## Implementation Steps

### Step 1: নতুন Pages তৈরি করা

| File | Description |
|------|-------------|
| `src/pages/admin/ApiFraudCheck.tsx` | Fraud Check API settings page (placeholder) |
| `src/pages/admin/ApiCourier.tsx` | Courier API settings page (placeholder) |

প্রতিটি page এ "Coming Soon" বা configuration options থাকবে।

### Step 2: Current ApiSettings.tsx Rename

`ApiSettings.tsx` কে rename করা হবে `ApiAi.tsx` এ এবং route change হবে `/admin/api/ai`।

### Step 3: Sidebar Structure Update

`AdminSidebar.tsx` এ API item কে nested dropdown এ convert করা হবে:

```typescript
// New interface for nested items
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;          // "available" বা "N/A"
  children?: NavItem[];    // Nested items for dropdown
}

// Updated Settings group
{
  label: 'Settings',
  items: [
    { href: '/admin/domains', label: 'Allowed Domains', icon: Globe },
    { href: '/admin/webhooks', label: 'Webhooks', icon: Bell },
    { 
      href: '/admin/api', 
      label: 'API', 
      icon: Key,
      children: [
        { href: '/admin/api/ai', label: 'AI', badge: 'available' },
        { href: '/admin/api/fraud-check', label: 'Fraud Check', badge: 'N/A' },
        { href: '/admin/api/courier', label: 'Courier', badge: 'N/A' },
      ]
    },
  ],
}
```

### Step 4: Routes Update

`App.tsx` এ নতুন routes add করা হবে:

```typescript
// Existing route rename
<Route path="/admin/api/ai" element={<ProtectedRoute requireAdmin><ApiAi /></ProtectedRoute>} />

// New routes
<Route path="/admin/api/fraud-check" element={<ProtectedRoute requireAdmin><ApiFraudCheck /></ProtectedRoute>} />
<Route path="/admin/api/courier" element={<ProtectedRoute requireAdmin><ApiCourier /></ProtectedRoute>} />

// Redirect for old URL
<Route path="/admin/api" element={<Navigate to="/admin/api/ai" replace />} />
```

---

## Files to Create/Edit

| File | Action | Description |
|------|--------|-------------|
| `src/pages/admin/ApiAi.tsx` | Create | Rename current ApiSettings to ApiAi |
| `src/pages/admin/ApiFraudCheck.tsx` | Create | New Fraud Check API page |
| `src/pages/admin/ApiCourier.tsx` | Create | New Courier API page |
| `src/components/admin/AdminSidebar.tsx` | Edit | Add nested dropdown for API menu |
| `src/App.tsx` | Edit | Update routes |

---

## New Pages Preview

### Fraud Check Page (`ApiFraudCheck.tsx`)

```
┌────────────────────────────────────────┐
│ Fraud Check API                        │
│ Configure fraud detection services     │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ 🚧 Coming Soon                     │ │
│ │                                    │ │
│ │ Fraud check API integration will   │ │
│ │ be available in a future update.   │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### Courier Page (`ApiCourier.tsx`)

```
┌────────────────────────────────────────┐
│ Courier API                            │
│ Configure courier/shipping services    │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ 🚧 Coming Soon                     │ │
│ │                                    │ │
│ │ Courier API integration will       │ │
│ │ be available in a future update.   │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

---

## Sidebar Dropdown Design

Expanded state:
```
Settings
├── Allowed Domains
├── Webhooks
└── ▼ API
    ├── AI          [available]
    ├── Fraud Check [N/A]
    └── Courier     [N/A]
```

Collapsed sidebar এ শুধু Key icon দেখাবে, hover এ sub-menu tooltip আসবে।

---

## Technical Notes

1. **Badge Component**: "available" badge green, "N/A" badge gray/muted color এ দেখাবে
2. **Active State**: Any `/admin/api/*` route এ API dropdown open থাকবে
3. **Backward Compatibility**: `/admin/api` URL এ গেলে auto redirect হবে `/admin/api/ai` তে
