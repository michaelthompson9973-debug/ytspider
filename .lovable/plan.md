

# Image Compression Fix - FormData Issue

## সমস্যা
Edge Function logs দেখাচ্ছে **"Body can not be decoded as form data"** error। এটি হচ্ছে কারণ:
- `supabase.functions.invoke()` FormData কে সরাসরি multipart/form-data হিসেবে পাঠায় না
- Edge Function `req.formData()` সঠিক Content-Type ছাড়া parse করতে পারে না

## সমাধান
`supabase.functions.invoke()` এর বদলে **native fetch API** ব্যবহার করা হবে যাতে FormData সঠিকভাবে multipart/form-data হিসেবে পাঠানো যায়।

## পরিবর্তন

### File 1: `src/hooks/useBulkUpload.ts`

**আগে:**
```typescript
const { data, error } = await supabase.functions.invoke('optimize-image', {
  body: formData,
});
```

**পরে:**
```typescript
// Direct fetch for proper FormData handling
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/optimize-image`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: formData, // FormData auto-sets Content-Type to multipart/form-data
  }
);
const data = await response.json();
```

### File 2: `src/hooks/useImageOptimizer.ts`

একই পরিবর্তন এখানেও করা হবে।

## Technical Details

- **Why fetch instead of SDK?** Supabase SDK `functions.invoke()` FormData কে JSON-এ convert করার চেষ্টা করে, যা কাজ করে না
- **Why no Content-Type header?** FormData ব্যবহার করলে browser স্বয়ংক্রিয়ভাবে সঠিক `multipart/form-data` boundary সহ Content-Type সেট করে
- **Auth:** Anon key ব্যবহার করা হবে Authorization header-এ

## প্রত্যাশিত ফলাফল
- ইমেজ আপলোড করলে 80%+ compression হবে
- 100KB ইমেজ → ~20KB হয়ে যাবে
- Progress panel-এ reduction % দেখা যাবে

