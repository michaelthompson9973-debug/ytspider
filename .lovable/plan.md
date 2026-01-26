

# Section Builder Enhancement Plan

## Overview
প্রতিটি section-এ individual preview/code toggle এবং checkout section-এর theme-integrated preview যোগ করা হবে। Global preview তে refresh button যোগ করা হবে।

## Key Changes

### 1. Individual Section Preview (in Section Editor)

**Current State:**
- SectionEditor শুধু HTML textarea দেখায়
- Preview দেখতে হলে right panel-এ যেতে হয়

**New Design:**
- SectionEditor এ Preview/HTML toggle tabs যোগ হবে
- Preview tab section-এর rendered output দেখাবে (theme applied)
- HTML tab existing textarea দেখাবে (code editing)

```text
┌──────────────────────────────────────────┐
│  Section Name: [Search Box    ] [Save]   │
├──────────────────────────────────────────┤
│  [Preview] [HTML]                    AI  │
├──────────────────────────────────────────┤
│                                          │
│   ┌────────────────────────────┐         │
│   │  Section Title             │         │
│   │  Your content here...      │         │
│   └────────────────────────────┘         │
│                                          │
└──────────────────────────────────────────┘
```

### 2. Checkout Section Auto-Render

**Problem:**
- Checkout sections have empty `html` field
- Preview uses `section.html` directly, so checkout shows nothing

**Solution:**
Create a utility function `generateCheckoutPreviewHTML()` that:
- Takes checkout config + theme config
- Returns static HTML representation of checkout form
- Includes product placeholder, quantity selector, form fields
- Uses theme CSS variables for styling

```text
┌────────────────────────────────┐
│      অর্ডার করুন               │
├────────────────────────────────┤
│  [Product Image Placeholder]   │
│  Product Name        ৳XXX      │
│  Quantity: [-] 1 [+]           │
│  ─────────────────────────     │
│  সাবটোটাল:          ৳XXX       │
│  ডেলিভারি:          ৳60        │
│  সর্বমোট:           ৳XXX       │
├────────────────────────────────┤
│  [আপনার নাম            ]       │
│  [মোবাইল নম্বর          ]       │
│  [ডেলিভারি ঠিকানা       ]       │
│  [শহর/জেলা             ]       │
├────────────────────────────────┤
│  [অর্ডার সম্পন্ন করুন    ]       │
└────────────────────────────────┘
```

### 3. Global Preview with Refresh Button

**Addition:**
- Refresh icon button next to device toggle buttons
- Clicking it forces iframe to reload
- Uses key-based re-render technique

```text
┌────────────────────────────────────────┐
│ [Preview] [HTML]   [Desktop][Mobile]🔄 │
├────────────────────────────────────────┤
│                                        │
│          Full Page Preview             │
│                                        │
└────────────────────────────────────────┘
```

---

## Technical Implementation

### Files to Modify

#### 1. `src/components/admin/landing-page-editor/themeUtils.ts`

Add new function:

```typescript
export function generateCheckoutPreviewHTML(
  config: CheckoutConfig,
  themeConfig: ThemeConfig
): string {
  // Returns static HTML matching CheckoutSection appearance
  // Uses theme CSS variables for styling
  return `
    <section class="py-12 px-4 bg-gray-50" id="checkout">
      <div class="container max-w-md mx-auto">
        <div class="rounded-theme bg-white border shadow-sm p-6">
          <h2 class="font-heading text-2xl text-primary mb-4 text-center">
            ${config.title}
          </h2>
          <!-- Product placeholder -->
          <div class="mb-6 p-4 rounded-theme bg-gray-50 border">
            <div class="w-full h-32 bg-gray-200 rounded mb-3 flex items-center justify-center text-gray-400">
              Product Image
            </div>
            <div class="flex justify-between">
              <span class="font-body">Product Name</span>
              <span class="font-digit text-primary font-bold">৳XXX</span>
            </div>
          </div>
          <!-- Form fields preview -->
          <div class="space-y-3">
            <input class="w-full rounded-theme border px-3 py-2" placeholder="আপনার নাম" disabled />
            <input class="w-full rounded-theme border px-3 py-2" placeholder="মোবাইল নম্বর" disabled />
            <input class="w-full rounded-theme border px-3 py-2" placeholder="ডেলিভারি ঠিকানা" disabled />
            <input class="w-full rounded-theme border px-3 py-2" placeholder="শহর/জেলা" disabled />
          </div>
          <button class="w-full mt-4 bg-primary text-white py-3 rounded-theme font-button font-semibold">
            ${config.ctaText}
          </button>
        </div>
      </div>
    </section>
  `;
}
```

#### 2. `src/components/admin/landing-page-editor/SectionEditor.tsx`

- Add `viewMode` state: `'preview' | 'code'`
- Add Preview/HTML toggle buttons in toolbar
- Render iframe with single section HTML when in preview mode
- Pass themeConfig as new prop

```typescript
interface SectionEditorProps {
  section: Section | null;
  themeConfig: ThemeConfig; // New prop
  onSave: (data) => void;
  isSaving: boolean;
}
```

#### 3. `src/components/admin/landing-page-editor/CheckoutEditor.tsx`

- Add similar Preview/Code toggle
- In preview mode, show rendered checkout form using `generateCheckoutPreviewHTML`
- Uses actual config values for live preview

#### 4. `src/components/admin/landing-page-editor/FullPagePreview.tsx`

- Add `refreshKey` state
- Add Refresh button with `RefreshCw` icon
- Update section HTML generation to use `generateCheckoutPreviewHTML` for checkout sections

```typescript
// Generate HTML for sections (handle checkout type)
const sectionsHtml = sortedSections.map((s) => {
  if (s.type === 'checkout') {
    return generateCheckoutPreviewHTML(s.config, themeConfig);
  }
  return s.html;
}).join('\n');
```

#### 5. `src/components/admin/landing-page-editor/SectionBuilder.tsx`

- Pass `themeConfig` to `SectionEditor` and `CheckoutEditor`
- Update props interface

---

## Summary Table

| Component | Change |
|-----------|--------|
| `themeUtils.ts` | Add `generateCheckoutPreviewHTML()` function |
| `SectionEditor.tsx` | Add Preview/Code toggle, individual section preview |
| `CheckoutEditor.tsx` | Add Preview/Code toggle, themed checkout preview |
| `FullPagePreview.tsx` | Add refresh button, handle checkout sections in preview |
| `SectionBuilder.tsx` | Pass themeConfig to editor components |

---

## User Experience Flow

1. **HTML Section Edit**: User selects section → sees Preview tab by default → can switch to HTML tab to edit code
2. **Checkout Section Edit**: User selects checkout → sees form preview with theme → can switch to Code view for config JSON
3. **Global Preview**: User clicks "Preview" in right panel → sees full page → can click 🔄 to refresh after changes
4. **Checkout in Global Preview**: Checkout section renders as styled form (not empty)

