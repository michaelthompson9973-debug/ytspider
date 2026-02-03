
# Ytspider Multi-Shop Architecture - Master Plan

## Vision
Ytspider কে বিশ্বের সবচেয়ে উন্নত মাল্টি-টেন্যান্ট ল্যান্ডিং পেজ সার্ভিস প্ল্যাটফর্মে রূপান্তর করা, যেখানে একটি সিস্টেমে অসংখ্য স্বতন্ত্র শপ চালানো যাবে।

## Current State Analysis

**বর্তমান সিস্টেম:**
- Single-tenant architecture (একটি শপ = সম্পূর্ণ সিস্টেম)
- `user_roles` টেবিলে শুধু 'admin' role আছে
- সব ডেটা (products, orders, landing_pages) একই টেবিলে global ভাবে stored
- RLS policies `is_admin()` ফাংশন দিয়ে চেক করা হয়

**লক্ষ্য:**
- Multi-tenant architecture (অনেক শপ = একটি সিস্টেম)
- প্রতিটি শপ সম্পূর্ণ আলাদা (isolated data)
- Shop switching via dropdown
- Per-shop role-based access control

## Architecture Design

### Database Schema Changes

```text
┌──────────────────────────────────────────────────────────────┐
│                      NEW TABLES                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐                                         │
│  │     shops       │ ◄── Master shop table                   │
│  ├─────────────────┤                                         │
│  │ id              │                                         │
│  │ name            │ "chaldal", "EcomX v2 Pro"               │
│  │ slug            │ "chaldal", "ecomx-v2-pro"               │
│  │ logo_url        │                                         │
│  │ owner_id        │ ──► auth.users                          │
│  │ plan            │ free, pro, enterprise                   │
│  │ settings        │ jsonb (theme, currency, etc)            │
│  │ is_active       │                                         │
│  │ created_at      │                                         │
│  └─────────────────┘                                         │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────┐                                         │
│  │  shop_members   │ ◄── Who can access which shop           │
│  ├─────────────────┤                                         │
│  │ id              │                                         │
│  │ shop_id         │ ──► shops.id                            │
│  │ user_id         │ ──► auth.users                          │
│  │ role            │ owner, admin, editor, viewer            │
│  │ invited_by      │                                         │
│  │ invited_at      │                                         │
│  │ accepted_at     │                                         │
│  └─────────────────┘                                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Existing Tables - Add shop_id

```text
ALL existing tables will get a new column:

┌─────────────────────────────────────────────────────────────┐
│  products            + shop_id (FK → shops.id)              │
│  landing_pages       + shop_id (FK → shops.id)              │
│  orders              + shop_id (FK → shops.id)              │
│  media               + shop_id (FK → shops.id)              │
│  tracking_profiles   + shop_id (FK → shops.id)              │
│  allowed_domains     + shop_id (FK → shops.id)              │
│  api_keys            + shop_id (FK → shops.id)              │
│  webhooks            + shop_id (FK → shops.id)              │
│  courier_credentials + shop_id (FK → shops.id)              │
│  messenger_*         + shop_id (FK → shops.id)              │
│  component_library   + shop_id (nullable, global templates) │
│  ... all other tables                                       │
└─────────────────────────────────────────────────────────────┘
```

### New Role Enum

```sql
-- Extend app_role enum
ALTER TYPE app_role ADD VALUE 'shop_owner';
ALTER TYPE app_role ADD VALUE 'shop_admin';
ALTER TYPE app_role ADD VALUE 'shop_editor';
ALTER TYPE app_role ADD VALUE 'shop_viewer';
ALTER TYPE app_role ADD VALUE 'super_admin';  -- Platform admin
```

### RLS Policy Updates

```text
Current: is_admin() checks global admin status
New:     has_shop_access(shop_id, min_role) checks shop-specific access

Example for products table:
┌─────────────────────────────────────────────────────────────┐
│ BEFORE:                                                      │
│ POLICY "Admins can manage products" USING is_admin()        │
│                                                              │
│ AFTER:                                                       │
│ POLICY "Shop members can view products" FOR SELECT          │
│   USING has_shop_access(shop_id, 'viewer')                  │
│                                                              │
│ POLICY "Shop admins can manage products" FOR ALL            │
│   USING has_shop_access(shop_id, 'admin')                   │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Shop Context

