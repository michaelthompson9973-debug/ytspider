
# Preview Click এ Unique Real Preview Link তৈরির Plan

## বর্তমান সিস্টেম

বর্তমানে preview button click করলে:
1. `FullscreenPreviewModal` ওপেন হয় (iframe with srcDoc)
2. এটি static HTML generate করে iframe এ show করে
3. এটা real landing page `/p/{slug}` থেকে আলাদা behave করে

## নতুন সমাধান

**Preview button এ click করলে সরাসরি real landing page `/p/{slug}` নতুন tab এ ওপেন হবে।**

এটি সত্যিকারের page দেখাবে কারণ:
- Real React components render হবে (`CheckoutSection.tsx`)
- সব fonts, theme, styles properly load হবে
- Real device এ যেমন দেখাবে হুবহু তেমন দেখাবে

### Implementation Details

**File: `FullPagePreview.tsx`**

নতুন "Open Preview" button যোগ করা হবে যা:
1. Landing page এর slug fetch করবে
2. নতুন tab এ `/p/{slug}` route ওপেন করবে

```typescript
// Fetch landing page slug
const { data: landingPage } = useQuery({
  queryKey: ['landing-page-slug', landingPageId],
  queryFn: async () => {
    const { data } = await supabase
      .from('landing_pages')
      .select('slug, published')
      .eq('id', landingPageId)
      .maybeSingle();
    return data;
  },
  enabled: !!landingPageId,
});

// Open real preview in new tab
const handleOpenRealPreview = () => {
  if (!landingPage?.slug) {
    toast({ 
      title: 'Error', 
      description: 'Page slug not found', 
      variant: 'destructive' 
    });
    return;
  }
  
  // Note: For unpublished pages, we need a preview token system
  // Or we can show warning that page needs to be published first
  window.open(`/p/${landingPage.slug}`, '_blank');
};
```

### Preview Token System (Optional Enhancement)

Unpublished pages preview করার জন্য preview token system:

1. **Database**: `landing_page_preview_tokens` table
   - `id`, `landing_page_id`, `token`, `expires_at`, `created_at`

2. **Route**: `/p/{slug}?preview_token={token}`
   - Token validate করে unpublished page ও দেখাবে

3. **Edge Function**: `generate-preview-token`
   - 24 hour validity সহ unique token generate করবে

### সহজ Solution (Recommended First)

প্রথমে সহজ solution implement করি:
- Published pages এর জন্য সরাসরি `/p/{slug}` ওপেন করা
- Unpublished pages এর জন্য warning দেখানো যে "Please publish first to preview"

---

## File Changes

| File | Changes |
|------|---------|
| `FullPagePreview.tsx` | "Open in New Tab" button যোগ + slug fetch + warning for unpublished |
| `FullscreenPreviewModal.tsx` | Same "Open in New Tab" button header এ যোগ |

---

## Implementation: FullPagePreview.tsx

```typescript
import { ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Inside component:

// Fetch landing page details for slug
const { data: landingPage } = useQuery({
  queryKey: ['landing-page-details', landingPageId],
  queryFn: async () => {
    const { data } = await supabase
      .from('landing_pages')
      .select('slug, published')
      .eq('id', landingPageId)
      .maybeSingle();
    return data;
  },
  enabled: !!landingPageId,
});

const { toast } = useToast();

const handleOpenRealPreview = () => {
  if (!landingPage?.slug) {
    toast({ 
      title: 'Slug not found', 
      variant: 'destructive' 
    });
    return;
  }
  
  if (!landingPage.published) {
    toast({
      title: 'Page Not Published',
      description: 'Please publish the page first to see real preview.',
      variant: 'destructive',
    });
    return;
  }
  
  window.open(`/p/${landingPage.slug}`, '_blank');
};

// In toolbar, add button:
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  onClick={handleOpenRealPreview}
  title="Open in new tab"
>
  <ExternalLink className="h-4 w-4" />
</Button>
```

## Implementation: FullscreenPreviewModal.tsx

Header এ same button যোগ:

```typescript
// In header controls section:
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  onClick={handleOpenRealPreview}
  title="Open in new tab"
>
  <ExternalLink className="h-4 w-4" />
</Button>
```

---

## Expected Result

1. Preview toolbar এ **ExternalLink icon** button থাকবে
2. Click করলে **new browser tab** এ `/p/{slug}` ওপেন হবে
3. **Real landing page** দেখাবে - হুবহু live site এর মতো
4. Published না হলে warning toast দেখাবে
5. Device simulation এর প্রয়োজন নেই - real browser এ real page!

---

## Summary

| Component | New Feature |
|-----------|-------------|
| `FullPagePreview.tsx` | ExternalLink button → Opens `/p/{slug}` in new tab |
| `FullscreenPreviewModal.tsx` | Same button in fullscreen header |

এই solution সবচেয়ে সহজ এবং সবচেয়ে accurate preview দেবে কারণ এটা সত্যিকারের page ওপেন করে!
