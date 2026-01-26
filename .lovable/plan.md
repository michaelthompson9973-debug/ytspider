

# Expand to Fullscreen → Preview Link Open

## বর্তমান অবস্থা

- **Maximize2 icon** click → `setFullscreenOpen(true)` → Modal opens
- **ExternalLink icon** click → `handleOpenRealPreview()` → Opens `/p/{slug}?preview=true`

## নতুন পরিবর্তন

**Maximize2 button** এর behavior পরিবর্তন করে সরাসরি preview link open করা হবে।

---

## File: `src/components/admin/landing-page-editor/FullPagePreview.tsx`

**Line 200-208 পরিবর্তন:**

```typescript
// আগে:
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  onClick={() => setFullscreenOpen(true)}  // Modal opens
  title="Expand to fullscreen"
>
  <Maximize2 className="h-4 w-4" />
</Button>

// পরে:
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  onClick={handleOpenRealPreview}  // Opens preview link
  title={landingPage?.slug ? `/p/${landingPage.slug}?preview=true` : 'Preview link'}
>
  <Maximize2 className="h-4 w-4" />
</Button>
```

---

## Optional Cleanup

যেহেতু Fullscreen Modal আর ব্যবহার হচ্ছে না, তাই এই গুলো remove করা যায়:

1. `fullscreenOpen` state remove
2. `FullscreenPreviewModal` import ও usage remove
3. ExternalLink button remove (duplicate হয়ে যাচ্ছে)

---

## Summary

| Component | Change |
|-----------|--------|
| `FullPagePreview.tsx` | Maximize2 button → `handleOpenRealPreview()` call করবে |

এখন Maximize2 icon click করলেই `/p/{slug}?preview=true` new tab এ open হবে।

