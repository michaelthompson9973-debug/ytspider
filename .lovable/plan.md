
# ফিল্টার বাটনে Hind Siliguri ফন্ট যোগ করা

## পরিবর্তন

ফিল্টার বাটনগুলোতে `font-heading` class যোগ করব যা `src/index.css` এ "Hind Siliguri" ফন্ট হিসেবে সংজ্ঞায়িত আছে।

## ফাইল পরিবর্তন

| ফাইল | পরিবর্তন |
|------|----------|
| `src/components/admin/messenger/layout/LeftSidebar.tsx` | Line 96: className এ `font-heading` যোগ করা |

## কোড পরিবর্তন

```typescript
// Line 95-100 এ:
className={cn(
  "text-xs px-2 py-1 rounded-md flex items-center gap-1 transition-colors font-heading",
  filter === f.value
    ? "bg-primary text-primary-foreground"
    : "bg-muted/50 hover:bg-muted text-muted-foreground"
)}
```

এতে বাংলা ফিল্টার লেবেল ("সকল", "অপঠিত", "বিজ্ঞাপন থেকে" ইত্যাদি) Hind Siliguri ফন্টে দেখাবে।
