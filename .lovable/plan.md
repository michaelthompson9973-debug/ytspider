# কোডবেজ স্ক্যান রিপোর্ট ও সমস্যা সমাধান

## ✅ সম্পন্ন হয়েছে

### ১. ~~Critical Error: `useShop must be used within a ShopProvider`~~ ✅
- `src/lib/invitationUtils.ts` তৈরি করা হয়েছে - ShopContext-মুক্ত ফাংশন
- `AcceptInvite.tsx` আপডেট করা হয়েছে - নতুন utility ব্যবহার করছে
- `useShopInvitations.ts` refactor করা হয়েছে

### ২. ~~shop_members টেবিলে ইউজার ইমেইল নেই~~ ✅
- `profiles` টেবিল তৈরি করা হয়েছে
- Auto-create trigger যোগ করা হয়েছে
- `TeamMembers.tsx` আপডেট - profiles থেকে email/name দেখাচ্ছে

---

## 🔄 বাকি আছে

### ১. Provider Order সমস্যা (Low Priority)
`AdminThemeProvider` সবার বাইরে আছে, কিন্তু এটি `ShopProvider` এর ভিতরে থাকা উচিত যদি শপ-স্পেসিফিক থিম চাই।
*Note: এটি ঐচ্ছিক - বর্তমান সিস্টেম কাজ করছে*

### ২. useShopTheme integration (Medium Priority)
`useShopTheme.ts` তৈরি আছে কিন্তু Settings পেজে ব্যবহার হচ্ছে না।
- User-level theme: ব্যক্তিগত preference
- Shop-level theme: শপ-স্পেসিফিক (admin only)

### ৩. Granular RLS Policies (Low Priority)
Permission checks শুধু frontend-এ হচ্ছে। Backend RLS-এ granular permissions নেই।

---

## অতিরিক্ত সমস্যাসমূহ (পরে ঠিক করার জন্য)

1. **Email Sending** - ইনভাইট ইমেইল পাঠানোর Edge Function নেই
2. **Activity Log UI** - ShopAuditLog পেজে ফিল্টারিং এবং পেজিনেশন দরকার
3. **Real-time Updates** - shop_members টেবিলে realtime enable করা দরকার

---

## সম্পন্ন ফাইল পরিবর্তন

### নতুন ফাইল:
- ✅ `src/lib/invitationUtils.ts` - ShopContext-মুক্ত ইনভাইট ফাংশন

### আপডেট করা ফাইল:
- ✅ `src/pages/AcceptInvite.tsx` - নতুন utility ব্যবহার
- ✅ `src/hooks/useShopInvitations.ts` - refactor
- ✅ `src/pages/admin/TeamMembers.tsx` - profiles থেকে ইমেইল দেখানো

### ডাটাবেজ মাইগ্রেশন:
- ✅ `profiles` টেবিল তৈরি
- ✅ Trigger ফাংশন তৈরি (auto-create profile on signup)
