

# "Create Account" → রেজিস্ট্রেশন → সাবস্ক্রিপশন ফ্লো ফিক্স

## বর্তমান সমস্যা
- "Create Account" বাটন `/login` এ যায় যেখানে শুধু লগইন ফর্ম আছে, কোনো সাইনআপ নেই
- রেজিস্ট্রেশনের পর সাবস্ক্রিপশন কেনার কোনো ফ্লো নেই

## পরিকল্পনা

### ধাপ ১: নতুন `/register` পেজ তৈরি (`src/pages/Register.tsx`)

একটি ShopFlow ব্র্যান্ডেড রেজিস্ট্রেশন ফর্ম:
- ফিল্ড: পুরো নাম, ইমেইল, পাসওয়ার্ড, পাসওয়ার্ড কনফার্ম
- Zod ভ্যালিডেশন
- `supabase.auth.signUp()` কল
- সফল হলে → `/pricing` পেজে রিডাইরেক্ট (সাবস্ক্রিপশন বেছে নিতে)
- নিচে "ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন" লিংক

### ধাপ ২: `App.tsx` এ রাউট যোগ
```text
<Route path="/register" element={<Register />} />
```

### ধাপ ৩: `Index.tsx` বাটন লিংক আপডেট
- "Create Account" → `/register`
- "Get Started" → `/register`

### ধাপ ৪: `Header.tsx` আপডেট
- "Get Started" বাটন → `/register`

### ধাপ ৫: `ShopLogin.tsx` এ সাইনআপ লিংক যোগ
- ফর্মের নিচে "নতুন অ্যাকাউন্ট তৈরি করুন" → `/register` লিংক

### সম্পূর্ণ ফ্লো
```text
Landing Page → "Create Account" → /register (সাইনআপ ফর্ম)
  → সফল → /pricing (প্ল্যান বাছাই)
    → /checkout?plan=slug (পেমেন্ট)
      → /purchase-success
```

---

## কারিগরি বিবরণ

| ফাইল | পরিবর্তন |
|------|----------|
| `src/pages/Register.tsx` | নতুন — রেজিস্ট্রেশন ফর্ম পেজ |
| `src/App.tsx` | `/register` রাউট যোগ |
| `src/pages/Index.tsx` | বাটন লিংক `/login` → `/register` |
| `src/components/landing/Header.tsx` | "Get Started" লিংক → `/register` |
| `src/pages/shop/ShopLogin.tsx` | সাইনআপ লিংক যোগ |

