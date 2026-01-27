
# Multi-Domain Allowlist System Implementation

## Overview

এই প্ল্যানে আমরা একটি **Domain Allowlist System** implement করবো যেখানে:
- Multiple domains/subdomains একই app এ point করতে পারবে
- শুধুমাত্র **approved domains** এ landing pages দেখাবে
- Slug-based routing আগের মতোই কাজ করবে
- Domain-to-landing-page mapping হবে **না** (Option 1 অনুযায়ী)

---

## Database Changes

### New Table: `allowed_domains`

বর্তমান `domain_mappings` টেবিল **ভুল design** - এটা domain-to-landing-page mapping করে যা আমাদের দরকার নেই।

নতুন টেবিল create করতে হবে:

```sql
CREATE TABLE public.allowed_domains (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    domain text NOT NULL UNIQUE,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_allowed_domains_domain ON public.allowed_domains(domain);
CREATE INDEX idx_allowed_domains_enabled ON public.allowed_domains(enabled);

ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;

-- Admin full CRUD
CREATE POLICY "Admins can manage allowed_domains"
    ON public.allowed_domains FOR ALL
    USING (public.is_admin());

-- Public can read enabled domains only
CREATE POLICY "Public can view enabled domains"
    ON public.allowed_domains FOR SELECT
    USING (enabled = true);
```

---

## File Changes

### 1. New Admin Page: `src/pages/admin/AllowedDomains.tsx`

```text
Purpose: Admin UI for managing allowed domains

Features:
- List all domains with enable/disable toggle
- Add new domain button
- Delete domain option
- Domain validation (proper format)
- Status badge (enabled/disabled)
```

UI Layout:
```text
┌──────────────────────────────────────────────────┐
│ Allowed Domains                    [+ Add Domain]│
│ Control which domains can serve landing pages    │
├──────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┐ │
│ │ brand1.com         ● Enabled    [Toggle][🗑] │ │
│ ├──────────────────────────────────────────────┤ │
│ │ offer.site.com     ● Enabled    [Toggle][🗑] │ │
│ ├──────────────────────────────────────────────┤ │
│ │ test.example.com   ○ Disabled   [Toggle][🗑] │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 2. Update Router: `src/App.tsx`

- Replace existing `/admin/domains` route with new `AllowedDomains` component
- Remove old `Domains.tsx` reference

### 3. Update Sidebar: `src/components/admin/AdminSidebar.tsx`

- Change "Domains" link to point to updated page
- Update label to "Allowed Domains" or keep as "Domains"

### 4. Domain Guard Component: `src/components/landing/DomainGuard.tsx`

```text
Purpose: Check if current domain is allowed before showing landing page

Logic:
1. Get hostname: window.location.hostname
2. Query: SELECT * FROM allowed_domains WHERE domain = hostname AND enabled = true
3. If NOT found → Show "Domain Not Authorized" page
4. If found → Render children (landing page)
```

### 5. Update Landing Page: `src/pages/LandingPage.tsx`

- Wrap content with `DomainGuard` component
- Handle loading state during domain check
- Optional: Add bypass for preview mode or localhost

### 6. Domain Not Authorized Page: `src/components/landing/DomainNotAuthorized.tsx`

```text
Shows when domain is not in allowlist:
- "Domain Not Authorized" message
- Explains that this domain is not configured
- Optional: Redirect to primary domain
```

### 7. Delete Old File: `src/pages/admin/Domains.tsx`

- Remove the old domain_mappings based implementation

### 8. Update README.md

Add section explaining:
- How to configure nginx proxy
- DNS requirements
- How to add domains to allowlist

---

## Implementation Flow

```text
User visits: brand1.com/sale
                │
                ▼
┌─────────────────────────────────┐
│ DomainGuard checks hostname     │
│ Query: allowed_domains table    │
└─────────────────────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
   [Found &         [Not Found]
    Enabled]             │
        │                ▼
        │        ┌──────────────────┐
        │        │ DomainNotAuthorized│
        │        │ "Domain not allowed"│
        │        └──────────────────┘
        ▼
┌─────────────────────────────────┐
│ Normal slug-based routing       │
│ /sale → landing_pages.slug=sale │
└─────────────────────────────────┘
```

---

## Root Path Behavior

If user visits `brand1.com/` (no slug):

Option A: Show 404 "Page Not Found"
Option B: Redirect to ENV variable `VITE_DEFAULT_HOME_SLUG`

Implementation: Check if slug is empty, redirect to default if configured.

---

## Technical Details

### Domain Validation Regex
```typescript
const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;
```

### Localhost/Preview Bypass
```typescript
const bypassDomains = [
  'localhost',
  '127.0.0.1',
  '.lovable.app',
  '.lovableproject.com'
];

const shouldBypass = bypassDomains.some(d => hostname.includes(d) || hostname === d);
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/admin/AllowedDomains.tsx` | Create | New admin UI for domain allowlist |
| `src/pages/admin/Domains.tsx` | Delete | Remove old domain_mappings based page |
| `src/components/landing/DomainGuard.tsx` | Create | Domain check wrapper component |
| `src/components/landing/DomainNotAuthorized.tsx` | Create | Error page for blocked domains |
| `src/pages/LandingPage.tsx` | Edit | Wrap with DomainGuard |
| `src/App.tsx` | Edit | Update route imports |
| `README.md` | Edit | Add DNS/proxy documentation |

---

## Migration SQL Summary

```sql
-- Drop old table if exists (domain_mappings is broken anyway)
DROP TABLE IF EXISTS public.domain_mappings CASCADE;

-- Create new allowlist table
CREATE TABLE public.allowed_domains (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    domain text NOT NULL UNIQUE,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage allowed_domains"
    ON public.allowed_domains FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can view enabled domains"
    ON public.allowed_domains FOR SELECT
    USING (enabled = true);
```

---

## Nginx Configuration (For README)

```nginx
server {
    listen 80;
    server_name brand1.com offer.site.com *.myapp.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Acceptance Criteria Checklist

- [ ] New `allowed_domains` table created with RLS
- [ ] Admin can add/enable/disable/delete domains
- [ ] Disabled domains show "Not Authorized" page
- [ ] Enabled domains serve all slug paths
- [ ] Slug routing unchanged
- [ ] Localhost/preview domains bypass check
- [ ] No TypeScript errors
- [ ] README updated with setup instructions
