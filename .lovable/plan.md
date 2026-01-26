

# Fullscreen Modal Fix Plan

## সমস্যা চিহ্নিতকরণ

Screenshot দেখে বুঝা যাচ্ছে:
1. Modal centered হয়ে আছে, পুরো screen cover করছে না
2. `DialogContent` এর base CSS (`translate-x-[-50%] translate-y-[-50%]`) override হচ্ছে না
3. `flex-1` কাজ করছে না কারণ parent `grid` layout ব্যবহার করছে

## সমাধান

### পদ্ধতি ১: Custom Fullscreen Dialog Content তৈরি (Recommended)

Dialog component এ নতুন variant যোগ করা যেখানে fullscreen mode সাপোর্ট করবে।

**Changes in `dialog.tsx`:**
```typescript
// নতুন FullscreenDialogContent component
const FullscreenDialogContent = React.forwardRef<...>(
  ({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-background",
          className,
        )}
        {...props}
      >
        {children}
        {/* No default close button - handled by component */}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
);
```

**Key differences:**
- `inset-0` instead of `left-[50%] top-[50%] translate-*`
- `flex flex-col` instead of `grid`
- No default close button (আমরা নিজেদের ব্যবহার করব)
- No animations that interfere with fullscreen

### পরিবর্তন ২: FullscreenPreviewModal আপডেট

```typescript
import { FullscreenDialogContent } from '@/components/ui/dialog';

<Dialog open={open} onOpenChange={onOpenChange}>
  <FullscreenDialogContent>
    {/* Header */}
    <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
      ...
    </div>
    
    {/* Preview area - takes remaining space */}
    <div className="flex-1 min-h-0 overflow-hidden">
      <iframe ... className="w-full h-full" />
    </div>
  </FullscreenDialogContent>
</Dialog>
```

### পরিবর্তন ৩: FullscreenCodeModal আপডেট

একই FullscreenDialogContent ব্যবহার করে code editor modal ও fix করা হবে।

---

## Technical Implementation

### File: `src/components/ui/dialog.tsx`

নতুন export যোগ করা:
```typescript
const FullscreenDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
FullscreenDialogContent.displayName = "FullscreenDialogContent";
```

### File: `FullscreenPreviewModal.tsx`

```typescript
import { Dialog, FullscreenDialogContent, DialogTitle } from '@/components/ui/dialog';

// Replace DialogContent with FullscreenDialogContent
<Dialog open={open} onOpenChange={onOpenChange}>
  <FullscreenDialogContent aria-describedby={undefined}>
    {/* Header - fixed height */}
    <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
      <DialogTitle>Landing Page Preview</DialogTitle>
      <div className="flex items-center gap-2">
        {/* ... buttons ... */}
      </div>
    </div>
    
    {/* Preview area - fills remaining space */}
    <div className="flex-1 min-h-0 overflow-hidden bg-muted/30">
      <div className={cn(
        'h-full mx-auto',
        device === 'mobile' ? 'max-w-[375px] border-x shadow-lg' : 'w-full'
      )}>
        <iframe
          srcDoc={previewHtml}
          className="w-full h-full border-0 bg-white"
        />
      </div>
    </div>
  </FullscreenDialogContent>
</Dialog>
```

### File: `FullscreenCodeModal.tsx`

একই pattern অনুসরণ করে update করা হবে।

---

## Summary

| File | Changes |
|------|---------|
| `dialog.tsx` | নতুন `FullscreenDialogContent` component যোগ |
| `FullscreenPreviewModal.tsx` | `FullscreenDialogContent` ব্যবহার, layout fix |
| `FullscreenCodeModal.tsx` | `FullscreenDialogContent` ব্যবহার, layout fix |

## Expected Result

- Modal সত্যিকারের fullscreen হবে (inset-0)
- Header উপরে fixed থাকবে
- Content area বাকি space নেবে
- Mobile/Desktop toggle সঠিকভাবে কাজ করবে
- Close button সঠিক জায়গায় থাকবে

