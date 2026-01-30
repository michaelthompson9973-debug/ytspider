

# Compression Speed Optimization - Background Processing

## সমস্যা Analysis

Edge Function logs থেকে দেখা যাচ্ছে:
- **7.3MB PNG → 1.09MB** (85% reduction) নিচ্ছে ~3-4 সেকেন্ড
- প্রতিটা ইমেজে সময় লাগছে কারণ:
  1. Edge Function cold start (~30ms)
  2. imagescript library dynamic import
  3. Image decode → resize → encode (CPU intensive)
  4. Storage upload
  5. Database insert

## সমাধান: Two-Phase Upload

```text
বর্তমান (Slow):
User → Upload → [Edge: Compress + Upload + DB] → Response → Show Image
                     ▲
                     └── Admin waits here (3-4 sec per image)

নতুন (Fast):
User → Upload → [Edge: Quick Upload] → Response → Show Image (instant!)
                     │
                     └──→ [Background: Compress + Replace] → Update UI
                              (Admin continues working)
```

## Implementation Steps

### Step 1: Edge Function Update
`supabase/functions/optimize-image/index.ts`

```typescript
// Option A: Return immediately, compress in background
EdgeRuntime.waitUntil(compressAndReplace(file, filePath));
return new Response(JSON.stringify({ 
  success: true, 
  status: 'processing',
  temp_url: tempUrl 
}));
```

অথবা

### Step 2: Client-Side Quick Upload + Background Compression

**আরো সহজ approach:**
1. ছোট ইমেজ (<500KB) → Direct compression (fast)
2. বড় ইমেজ (>500KB) → Quick upload first, then background compress

### Step 3: Hook Update
`src/hooks/useBulkUpload.ts`

```typescript
// For large files, upload first, compress later
if (file.size > 500 * 1024) { // > 500KB
  // Quick upload to storage
  const tempUrl = await quickUpload(file);
  updateFile(id, { status: 'done', url: tempUrl });
  
  // Background compression (non-blocking)
  triggerBackgroundCompression(file.id);
} else {
  // Small files: inline compression (already fast)
  await optimizeAndUpload(file);
}
```

## Simpler Solution: Client-Side Pre-compression

Browser-এ compression করলে:
- Edge Function call কমবে
- Network data কমবে
- Faster overall

**browser-image-compression** library দিয়ে:

```typescript
import imageCompression from 'browser-image-compression';

const compressedFile = await imageCompression(file, {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
  useWebWorker: true, // Non-blocking!
});
// Then upload the already-compressed file
```

## প্রস্তাবিত পদক্ষেপ

| Option | Speed | Complexity | Recommendation |
|--------|-------|------------|----------------|
| A. Client-side compression | ⚡⚡⚡ | Low | ✅ Best for UX |
| B. Background Edge Function | ⚡⚡ | Medium | Good alternative |
| C. Current (sync) | ⚡ | Done | Too slow |

## Implementation Plan

### Option A: Browser-side compression (Recommended)

1. **Install library:**
   ```bash
   npm install browser-image-compression
   ```

2. **Update `useBulkUpload.ts`:**
   - Compress in browser using Web Worker (non-blocking)
   - Upload pre-compressed file to storage
   - Skip Edge Function for compression

3. **Benefits:**
   - 3x faster (no network round-trip for compression)
   - Non-blocking (Web Worker)
   - Less Edge Function calls
   - Lower bandwidth usage

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add `browser-image-compression` |
| `src/hooks/useBulkUpload.ts` | Add client-side compression |
| `src/hooks/useImageOptimizer.ts` | Add client-side compression |
| Keep Edge Function | For manual compress button (existing images) |

## Expected Result

- **আগে:** 7MB ইমেজ → 3-4 সেকেন্ড wait
- **পরে:** 7MB ইমেজ → ~1 সেকেন্ড (browser compress) + instant upload

