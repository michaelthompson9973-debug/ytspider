

# কোডবেজ স্ক্যান রিপোর্ট ও সমস্যা সমাধান

## আবিষ্কৃত সমস্যাসমূহ

### ১. Critical Error: `useShop must be used within a ShopProvider`

**সমস্যা:** 
`AcceptInvite.tsx` পেজে `useShopInvitations` hook ব্যবহার করা হচ্ছে, যা internally `useShop()` কল করে। কিন্তু `AcceptInvite` পেজ `ShopProvider` এর বাইরে বা সঠিক context-এ নেই।

**বিস্তারিত:**
- `useShopInvitations.ts` (line 27): `const { currentShop } = useShop();`
- `AcceptInvite.tsx` (line 14): `const { getInvitationByToken, acceptInvitation, isAccepting } = useShopInvitations();`

**লক্ষণ:**
```
Error: useShop must be used within a ShopProvider
at useShop (ShopContext.tsx:265:15)
at AdminSidebar (AdminSidebar.tsx:779:29)
```

**সমাধান:**
`useShopInvitations` hook থেকে `getInvitationByToken` এবং `acceptInvitation` ফাংশনগুলো আলাদা করতে হবে যাতে এগুলো `ShopProvider` ছাড়াই কাজ করে।

---

### ২. Provider Order সমস্যা (App.tsx)

**বর্তমান অর্ডার:**
```tsx
<AdminThemeProvider>
  <QueryClientProvider>
    <AuthProvider>
      <ShopProvider>
        ...
      </ShopProvider>
    </AuthProvider>
  </QueryClientProvider>
</AdminThemeProvider>
```

**সমস্যা:**
`AdminThemeProvider` সবার বাইরে আছে, কিন্তু এটি `ShopProvider` এর ভিতরে থাকা উচিত যদি শপ-স্পেসিফিক থিম চাই।

---

### ৩. AcceptInvite পেজে ShopContext নির্ভরতা

**সমস্যা:**
`/accept-invite` পেজ পাবলিক পেজ হওয়া উচিত (লগইন ছাড়াই দেখা যাবে), কিন্তু `useShopInvitations` hook `useShop()` ব্যবহার করছে।

**সমাধান:**
`getInvitationByToken` এবং `acceptInvitation` এর জন্য আলাদা utility functions তৈরি করতে হবে যা ShopContext ছাড়াই কাজ করবে।

---

### ৪. shop_members টেবিলে ইউজার ইমেইল নেই

**সমস্যা:**
`TeamMembers.tsx` এ মেম্বারদের শুধু `user_id` দেখানো হচ্ছে (line 369-371):
```tsx
<p className="font-medium text-sm">
  User {member.user_id.substring(0, 8)}...
</p>
```

**সমাধান:**
`auth.users` থেকে ইমেইল fetch করা দরকার, অথবা `profiles` টেবিল তৈরি করে সেখান থেকে নিতে হবে।

---

### ৫. useShopTheme hook এ শপ থিম সিস্টেম অসম্পূর্ণ

**সমস্যা:**
`useShopTheme.ts` তৈরি হয়েছে কিন্তু এটি Settings পেজে ব্যবহার করা হচ্ছে না। Settings পেজ এখনও user-level থিম ব্যবহার করছে।

---

### ৬. useShopPermissions hook শুধু frontend এ কাজ করছে

**সমস্যা:**
Permission checks শুধু frontend-এ হচ্ছে। Backend (RLS) এ `has_shop_access` function আছে কিন্তু granular permissions নেই।

---

## সমাধান পরিকল্পনা

### পদক্ষেপ ১: AcceptInvite এর জন্য ShopContext-মুক্ত ফাংশন তৈরি

```typescript
// src/lib/invitationUtils.ts (নতুন ফাইল)
export async function getInvitationByToken(token: string) {
  const { data, error } = await supabase
    .from('shop_invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function acceptInvitation(token: string, userId: string) {
  // ... implementation without ShopContext
}
```

### পদক্ষেপ ২: AcceptInvite.tsx আপডেট

```typescript
// আগে
import { useShopInvitations } from '@/hooks/useShopInvitations';
const { getInvitationByToken, acceptInvitation } = useShopInvitations();

// পরে
import { getInvitationByToken, acceptInvitation } from '@/lib/invitationUtils';
```

### পদক্ষেপ ৩: useShopInvitations hook ঠিক করা

শুধুমাত্র shop-specific operations এর জন্য `currentShop` ব্যবহার করবে:
- `invitations` query - shop context দরকার
- `createInvitation` - shop context দরকার
- `cancelInvitation` - shop context দরকার
- `getInvitationByToken` - shop context দরকার নেই
- `acceptInvitation` - shop context দরকার নেই

### পদক্ষেপ ৪: Profiles টেবিল তৈরি

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger to auto-create profile on signup
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### পদক্ষেপ ৫: Settings পেজে শপ থিম vs ইউজার থিম

দুইটা অপশন রাখা হবে:
1. **ইউজার থিম** - ব্যক্তিগত preference (বর্তমান সিস্টেম)
2. **শপ থিম** - শপ-স্পেসিফিক (নতুন সিস্টেম, admin only)

---

## ফাইল পরিবর্তন তালিকা

### নতুন ফাইল:
- `src/lib/invitationUtils.ts` - ShopContext-মুক্ত ইনভাইট ফাংশন

### আপডেট করা ফাইল:
1. `src/pages/AcceptInvite.tsx` - নতুন utility ব্যবহার
2. `src/hooks/useShopInvitations.ts` - refactor
3. `src/pages/admin/TeamMembers.tsx` - profiles টেবিল থেকে ইমেইল দেখানো

### ডাটাবেজ মাইগ্রেশন:
1. `profiles` টেবিল তৈরি
2. Trigger ফাংশন তৈরি

---

## অতিরিক্ত সমস্যাসমূহ (পরে ঠিক করার জন্য)

1. **শপ থিম vs ইউজার থিম আলাদা করা** - Settings পেজে পরিষ্কার distinction দরকার
2. **Granular RLS Policies** - Permission-based RLS এখনও নেই
3. **Email Sending** - ইনভাইট ইমেইল পাঠানোর Edge Function নেই
4. **Activity Log UI** - ShopAuditLog পেজে ফিল্টারিং এবং পেজিনেশন দরকার
5. **Real-time Updates** - shop_members টেবিলে realtime enable করা দরকার