```text
┌─────────────────────────────────────────────────────────────┐
│                    ShopContext                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  interface ShopContextType {                                 │
│    currentShop: Shop | null;                                │
│    availableShops: Shop[];                                  │
│    userRoleInCurrentShop: ShopRole;                         │
│    switchShop: (shopId: string) => void;                    │
│    isLoading: boolean;                                      │
│  }                                                          │
│                                                              │
│  - Stored in localStorage for persistence                   │
│  - Synced with URL: /admin/shop/:shopSlug/...              │
│  - All queries auto-filter by currentShop.id               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Shop Switcher Component (Top Bar)

```text
┌───────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ 🏪 chaldal ▼                    │ 🔔  👤                        │ │
│ │ ┌────────────────────────────┐  │                                │ │
│ │ │ ✓ chaldal           Owner  │  │                                │ │
│ │ │   EcomX v2 Pro      Admin  │  │                                │ │
│ │ │   My New Store      Editor │  │                                │ │
│ │ │ ─────────────────────────  │  │                                │ │
│ │ │ + নতুন শপ তৈরি করুন       │  │                                │ │
│ │ └────────────────────────────┘  │                                │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│ ┌───────────────────────────────────────────────────────────────┐    │
│ │ 📊 Dashboard                                                   │    │
│ │ 📦 Products                                                    │    │
│ │ 📄 Landing Pages                                               │    │
│ │ 🛒 Orders                                                      │    │
│ │ ...                                                            │    │
│ └───────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────┘
```

### URL Structure

```text
Current:
  /admin/products
  /admin/orders
  /admin/pages/manage

New (Option A - URL Based):
  /admin/shop/chaldal/products
  /admin/shop/chaldal/orders
  /admin/shop/ecomx-v2-pro/pages/manage

New (Option B - Context Based - Recommended):
  /admin/products        ← shop determined by ShopContext
  /admin/orders          ← cleaner URLs, less disruption
  /admin/pages/manage
```

## Data Flow

```text
User Login
    │
    ▼
┌──────────────────────┐
│ Fetch user's shops   │ ← shop_members WHERE user_id = auth.uid()
└──────────────────────┘
    │
    ▼
┌──────────────────────┐
│ Set active shop      │ ← First shop or last used (localStorage)
└──────────────────────┘
    │
    ▼
┌──────────────────────┐
│ ShopContext provides │
│ - currentShop.id     │
│ - userRole           │
└──────────────────────┘
    │
    ▼
┌──────────────────────┐
│ All queries filter   │ ← .eq('shop_id', currentShop.id)
│ by shop_id           │
└──────────────────────┘
```

## Database Functions

```sql
-- Check if user has access to a shop with minimum role
CREATE OR REPLACE FUNCTION has_shop_access(
  _shop_id uuid,
  _min_role text DEFAULT 'viewer'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role text;
  _role_hierarchy text[] := ARRAY['viewer', 'editor', 'admin', 'owner'];
  _min_index int;
  _user_index int;
BEGIN
  -- Get user's role in this shop
  SELECT role INTO _user_role
  FROM shop_members
  WHERE shop_id = _shop_id 
    AND user_id = auth.uid()
    AND accepted_at IS NOT NULL;
  
  IF _user_role IS NULL THEN
    -- Check if super_admin
    IF EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    ) THEN
      RETURN true;
    END IF;
    RETURN false;
  END IF;
  
  -- Compare role hierarchy
  _min_index := array_position(_role_hierarchy, _min_role);
  _user_index := array_position(_role_hierarchy, _user_role);
  
  RETURN _user_index >= _min_index;
END;
$$;

-- Get user's current shop (for queries)
CREATE OR REPLACE FUNCTION get_user_shops()
RETURNS SETOF shops
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.*
  FROM shops s
  INNER JOIN shop_members sm ON sm.shop_id = s.id
  WHERE sm.user_id = auth.uid()
    AND sm.accepted_at IS NOT NULL
    AND s.is_active = true
  ORDER BY s.name;
