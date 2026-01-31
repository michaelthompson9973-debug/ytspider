
# Multi-Select Import ও Landing Page Rendering সমস্যা সমাধান

## সমস্যা বিশ্লেষণ

### সমস্যা ১: Slow Import / Multiple Select কাজ না করা
- বর্তমানে `addMultipleSections` mutation একটি bulk insert করছে, কিন্তু insert এর পর নতুন section IDs `previewingSections` Set এ যুক্ত হচ্ছে না
- এতে নতুন imported sections preview তে দেখা যায় না

### সমস্যা ২: Imported Component Render না হওয়া
- Library থেকে select করা component এর HTML ঠিকমতো database এ save হচ্ছে
- কিন্তু Landing Page এ গিয়ে দেখলে default placeholder দেখাচ্ছে
- এর কারণ হলো React Query cache invalidation এর পরে যথেষ্ট delay না থাকায় stale data দেখাচ্ছে

## সমাধান পরিকল্পনা

### ধাপ ১: useSections.ts - Bulk Insert উন্নতি
**সমস্যা:** `addMultipleSectionsMutation` এ success callback এ নতুন section গুলো cache এ properly set হচ্ছে না

**সমাধান:**
```typescript
const addMultipleSectionsMutation = useMutation({
  mutationFn: async (items) => {
    // ... existing insert logic
    const { data, error } = await supabase
      .from('landing_page_sections')
      .insert(insertData)
      .select(); // Returns inserted data with IDs
      
    if (error) throw error;
    return (data ?? []).map(transformSection);
  },
  onSuccess: (newSections) => {
    // Immediately update cache with new sections
    queryClient.setQueryData(
      ['landing-page-sections', landingPageId],
      (oldData: Section[] | undefined) => {
        if (!oldData) return newSections;
        return [...oldData, ...newSections];
      }
    );
    // Then invalidate to get fresh data
    queryClient.invalidateQueries({ 
      queryKey: ['landing-page-sections', landingPageId] 
    });
    toast({ title: 'Sections added' });
  },
});
```

### ধাপ ২: SectionBuilder.tsx - Preview Auto-Update
**সমস্যা:** নতুন imported sections `previewingSections` এ যোগ হচ্ছে না

**সমাধান:**
```typescript
// Add effect to auto-add new sections to previewing set
useEffect(() => {
  const sectionIds = new Set(sections.map(s => s.id));
  setPreviewingSections(prev => {
    const newSet = new Set(prev);
    // Add any new section IDs that aren't already in the set
    sections.forEach(s => {
      if (!prev.has(s.id)) {
        newSet.add(s.id);
      }
    });
    return newSet;
  });
}, [sections]);
```

### ধাপ ৩: Landing Page Data Sync উন্নতি
**সমস্যা:** Landing Page sections fetch করার সময় stale data পাচ্ছে

**সমাধান - LandingPage.tsx এ:**
```typescript
const { data: sections = [] } = useQuery<SectionData[]>({
  queryKey: ['landing-page-sections', page?.id],
  queryFn: async () => {
    if (!page?.id) return [];
    const { data, error } = await supabase
      .from('landing_page_sections')
      .select('id, html, type, config, sort_order, name') // Add name field
      .eq('landing_page_id', page.id)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data as SectionData[];
  },
  enabled: !!page?.id,
  staleTime: 0, // Always fetch fresh data
  refetchOnMount: 'always', // Refetch when component mounts
});
```

### ধাপ ৪: LibraryPickerModal উন্নতি
**সমস্যা:** Multi-select এর পর selected components সঠিক order এ pass হচ্ছে না

**সমাধান:**
```typescript
const handleConfirm = () => {
  // Preserve selection order by filtering from filteredComponents
  const selectedComponents = filteredComponents.filter(c => selectedIds.has(c.id));
  if (selectedComponents.length > 0) {
    onSelect(selectedComponents);
    // ... rest of cleanup
  }
};
```

## ফাইল পরিবর্তন সারাংশ

| ফাইল | পরিবর্তন |
|------|---------|
| `useSections.ts` | `addMultipleSections` mutation এ optimistic cache update যোগ |
| `SectionBuilder.tsx` | নতুন sections auto-preview effect যোগ |
| `LandingPage.tsx` | Query staleTime এবং refetchOnMount যোগ |
| `LibraryPickerModal.tsx` | Selection order preservation |

## প্রত্যাশিত ফলাফল
- ✅ একাধিক component select করে একসাথে import করা যাবে
- ✅ Import এর সাথে সাথে preview তে নতুন sections দেখা যাবে
- ✅ Landing Page এ visit করলে imported sections সঠিকভাবে render হবে
- ✅ Fast import - sequential এর বদলে bulk insert হবে
