

# Preview Desktop/Mobile Mode Fix - Implementation Plan

## সমস্যার বিবরণ

Section Builder এর ভিতরে `FullPagePreview` component এ Desktop এবং Mobile mode এ preview সঠিকভাবে render হচ্ছে না।

## মূল কারণ (Root Cause Analysis)

### সমস্যা ১: Viewport Width Detection
`FullPagePreview.tsx` এ mobile mode simulate করা হচ্ছে শুধুমাত্র `max-width: 375px` দিয়ে:
```typescript
device === 'mobile' ? 'max-w-[375px] border-x' : 'w-full'
```

কিন্তু iframe এর ভিতরে থাকা HTML content সেই viewport change সম্পর্কে জানে না। Tailwind CSS এর responsive breakpoints (যেমন `md:`, `lg:`) iframe এর width এর উপর ভিত্তি করে কাজ করে, container এর width এর উপর নয়।

### সমস্যা ২: iframe এ explicit dimensions নেই
iframe element এ `width` এবং `height` attributes explicitly দেওয়া নেই, ফলে content properly scale হচ্ছে না।

### সমস্যা ৩: FullscreenPreviewModal vs FullPagePreview পার্থক্য
`FullscreenPreviewModal.tsx` এ proper device simulation আছে (device frames, specific dimensions), কিন্তু `FullPagePreview.tsx` এ শুধু `max-width` ব্যবহার করা হয়েছে।

## প্রস্তাবিত সমাধান

### পরিবর্তন ১: iframe এ CSS Transform Scaling যোগ করা

Mobile mode এ iframe কে actual mobile width (375px) এ render করে তারপর scale করা যাতে container এ fit হয়। এতে Tailwind responsive classes সঠিকভাবে কাজ করবে।

### পরিবর্তন ২: Device Dimensions Explicit করা

iframe এ explicit `width` এবং `height` style দেওয়া যাতে content জানে actual viewport কত।

---

## Technical Implementation

### File: `src/components/admin/landing-page-editor/FullPagePreview.tsx`

**বর্তমান কোড (সমস্যাযুক্ত):**
```typescript
<div
  className={cn(
    'h-full mx-auto transition-all duration-300',
    device === 'mobile' ? 'max-w-[375px] border-x' : 'w-full'
  )}
>
  <iframe
    key={refreshKey}
    ref={iframeRef}
    srcDoc={previewHtml}
    className="w-full h-full border-0"
    sandbox="allow-scripts"
    title="Landing Page Preview"
  />
</div>
```

**নতুন কোড (ফিক্সড):**
```typescript
// Mobile device dimensions
const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 667;

// Calculate scale for mobile view to fit container
const containerRef = useRef<HTMLDivElement>(null);
const [scale, setScale] = useState(1);

useEffect(() => {
  if (device === 'mobile' && containerRef.current) {
    const containerWidth = containerRef.current.clientWidth;
    const newScale = Math.min(1, (containerWidth - 32) / MOBILE_WIDTH);
    setScale(newScale);
  } else {
    setScale(1);
  }
}, [device]);

// In JSX:
<div ref={containerRef} className="h-full border rounded-md bg-background overflow-hidden">
  {device === 'mobile' ? (
    // Mobile: Fixed dimensions with scaling
    <div className="h-full flex items-start justify-center overflow-auto pt-4 pb-4 bg-muted/30">
      <div
        style={{
          width: MOBILE_WIDTH,
          height: MOBILE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
        className="bg-white overflow-hidden shadow-xl rounded-2xl border-4 border-border shrink-0"
      >
        <iframe
          key={refreshKey}
          ref={iframeRef}
          srcDoc={previewHtml}
          style={{ width: MOBILE_WIDTH, height: MOBILE_HEIGHT }}
          className="border-0 rounded-xl"
          sandbox="allow-scripts"
          title="Landing Page Preview"
        />
      </div>
    </div>
  ) : (
    // Desktop: Full width
    <iframe
      key={refreshKey}
      ref={iframeRef}
      srcDoc={previewHtml}
      className="w-full h-full border-0"
      sandbox="allow-scripts"
      title="Landing Page Preview"
    />
  )}
</div>
```

### কেন এটা কাজ করবে:

1. **Fixed Viewport**: Mobile mode এ iframe `375x667` fixed dimension এ থাকবে, তাই Tailwind এর mobile-first classes (যেমন `flex-col`, `text-sm`) সঠিকভাবে apply হবে।

2. **CSS Scale**: Container এ fit করার জন্য CSS `transform: scale()` ব্যবহার করা হবে, যা visual scaling করবে কিন্তু iframe এর internal dimensions পরিবর্তন করবে না।

3. **Device Frame**: Mobile preview তে একটা visual frame থাকবে (rounded corners, shadow) যা FullscreenPreviewModal এর মতো দেখাবে।

4. **Responsive Container Handling**: ResizeObserver দিয়ে container size change detect করা হবে এবং scale update হবে।

---

## Implementation Files

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/landing-page-editor/FullPagePreview.tsx` | Edit | Add proper device simulation with fixed dimensions and scaling |

---

## Expected Results

### Fix এর পরে:

1. **Mobile Mode**
   - iframe 375x667 dimension এ render হবে
   - Tailwind responsive classes সঠিকভাবে কাজ করবে
   - Device frame দেখাবে (rounded, shadow)
   - Container এ fit করার জন্য auto-scale হবে

2. **Desktop Mode**
   - Full width iframe, কোন scaling নেই
   - Tailwind desktop breakpoints active থাকবে

3. **Visual Consistency**
   - FullscreenPreviewModal এবং FullPagePreview এ একই preview quality

