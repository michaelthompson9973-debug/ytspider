
# Wildcard Subdomain System Implementation

## সমস্যা কি?

বর্তমানে প্রতিটা subdomain এর জন্য আপনাকে ৩ জায়গায় কাজ করতে হয়:

```text
Current Flow (প্রতি subdomain এ):
─────────────────────────────────────
1. DNS (Namecheap) → Add CNAME record
2. Vercel → Add domain  
3. Admin Panel → Add to allowed list
```

এটা সময়সাপেক্ষ এবং ঝামেলার!

---

## সমাধান: Wildcard Domain Setup

**Wildcard Domain** মানে হলো `*.example.com` - যেকোনো subdomain একটা single setup এ কাজ করবে।

```text
New Flow (একবার সেটাপ):
─────────────────────────────────────
1. DNS (Namecheap) → Add *.onegallerybd.com → CNAME to Vercel (একবার)
2. Vercel → Add *.onegallerybd.com (একবার)  
3. Admin Panel → Add any subdomain dynamically ✅
```

---

## Implementation Plan

### Part 1: Database Changes

`allowed_domains` table এ নতুন column যুক্ত করা হবে:

```sql
ALTER TABLE allowed_domains
ADD COLUMN is_wildcard boolean DEFAULT false,
ADD COLUMN parent_domain text;
```

**উদাহরণ ডাটা:**
| domain | is_wildcard | parent_domain |
|--------|-------------|---------------|
| *.onegallerybd.com | true | onegallerybd.com |
| shop.onegallerybd.com | false | onegallerybd.com |
| promo.onegallerybd.com | false | onegallerybd.com |

### Part 2: DomainGuard Logic Update

`DomainGuard.tsx` এ wildcard matching যুক্ত করা:

```typescript
// Current: Exact match only
.eq('domain', hostname)

// New: Check exact match OR wildcard match
const checkDomainAllowed = async (hostname: string) => {
  // Step 1: Check exact match
  const { data: exactMatch } = await supabase
    .from('allowed_domains')
    .select('id')
    .eq('domain', hostname)
    .eq('enabled', true)
    .maybeSingle();
  
  if (exactMatch) return true;
  
  // Step 2: Check wildcard match
  // hostname: shop.onegallerybd.com
  // wildcard: *.onegallerybd.com
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const parentDomain = parts.slice(1).join('.'); // onegallerybd.com
    const wildcardDomain = `*.${parentDomain}`;    // *.onegallerybd.com
    
    const { data: wildcardMatch } = await supabase
      .from('allowed_domains')
      .select('id')
      .eq('domain', wildcardDomain)
      .eq('enabled', true)
      .maybeSingle();
    
    return !!wildcardMatch;
  }
  
  return false;
};
```

### Part 3: Admin UI Updates

**AllowedDomains.tsx** এ নতুন features:

1. **Wildcard Toggle** - Domain add করার সময় wildcard option
2. **Subdomain Quick Add** - Wildcard domain এর under এ subdomain add করার shortcut
3. **Visual Indicator** - Wildcard domains আলাদা ভাবে দেখাবে

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Allowed Domains                                    [+ Add Domain]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🌐 *.onegallerybd.com                    [Wildcard] ✅ Enabled     │
│     └─ Any subdomain under this domain is automatically allowed    │
│                                                                     │
│  🌐 *.rahadrana.com                       [Wildcard] ✅ Enabled     │
│     └─ Any subdomain under this domain is automatically allowed    │
│                                                                     │
│  🌐 offers.onegallerybd.com               [Specific] ✅ Enabled     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Add Domain Dialog Update:**

```text
┌─────────────────────────────────────────────────┐
│  Add New Domain                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Domain:                                        │
│  [onegallerybd.com___________________________] │
│                                                 │
│  ☑️ Wildcard Mode                              │
│     Enable all subdomains (*.onegallerybd.com) │
│                                                 │
│  OR                                             │
│                                                 │
│  ☐ Specific Subdomain                          │
│  [shop.onegallerybd.com_____________________]  │
│                                                 │
│                          [Cancel] [Add Domain]  │
└─────────────────────────────────────────────────┘
```

