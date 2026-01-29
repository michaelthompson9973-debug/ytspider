
# Font Loading Consistency Fix - Plan

## Current Status
Screenshot-এ দেখা যাচ্ছে যে fonts **এখন কাজ করছে** - "অর্ডার করুন", "পরিমাণ:", "ডেলিভারি এলাকা:" সব Bangla text সঠিকভাবে render হচ্ছে।

## তবে Code-এ Inconsistency আছে

`generateThemeCSS` function-এ `baseUrl` parameter support করা হয়েছে, কিন্তু:

1. **`generatePreviewHTML`** (line 268) - `baseUrl` pass করছে না
2. **`generateFullHTML`** (line 211) - `baseUrl` pass করছে না

বর্তমানে এটা কাজ করছে কারণ `getLocalFontFacesCSS` function-এ fallback আছে:
```javascript
const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
```

## Recommended Fix

সব জায়গায় explicitly `baseUrl` pass করা উচিত reliability নিশ্চিত করতে:

### Step 1: Update `generatePreviewHTML`
```typescript
export function generatePreviewHTML(
  sectionsHtml: string, 
  themeConfig: ThemeConfig,
  baseUrl?: string  // Add optional parameter
): string {
  const fontImports = getGoogleFontsImports(themeConfig);
  const themeCSS = generateThemeCSS(themeConfig, baseUrl);  // Pass baseUrl
  // ...
}
```

### Step 2: Update `generateFullHTML`
```typescript
export function generateFullHTML(
  sectionsHtml: string, 
  themeConfig: ThemeConfig, 
  gtmId?: string,
  baseUrl?: string  // Add optional parameter
): string {
  const fontImports = getGoogleFontsImports(themeConfig);
  const themeCSS = generateThemeCSS(themeConfig, baseUrl);  // Pass baseUrl
  // ...
}
```

### Step 3: Update Calling Components
All preview components should pass `window.location.origin`:
- `SectionPreview.tsx`
- `SectionEditor.tsx`
- `FullPagePreview.tsx`
- `FullscreenPreviewModal.tsx`
- `CheckoutEditor.tsx`

---

## Technical Details

| File | Line | Change |
|------|------|--------|
| themeUtils.ts | 263-268 | Add `baseUrl` param to `generatePreviewHTML` |
| themeUtils.ts | 205-211 | Add `baseUrl` param to `generateFullHTML` |
| SectionPreview.tsx | 30 | Pass `window.location.origin` |
| SectionEditor.tsx | 42 | Pass `window.location.origin` |
| FullPagePreview.tsx | 144 | Pass `window.location.origin` |
| FullscreenPreviewModal.tsx | 137 | Pass `window.location.origin` |
| CheckoutEditor.tsx | 125 | Pass `window.location.origin` |

## Optional: Host Poppins Locally
Poppins font (digit font) এখনো Google Fonts থেকে load হচ্ছে। সম্পূর্ণ self-hosting এর জন্য Poppins-ও locally host করা যায়।
