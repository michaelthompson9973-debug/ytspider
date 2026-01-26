

# Simple Preview Link for Published + Unpublished Pages

## সমাধান

**Preview URL Format:** `/p/{slug}?preview=true`

এই URL দিয়ে published বা unpublished যেকোনো page দেখা যাবে।

## পরিবর্তন

### File 1: `src/pages/LandingPage.tsx`

**পরিবর্তন:**
- `?preview=true` query parameter চেক করা
- Preview mode এ `.eq('published', true)` condition সরিয়ে দেওয়া
- Preview mode এ একটি ছোট banner দেখানো (optional)

```typescript
// Get preview mode from URL
const isPreviewMode = searchParams.get('preview') === 'true';

// Query - conditionally check published status
const { data: page } = useQuery({
  queryKey: ['landing-page', slug, isPreviewMode],
  queryFn: async () => {
    let query = supabase
      .from('landing_pages')
      .select(`*, products (id, name, price, description, images)`)
      .eq('slug', slug);
    
    // Only check published if NOT in preview mode
    if (!isPreviewMode) {
      query = query.eq('published', true);
    }
    
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  },
});
```

### File 2: `src/components/admin/landing-page-editor/FullPagePreview.tsx`

**পরিবর্তন:**
- `handleOpenRealPreview` function এ `?preview=true` যোগ করা
- Published check সরিয়ে দেওয়া

```typescript
const handleOpenRealPreview = () => {
  if (!landingPage?.slug) {
    toast({ title: 'Slug not found', variant: 'destructive' });
    return;
  }
  
  // Always open with preview=true (works for both published & unpublished)
  window.open(`/p/${landingPage.slug}?preview=true`, '_blank');
};
```

### File 3: `src/components/admin/landing-page-editor/FullscreenPreviewModal.tsx`

**পরিবর্তন:**
- Same update - `?preview=true` যোগ করা

---

## Preview Banner (Optional)

Unpublished page preview তে একটি ছোট banner দেখানো যেতে পারে:

```typescript
// LandingPage.tsx - at the top
{isPreviewMode && !page.published && (
  <div className="bg-amber-500 text-white text-center py-2 text-sm">
    Preview Mode - This page is not published yet
  </div>
)}
```

---

## Result

| Scenario | URL | Works? |
|----------|-----|--------|
| Published page (normal) | `/p/my-page` | Yes |
| Published page (preview) | `/p/my-page?preview=true` | Yes |
| Unpublished page (preview) | `/p/my-page?preview=true` | Yes |
| Unpublished page (normal) | `/p/my-page` | No (404) |

---

## Files Summary

| File | Changes |
|------|---------|
| `LandingPage.tsx` | `?preview=true` check + conditional published filter |
| `FullPagePreview.tsx` | Preview link এ `?preview=true` যোগ |
| `FullscreenPreviewModal.tsx` | Same update |