---

## Manual Setup (Vercel + DNS - একবারই করতে হবে)

### Vercel এ Wildcard Domain Add:

1. Vercel Dashboard → Project → Settings → Domains
2. Add: `*.onegallerybd.com`
3. Vercel Wildcard SSL automatically handle করবে

### DNS (Namecheap) এ Wildcard Record:

```text
Type: CNAME
Host: *
Value: cname.vercel-dns.com
TTL: Automatic
```

**Note:** কিছু DNS providers (Namecheap সহ) wildcard CNAME support নাও করতে পারে। সেক্ষেত্রে:

```text
Type: A
Host: *
Value: 76.76.21.21
TTL: Automatic
```

---

## Files to Create/Edit

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | Add `is_wildcard` and `parent_domain` columns |
| `src/components/landing/DomainGuard.tsx` | Edit | Add wildcard matching logic + `.vercel.app` bypass |
| `src/pages/admin/AllowedDomains.tsx` | Edit | Add wildcard toggle, improved UI, Vercel guide |
| `src/integrations/supabase/types.ts` | Auto-update | Types will be regenerated |

---

## Code Changes Summary

### 1. DomainGuard.tsx

```typescript
// Add to BYPASS_PATTERNS
'.vercel.app',

// New matching logic
const checkDomainAllowed = async (hostname: string) => {
  // 1. Exact match
  const exactMatch = await checkExactDomain(hostname);
  if (exactMatch) return true;
  
  // 2. Wildcard match (*.parent.com)
  const wildcardMatch = await checkWildcardDomain(hostname);
  return wildcardMatch;
};
```

### 2. AllowedDomains.tsx

- Add wildcard checkbox in add dialog
- Show wildcard badge on wildcard domains
- Update setup guide with Vercel wildcard instructions
- Add "Quick add subdomain" for wildcard parents

### 3. Database Migration

```sql
-- Add wildcard support columns
ALTER TABLE allowed_domains
ADD COLUMN is_wildcard boolean DEFAULT false;

-- Add constraint: wildcard domains must start with *.
ALTER TABLE allowed_domains
ADD CONSTRAINT wildcard_format_check 
CHECK (
  (is_wildcard = false) OR 
  (is_wildcard = true AND domain LIKE '*.%')
);
```

---

## User Flow After Implementation

```text
প্রথমবার Setup (একবারই):
───────────────────────────
1. DNS: Add * record → 76.76.21.21 (Namecheap)
2. Vercel: Add *.onegallerybd.com
3. Admin Panel: Add *.onegallerybd.com (wildcard checked)

পরে যেকোনো subdomain এ:
───────────────────────────
1. Admin Panel: Add shop.onegallerybd.com
   → Automatically works! ✅

অথবা wildcard থাকলে:
───────────────────────────
1. Browser এ shop.onegallerybd.com যান
   → Wildcard *.onegallerybd.com match করবে
   → Automatically allowed! ✅
```

---

## Expected Results

Implementation এর পরে:

1. **একবার Wildcard সেটাপ করলে** - সব subdomain automatically কাজ করবে
2. **Admin Panel এ subdomain add করা optional** - শুধু tracking/control এর জন্য
3. **নতুন subdomain এ DNS/Vercel এ যেতে হবে না**
4. **.vercel.app domains automatically bypass** হবে

---

## Important Notes

⚠️ **Vercel Pro Plan Required**: Vercel এ wildcard domain শুধু Pro plan এ available। Free plan এ প্রতিটা subdomain আলাদা add করতে হবে।

**Alternative for Free Plan:**
- Main domains (example.com, www.example.com) Vercel এ add করুন
- Subdomains গুলো individually add করতে হবে Vercel এ
- কিন্তু Admin Panel এ wildcard logic থাকবে - তাই সব subdomains একসাথে allow হবে

