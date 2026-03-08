

## Problem

`ShopHeader.tsx`-এ `SidebarTrigger` শুধু `md:hidden` ক্লাসে আছে, তাই ডেস্কটপে কলাপ্স বাটন দেখা যাচ্ছে না। মোবাইলেই শুধু দেখায়।

## Plan

**File: `src/components/shop/ShopHeader.tsx`**

- `SidebarTrigger` থেকে `md:hidden` ক্লাস সরিয়ে দিতে হবে যাতে সব স্ক্রিন সাইজে দেখা যায়
- এটা হেডারের বাম পাশে থাকবে, ক্লিক করলে সাইডবার collapse/expand হবে

```tsx
<SidebarTrigger className="-ml-1" />  // md:hidden removed
```

Single line change, one file only.