$$;
```

## Implementation Phases

### Phase 1: Database Foundation (Week 1-2)

| Task | Description |
|------|-------------|
| 1.1 | Create `shops` table |
| 1.2 | Create `shop_members` table |
| 1.3 | Update `app_role` enum |
| 1.4 | Create `has_shop_access()` function |
| 1.5 | Add `shop_id` column to all existing tables |
| 1.6 | Create default shop for existing data |
| 1.7 | Update RLS policies for all tables |

### Phase 2: Frontend Core (Week 3-4)

| Task | Description |
|------|-------------|
| 2.1 | Create `ShopContext` and `ShopProvider` |
| 2.2 | Build `ShopSwitcher` dropdown component |
| 2.3 | Integrate into `AdminLayout` header |
| 2.4 | Update `AuthContext` to load shops |
| 2.5 | Create `useCurrentShop()` hook |

### Phase 3: Query Updates (Week 5-6)

| Task | Description |
|------|-------------|
| 3.1 | Update all Supabase queries to filter by `shop_id` |
| 3.2 | Update all insert operations to include `shop_id` |
| 3.3 | Update edge functions to handle `shop_id` |
| 3.4 | Update realtime subscriptions with shop filter |

### Phase 4: Shop Management (Week 7-8)

| Task | Description |
|------|-------------|
| 4.1 | Create "New Shop" dialog/page |
| 4.2 | Build shop settings page |
| 4.3 | Implement team management (invite, roles) |
| 4.4 | Add shop invitation system (email) |
| 4.5 | Create shop deletion/archive flow |

### Phase 5: Polish & Testing (Week 9-10)

| Task | Description |
|------|-------------|
| 5.1 | End-to-end testing multi-shop isolation |
| 5.2 | Performance optimization |
| 5.3 | Data migration tools |
| 5.4 | Documentation |

## Key Components to Create

### ShopContext.tsx

```tsx
interface Shop {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  settings: Record<string, any>;
}

interface ShopContextType {
  currentShop: Shop | null;
  availableShops: Shop[];
  userRole: 'owner' | 'admin' | 'editor' | 'viewer' | null;
  switchShop: (shopId: string) => Promise<void>;
  isLoading: boolean;
  createShop: (name: string) => Promise<Shop>;
}
```

### ShopSwitcher.tsx (Header Component)

```tsx
// Dropdown in top bar showing:
// - Current shop name with logo
// - List of available shops with roles
// - "Create new shop" button
// - Search for shops (if many)
```

### useShopQuery Hook

```tsx
// Wrapper around useQuery that auto-adds shop_id filter
function useShopQuery<T>(
  key: string[],
  queryFn: (shopId: string) => Promise<T>,
  options?: QueryOptions
) {
  const { currentShop } = useShop();
  return useQuery({
    queryKey: [...key, currentShop?.id],
    queryFn: () => queryFn(currentShop!.id),
    enabled: !!currentShop,
    ...options
  });
}
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/contexts/ShopContext.tsx` | Shop state management |
| `src/components/admin/ShopSwitcher.tsx` | Dropdown component |
| `src/hooks/useShop.ts` | Shop access hook |
| `src/hooks/useShopQuery.ts` | Query wrapper with shop filter |
| `src/pages/admin/ShopSettings.tsx` | Shop configuration page |
| `src/pages/admin/TeamMembers.tsx` | Team management page |
| `src/components/admin/InviteTeamMemberModal.tsx` | Invitation dialog |
| `supabase/functions/invite-team-member/index.ts` | Email invitation |

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/AuthContext.tsx` | Add shop loading on auth |
| `src/components/admin/AdminLayout.tsx` | Add ShopSwitcher to header |
| `src/components/admin/AdminSidebar.tsx` | Show shop name/logo |
| All admin pages | Wrap queries with shop filter |
| All edge functions | Add shop_id handling |

## Security Considerations

1. **Data Isolation**: RLS policies ensure users can ONLY see their shop's data
2. **Role Hierarchy**: owner > admin > editor > viewer
3. **Super Admin**: Platform-level access (for Ytspider team)
4. **Invitation Flow**: Secure token-based team invitations
5. **Shop Deletion**: Soft delete with data retention policy

## Migration Strategy

```text
For Existing Users:
┌─────────────────────────────────────────────────────────────┐
│ 1. Create default shop "My Shop" for each existing admin   │
│ 2. Migrate all their data to this shop (set shop_id)       │
│ 3. Set them as 'owner' in shop_members                     │
│ 4. First login shows "Welcome to Multi-Shop" modal         │
└─────────────────────────────────────────────────────────────┘
```

## Summary

| Feature | Description |
|---------|-------------|
| **Multi-Shop** | অসংখ্য শপ তৈরি ও ম্যানেজ করা যাবে |
| **Shop Switching** | Top bar dropdown দিয়ে সহজে switch |
| **Team Access** | প্রতিটি শপে আলাদা টিম মেম্বার |
| **Role-Based** | Owner, Admin, Editor, Viewer roles |
| **Data Isolation** | প্রতিটি শপের ডেটা সম্পূর্ণ আলাদা |
| **Scalable** | Enterprise-grade multi-tenant architecture |

এটি একটি বড় architectural পরিবর্তন যা প্রায় ৮-১০ সপ্তাহ সময় নিতে পারে সম্পূর্ণ implementation এর জন্য। আপনি চাইলে Phase-by-phase শুরু করতে পারেন।
