

# Preview এবং Real Landing Page সমান করার Plan

## সমস্যা বিশ্লেষণ

Screenshots থেকে দেখা যাচ্ছে:
1. **Preview তে**: Image gallery ছোট (120px height), form fields এ label নেই, compact layout
2. **Real page এ**: Full-width aspect-square image gallery with thumbnails/navigation, proper labels সহ form fields

এটা হচ্ছে কারণ:
- **Real page** ব্যবহার করে: `CheckoutSection.tsx` (React component) + `ProductImageGallery.tsx`
- **Admin preview** ব্যবহার করে: `generateCheckoutPreviewHTML()` (Static HTML function)

## সমাধান পরিকল্পনা

Preview HTML কে real `CheckoutSection` component এর সাথে হুবহু মেলাতে হবে।

### পরিবর্তন ১: `generateCheckoutPreviewHTML` আপডেট

`themeUtils.ts` এ `generateCheckoutPreviewHTML` function টিকে সম্পূর্ণ re-write করতে হবে যেন এটি `CheckoutSection.tsx` এর exact HTML structure mirror করে।

**Key Changes:**
- Image: `height: 120px` → `aspect-ratio: 1/1` (square, full-width)
- Form fields: `<input placeholder="...">` → `<label>...</label><input ...>`
- Image gallery: Navigation arrows + thumbnail strip যোগ
- Labels: "আপনার নাম *", "মোবাইল নম্বর *" etc. যোগ

### পরিবর্তন ২: Device Simulation with User-Agent

Fullscreen preview modal এ real device simulation যোগ করা হবে multiple device presets এবং user-agent injection সহ।

**Device Presets:**
```text
┌─────────────────────────────────────────────┐
│ [iPhone 14 Pro ▼] [Desktop][Mobile] [🔄][X] │
└─────────────────────────────────────────────┘
```

**Device Options:**
- iPhone 14 Pro (390x844)
- iPhone SE (375x667)
- Samsung Galaxy S21 (360x800)
- iPad (768x1024)
- Desktop (full width)

**User-Agent Injection:**
- iframe এ sandbox="allow-scripts allow-same-origin" রেখে
- iframe content এ JavaScript inject করে `navigator.userAgent` override করার চেষ্টা করা যায় না (browser security)
- তবে CSS media query এবং viewport simulation করা যায়

### File Changes

| File | Changes |
|------|---------|
| `themeUtils.ts` | `generateCheckoutPreviewHTML` সম্পূর্ণ re-write করে real component এর সাথে match করা |
| `FullscreenPreviewModal.tsx` | Device presets dropdown যোগ, realistic viewport dimensions |

---

## Technical Details

### 1. Updated `generateCheckoutPreviewHTML` Structure

নতুন HTML structure যা `CheckoutSection.tsx` mirror করবে:

```html
<section class="py-12 px-4 bg-muted/50" id="checkout">
  <div class="container max-w-md mx-auto">
    <div class="rounded-theme bg-background border shadow-sm p-6">
      <!-- Title -->
      <h2 class="font-heading ...">অর্ডার করুন</h2>
      
      <!-- Product Card -->
      <div class="mb-6 p-4 rounded-theme ...">
        <!-- Image Gallery (aspect-square) -->
        <div class="w-full aspect-square rounded-theme overflow-hidden bg-muted relative">
          <img src="..." class="w-full h-full object-cover" />
          <!-- Navigation arrows (if multiple images) -->
          <!-- Image counter badge -->
        </div>
        <!-- Thumbnails row -->
        
        <!-- Product name + price -->
        <div class="flex justify-between items-start">...</div>
        
        <!-- Quantity selector -->
        <div class="flex items-center justify-between">...</div>
        
        <!-- Price breakdown -->
        <div class="border-t pt-3 space-y-2">...</div>
      </div>
      
      <!-- Form with LABELS -->
      <form class="space-y-4">
        <div class="space-y-2">
          <label class="font-body text-sm font-medium">
            আপনার নাম <span class="text-destructive">*</span>
          </label>
          <input ... />
        </div>
        <!-- More fields with labels -->
        
        <button>অর্ডার সম্পন্ন করুন</button>
      </form>
    </div>
  </div>
</section>
```

### 2. Device Simulation

Device selector dropdown যোগ করা হবে FullscreenPreviewModal এ:

```typescript
const devicePresets = [
  { name: 'Desktop', width: 'full', height: 'full' },
  { name: 'iPhone 14 Pro', width: 393, height: 852 },
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 },
];

// In modal header
<Select value={selectedDevice} onValueChange={setSelectedDevice}>
  <SelectTrigger className="w-40">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {devicePresets.map(d => (
      <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 3. Viewport Simulation

```typescript
const currentDevice = devicePresets.find(d => d.name === selectedDevice);

<div
  className="mx-auto bg-white shadow-2xl rounded-lg overflow-hidden"
  style={{
    width: currentDevice.width === 'full' ? '100%' : `${currentDevice.width}px`,
    height: currentDevice.height === 'full' ? '100%' : `${currentDevice.height}px`,
    maxWidth: '100%',
    maxHeight: '100%',
  }}
>
  <iframe ... />
</div>
```

---

## Summary

| Component | What Changes |
|-----------|--------------|
| `themeUtils.ts` | `generateCheckoutPreviewHTML` কে `CheckoutSection` এর exact structure এ re-write |
| `FullscreenPreviewModal.tsx` | Device presets dropdown + realistic viewport simulation যোগ |

## Expected Result

1. Admin preview এবং real landing page **identical** দেখাবে
2. Image gallery সমান size এ দেখাবে (aspect-square)
3. Form fields এ proper labels থাকবে
4. Multiple device এ preview দেখা যাবে (iPhone, Samsung, iPad, Desktop)
5. Realistic viewport dimensions সহ device frame দেখানো হবে

