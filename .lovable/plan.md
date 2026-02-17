

# Shop Area Security Fix — Admin দের সব শপ দেখা বন্ধ করা

## সমস্যা

`/shop` এরিয়ায় Admin ইউজাররা সব শপ দেখতে পায় কারণ:
1. `ShopContext.tsx`-এ `isAdmin` হলে কোনো ফিল্টার ছাড়াই `shops` টেবিল থেকে সব ডাটা আনে
2. RLS policy-তেও `is_admin()` হলে সব শপ দেখানো হয়
3. `/shop` এরিয়া Shop Owner-দের জন্য — এখানে Admin-দের সব শপ দেখার দরকার নেই

## সমাধান

`ShopContext.tsx`-এ `fetchShops` ফাংশনটা পরিবর্তন করা হবে যাতে `/shop` এরিয়ায় শুধু ইউজারের **নিজের শপ** দেখায় — Admin হোক বা না হোক।

### পরিবর্তন:

| ফাইল | কী হবে |
|------|--------|
| `src/contexts/ShopContext.tsx` | `fetchShops()` ফাংশনে security definer function `get_user_shops()` ব্যবহার করা হবে — যেটা শুধু `shop_members` টেবিল থেকে ইউজারের নিজের শপগুলো আনবে। Admin-দের জন্যও একই নিয়ম। |

### টেকনিক্যাল ডিটেইল:

Database-এ ইতোমধ্যে `get_user_shops()` নামে একটি security definer function আছে যেটা শুধু `shop_members` টেবিল থেকে ইউজারের শপগুলো আনে:

```text
get_user_shops():
  SELECT s.* FROM shops s
  INNER JOIN shop_members sm ON sm.shop_id = s.id
  WHERE sm.user_id = auth.uid()
    AND sm.accepted_at IS NOT NULL
    AND s.is_active = true
```

**পরিবর্তন:**

`ShopContext.tsx`-এর `fetchShops` ফাংশনে:

```text
আগে:
  let query = supabase.from('shops').select('*');
  if (!isAdmin) {
    query = query.eq('is_active', true);
  }

পরে:
  const { data: shops } = await supabase.rpc('get_user_shops');
```

এতে:
- Admin হোক বা Shop Owner — সবাই শুধু নিজেদের শপ দেখবে
- Platform Admin area (`/admin`) এ All Shops পেজ আলাদাভাবে সব শপ দেখাবে (সেটা ঠিকই আছে)
- কোনো RLS পরিবর্তন লাগবে না
- কোনো নতুন database function লাগবে না — existing `get_user_shops()` ব্যবহার হবে

