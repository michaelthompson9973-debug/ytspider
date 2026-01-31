

# সমস্যা: লাইব্রেরি থেকে ৬টি সিলেক্ট করলে ২টি অ্যাড হয় এবং Slow

## সমস্যার কারণ চিহ্নিত

`useSections.ts` ফাইলে `addMultipleSectionsMutation`-এ একটি critical bug আছে:

```typescript
// Line 221 - সমস্যার মূল
const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) : -1;
```

**সমস্যা:** `sections` হলো React Query থেকে আসা cached state যা mutation function এর বাইরে define করা। যখন insert query চলে, এই value আগের (stale) থাকে। ফলে:
- সব ৬টি section একই `sort_order` পেয়ে যায়
- Database unique constraint বা race condition এর কারণে কিছু insert fail হয়

---

## সমাধান

### ১. Database থেকে সর্বশেষ `max(sort_order)` নেওয়া

```typescript
// আগে
const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) : -1;

// পরে
const { data: maxOrderRow } = await supabase
  .from('landing_page_sections')
  .select('sort_order')
  .eq('landing_page_id', landingPageId)
  .order('sort_order', { ascending: false })
  .limit(1)
  .single();

const maxOrder = maxOrderRow?.sort_order ?? -1;
```

### ২. Progress Tracking যোগ করা (বড় batch এর জন্য)

যদিও একটি single batch insert হচ্ছে, UI তে loading state উন্নত করব।

---

## ফাইল পরিবর্তন

| ফাইল | পরিবর্তন |
|------|----------|
| `src/components/admin/landing-page-editor/useSections.ts` | `addMultipleSectionsMutation`-এ fresh `maxOrder` query |

---

## Technical Details

### আগের কোড (Line 218-256):
```typescript
const addMultipleSectionsMutation = useMutation({
  mutationFn: async (items) => {
    // ❌ Stale sections state ব্যবহার করা হচ্ছে
    const maxOrder = sections.length > 0 
      ? Math.max(...sections.map(s => s.sort_order)) 
      : -1;
    
    const insertData = items.map((item, index) => ({
      // ...
      sort_order: maxOrder + 1 + index,  // ❌ সব একই base থেকে শুরু
    }));
    // ...
  }
});
```

### নতুন কোড:
```typescript
const addMultipleSectionsMutation = useMutation({
  mutationFn: async (items) => {
    if (!landingPageId) throw new Error('No landing page selected');
    
    // ✅ Fresh query দিয়ে সর্বশেষ sort_order নেওয়া
    const { data: lastSection } = await supabase
      .from('landing_page_sections')
      .select('sort_order')
      .eq('landing_page_id', landingPageId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const maxOrder = lastSection?.sort_order ?? -1;
    
    const insertData = items.map((item, index) => ({
      landing_page_id: landingPageId,
      name: item.name,
      html: item.html,
      type: item.type,
      config: item.config as Json,
      sort_order: maxOrder + 1 + index,  // ✅ Sequential ordering
    }));

    const { data, error } = await supabase
      .from('landing_page_sections')
      .insert(insertData)
      .select();
      
    if (error) throw error;
    return (data ?? []).map(transformSection);
  },
  // ... rest same
});
```

---

## কেন এই সমস্যা হচ্ছিল?

1. **Stale Closure Problem**: `sections` variable টি mutation function define হওয়ার সময় capture হয়
2. যখন ইউজার ৬টি select করে Add চাপে, mutation চলার সময় `sections` state empty বা পুরানো থাকে
3. সব ৬টি item একই `sort_order` পায় (যেমন: 0, 1, 2, 3, 4, 5 এর বদলে সবাই -1+1=0 থেকে শুরু করে 0, 1, 2, 3, 4, 5)
4. কিন্তু যদি আগে থেকে কোনো section থাকে এবং sections state ঠিকমতো আপডেট না হয়, তাহলে duplicate `sort_order` হতে পারে

---

## প্রত্যাশিত ফলাফল

- ৬টি section select করলে ৬টিই সঠিকভাবে add হবে
- প্রতিটি section unique `sort_order` পাবে
- Performance উন্নত হবে কারণ single batch insert হবে

