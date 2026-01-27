
# Subdomain Quick Setup Helper Implementation

## Overview

Vercel Free Plan users দের জন্য একটি **Subdomain Quick Setup Helper** যুক্ত করা হবে যা subdomain add করার সময় automatically প্রয়োজনীয় Vercel CLI command এবং DNS record copy করার সুবিধা দেবে।

---

## Features

### 1. Quick Setup Helper Dialog
নতুন subdomain add করার পর একটি helper modal দেখাবে যেখানে:
- Auto-generated Vercel CLI command
- DNS record (A Record / CNAME) copy করার option
- Step-by-step checklist

### 2. Domain Row Enhancement
প্রতিটা domain row তে "Setup" button যুক্ত হবে যা helper dialog open করবে।

### 3. Bulk Subdomain Quick Add
Wildcard domain এর under এ দ্রুত নতুন subdomain add করার shortcut।

---

## UI Design

### Quick Setup Helper Dialog

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ⚡ Quick Setup: shop.onegallerybd.com                      [X]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ✅ Step 1: Admin Panel এ Domain Added                              │
│                                                                     │
│  □ Step 2: Vercel এ Domain Add করুন                                │
│    ┌─────────────────────────────────────────────────────────────┐ │
│    │  vercel domains add shop.onegallerybd.com           [Copy] │ │
│    └─────────────────────────────────────────────────────────────┘ │
│    অথবা Vercel Dashboard → Settings → Domains → Add               │
│                                                                     │
│  □ Step 3: DNS Record সেট করুন                                     │
│    ┌─────────────────────────────────────────────────────────────┐ │
│    │  Type: CNAME | Host: shop | Value: cname.vercel-dns.com    │ │
│    │                                               [Copy All]   │ │
│    └─────────────────────────────────────────────────────────────┘ │
│    অথবা A Record:                                                   │
│    ┌─────────────────────────────────────────────────────────────┐ │
│    │  Type: A | Host: shop | Value: 76.76.21.21          [Copy] │ │
│    └─────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  □ Step 4: DNS Propagation Check করুন                              │
│    [🔗 DNSChecker.org]  [🔗 whatsmydns.net]                        │
│                                                                     │
│  ───────────────────────────────────────────────────────────────── │
│  📋 Terminal Commands (copy all):                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  # Vercel CLI                                               │  │
│  │  vercel domains add shop.onegallerybd.com                   │  │
│  │                                                             │  │
│  │  # DNS Verify                                               │  │
│  │  nslookup shop.onegallerybd.com                             │  │
│  │  dig shop.onegallerybd.com +short                           │  │
│  │                                                     [Copy]  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│                                              [Close] [Check Now]   │
└─────────────────────────────────────────────────────────────────────┘
```

### Domain Row with Setup Button

```text
┌─────────────────────────────────────────────────────────────────────┐
│  🌐 shop.onegallerybd.com                                           │
│     Added 2 days ago                                                │
│                          [Setup] [Check] [Visit] ✅ Enabled [🗑️]   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### File Changes: `src/pages/admin/AllowedDomains.tsx`

#### 1. New State Variables

```typescript
const [setupHelperOpen, setSetupHelperOpen] = useState(false);
const [selectedDomainForSetup, setSelectedDomainForSetup] = useState<string | null>(null);
```

#### 2. Helper Functions

```typescript
// Extract subdomain and parent from full domain
const parseDomain = (domain: string) => {
  const parts = domain.split('.');
  if (parts.length > 2) {
    const subdomain = parts[0];
    const parent = parts.slice(1).join('.');
    return { subdomain, parent, isSubdomain: true };
  }
  return { subdomain: null, parent: domain, isSubdomain: false };
};

// Generate Vercel CLI command
const getVercelCommand = (domain: string) => `vercel domains add ${domain}`;

// Generate DNS records based on domain type
const getDnsRecords = (domain: string) => {
  const { subdomain, parent, isSubdomain } = parseDomain(domain);
  
  if (isSubdomain) {
    return {
      cname: { type: 'CNAME', host: subdomain, value: 'cname.vercel-dns.com' },
      aRecord: { type: 'A', host: subdomain, value: '76.76.21.21' }
    };
  }
  return {
    aRecord: { type: 'A', host: '@', value: '76.76.21.21' },
    cname: { type: 'CNAME', host: 'www', value: 'cname.vercel-dns.com' }
  };
};

// Generate terminal commands for verification
const getTerminalCommands = (domain: string) => `# Vercel CLI
vercel domains add ${domain}

# DNS Verify
nslookup ${domain}
dig ${domain} +short`;
```

#### 3. New Component: SubdomainSetupHelper

```typescript
function SubdomainSetupHelper({ 
  domain, 
  open, 
  onOpenChange,
  onCheck 
}: { 
  domain: string; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onCheck: (domain: string) => void;
}) {
  const { toast } = useToast();
  const { subdomain, parent, isSubdomain } = parseDomain(domain);
  
  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label || 'Copied'} to clipboard!` });
  };

  // ... render helper dialog with steps
}
```

#### 4. DomainRow Enhancement

Add "Setup" button to each domain row:

```typescript
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    setSelectedDomainForSetup(domain.domain);
    setSetupHelperOpen(true);
  }}
  className="gap-1.5"
>
  <Zap className="h-3.5 w-3.5" />
  <span className="hidden sm:inline">Setup</span>
</Button>
```

#### 5. Auto-Show Helper After Add

Modify `addMutation.onSuccess`:

```typescript
onSuccess: (_, variables) => {
  queryClient.invalidateQueries({ queryKey: ['allowed-domains'] });
  setDialogOpen(false);
  
  // Auto-show setup helper for non-wildcard domains
  if (!variables.isWildcard) {
    const finalDomain = variables.domain.toLowerCase();
    setSelectedDomainForSetup(finalDomain);
    setSetupHelperOpen(true);
  }
  
  setNewDomain('');
  setIsWildcard(false);
  toast({ title: 'Domain added successfully' });
}
```

---

## New Components Summary

| Component | Purpose |
|-----------|---------|
| `SubdomainSetupHelper` | Modal dialog with copy-able Vercel CLI commands, DNS records |
| `DnsRecordCard` | Reusable component for displaying DNS record with copy button |
| `TerminalCommandBlock` | Multi-line command block with copy functionality |

---

## User Flow

```text
User adds subdomain "shop.onegallerybd.com"
         ↓
Domain saved to database
         ↓
Setup Helper Dialog automatically opens
         ↓
User sees:
  - Vercel CLI command (copy)
  - DNS CNAME/A record (copy)
  - Terminal commands (copy all)
         ↓
User runs commands in terminal
         ↓
User clicks "Check Now" to verify
         ↓
Success → Domain ready!
```

---

## Benefits

1. **Zero manual typing** - সব command copy করা যাবে
2. **Step-by-step guidance** - কোন step এ আছেন বুঝতে পারবেন
3. **Quick verification** - এক click এ DNS check
4. **Terminal-friendly** - সব commands একসাথে copy করা যাবে
5. **Auto-popup** - নতুন domain add করলে automatically দেখাবে

---

## Files to Edit

| File | Changes |
|------|---------|
| `src/pages/admin/AllowedDomains.tsx` | Add SubdomainSetupHelper component, new states, DomainRow enhancement |

---

## New Icons Used

```typescript
import { Zap, Terminal, ExternalLink, CheckSquare, Square } from 'lucide-react';
```
