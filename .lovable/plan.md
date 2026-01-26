
# Desktop Preview Simulation Fix Plan

## সমস্যা বিশ্লেষণ

Screenshots দেখে সমস্যাটি চিহ্নিত হয়েছে:

1. **Real Page (Image 1)**: Full-width content, সমস্ত screen জুড়ে
2. **Desktop Preview (Image 2)**: Content centered এবং সংকীর্ণ, দুপাশে ফাঁকা grey space

**দুটি সমস্যা রয়েছে:**

### সমস্যা ১: Preview Container Layout
বর্তমানে preview area তে `flex items-start justify-center p-4` ব্যবহার করা হচ্ছে যা Desktop mode এও content কে centered রাখছে। Desktop mode এ iframe সরাসরি পুরো preview area জুড়ে থাকা উচিত।

### সমস্যা ২: FullPagePreview vs FullscreenPreviewModal Consistency
`FullPagePreview.tsx` (inline preview) এবং `FullscreenPreviewModal.tsx` (fullscreen) দুটোতে একই সমস্যা থাকতে পারে।

## সমাধান

### File: `FullscreenPreviewModal.tsx`

**পরিবর্তন:**
- Desktop mode এ `p-4` padding এবং `items-start justify-center` সরিয়ে দেওয়া
- iframe কে সরাসরি full width/height দেওয়া
- শুধুমাত্র mobile/tablet mode এ device frame এবং centered layout রাখা

```typescript
// Preview area - Different layout for desktop vs mobile
<div className={cn(
  'flex-1 min-h-0 overflow-auto',
  isMobileDevice 
    ? 'bg-muted/30 flex items-start justify-center p-4' 
    : 'bg-white' // Desktop: no padding, no centering
)}>
  {isMobileDevice ? (
    // Mobile device frame
    <div
      className="shadow-2xl rounded-[2rem] border-[8px] border-border overflow-hidden"
      style={getContainerStyle()}
    >
      <iframe ... style={{ borderRadius: '1.5rem' }} />
    </div>
  ) : (
    // Desktop: full width iframe
    <iframe ... className="w-full h-full border-0" />
  )}
</div>
```

### Preview Area Layout Changes

**Desktop Mode:**
```text
┌─────────────────────────────────────────────────────────────┐
│  [Header Controls]                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ████████████████████████████████████████████████████████   │
│  ████████  FULL WIDTH IFRAME (no frame)  ████████████████   │
│  ████████████████████████████████████████████████████████   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Mobile Mode:**
```text
┌─────────────────────────────────────────────────────────────┐
│  [Header Controls]                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│        ┌──────────────────┐                                 │
│        │  (device frame)  │                                 │
│        │   ┌──────────┐   │                                 │
│        │   │  iframe  │   │                                 │
│        │   └──────────┘   │                                 │
│        └──────────────────┘                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## পরিবর্তিত Files

| File | Changes |
|------|---------|
| `FullscreenPreviewModal.tsx` | Desktop mode এ full-width layout, mobile mode এ device frame সহ centered layout |

## Implementation Details

```typescript
// FullscreenPreviewModal.tsx preview area

{/* Preview area - conditional layout based on device */}
<div className={cn(
  'flex-1 min-h-0 overflow-auto',
  isMobileDevice 
    ? 'bg-muted/30 flex items-center justify-center p-4' 
    : '' // Desktop: no extra styles, iframe fills space
)}>
  {isMobileDevice ? (
    // Mobile/tablet with device frame
    <div
      className="transition-all duration-300 bg-white overflow-hidden shadow-2xl rounded-[2rem] border-[8px] border-border"
      style={getContainerStyle()}
    >
      <iframe
        key={refreshKey}
        srcDoc={previewHtml}
        className="w-full h-full border-0"
        sandbox="allow-scripts"
        title="Landing Page Preview"
        style={{ borderRadius: '1.5rem' }}
      />
    </div>
  ) : (
    // Desktop: full width/height iframe without frame
    <iframe
      key={refreshKey}
      srcDoc={previewHtml}
      className="w-full h-full border-0 bg-white"
      sandbox="allow-scripts"
      title="Landing Page Preview"
    />
  )}
</div>
```

## Expected Result

1. **Desktop mode এ** iframe সম্পূর্ণ preview area জুড়ে থাকবে - real page এর মতো দেখাবে
2. **Mobile mode এ** device frame সহ centered layout থাকবে - realistic device simulation
3. Real page এবং preview এর মধ্যে কোন visual difference থাকবে না
