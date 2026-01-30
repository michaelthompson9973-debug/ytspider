

# Bulk Upload System with Background Compression

## Overview
Media Library-তে একটি উন্নত bulk upload system তৈরি করা হবে যেখানে:
- Drag & drop দিয়ে অনেক ফাইল একসাথে আপলোড করা যাবে
- Compression background-এ হবে, admin কে wait করতে হবে না
- Real-time progress দেখা যাবে

## Current Issues (বর্তমান সমস্যা)

| সমস্যা | প্রভাব |
|--------|--------|
| Sequential upload | ১০টা ফাইলে ১০x সময় |
| Blocking UI | অন্য কাজ করা যায় না |
| No drag & drop | ফাইল select করা কঠিন |
| Sync compression | প্রতিটা ফাইলে wait |

## Solution Architecture

```text
+-------------------+     +------------------+     +-------------------+
|   Drag & Drop     | --> | Upload Queue     | --> | Background Worker |
|   Area            |     | (Parallel x3)    |     | (Edge Function)   |
+-------------------+     +------------------+     +-------------------+
         |                        |                        |
         v                        v                        v
+-------------------+     +------------------+     +-------------------+
| Visual Feedback   |     | Progress Tracker |     | DB Update         |
| (Drop zone)       |     | (Per-file %)     |     | (Realtime)        |
+-------------------+     +------------------+     +-------------------+
```

## Implementation Steps

### Step 1: Drag & Drop Zone Component
**নতুন ফাইল:** `src/components/admin/BulkUploadZone.tsx`
- Drag & drop area তৈরি
- Visual feedback (হাইলাইট যখন drag করা হয়)
- File validation (image/video only)
- Multiple file selection support

### Step 2: Parallel Upload Queue
**আপডেট:** `src/hooks/useImageOptimizer.ts`
- `Promise.all` দিয়ে parallel upload (3টা একসাথে)
- Individual file progress tracking
- Queue management system
- Non-blocking upload

### Step 3: Upload Progress UI
**নতুন ফাইল:** `src/components/admin/UploadProgressList.tsx`
- প্রতিটা ফাইলের জন্য আলাদা progress bar
- Status indicators: queued, uploading, compressing, done, error
- Cancel button for individual files
- Minimizable progress panel

### Step 4: Background Compression
**আপডেট:** `src/hooks/useImageOptimizer.ts`
- Upload আগে হবে (fast response)
- Compression পরে background-এ হবে
- Admin immediately UI ব্যবহার করতে পারবে
- Compression শেষ হলে notification

### Step 5: Media.tsx Integration
**আপডেট:** `src/pages/admin/Media.tsx`
- BulkUploadZone component integrate
- UploadProgressList component integrate
- Improved state management
- Real-time updates via refetch

## UI Design

```text
┌─────────────────────────────────────────────────────────┐
│  Media Library                        [+ New Folder]    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │     📁 Drag & drop files here                   │   │
│  │     or click to select                          │   │
│  │                                                  │   │
│  │     Supports: JPG, PNG, GIF, MP4, WebM          │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Uploading 5 files ─────────────────────────────┐   │
│  │  ✓ image1.jpg          12KB saved (85%)  [Done] │   │
│  │  ⚡ image2.png          Compressing...   [████░]│   │
│  │  ↑ image3.jpg          Uploading...     [██░░░]│   │
│  │  ⏳ image4.png          Queued           [░░░░░]│   │
│  │  ⏳ image5.jpg          Queued           [░░░░░]│   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Root ▼]                                               │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                       │
│  │ 🖼️  │ │ 🖼️  │ │ 🖼️  │ │ 🖼️  │                       │
│  └─────┘ └─────┘ └─────┘ └─────┘                       │
└─────────────────────────────────────────────────────────┘
```

## Technical Details

### Parallel Upload Logic
```typescript
// 3টা ফাইল একসাথে process করবে
const CONCURRENT_UPLOADS = 3;

async function processQueue(files: File[]) {
  const chunks = chunkArray(files, CONCURRENT_UPLOADS);
  for (const chunk of chunks) {
    await Promise.all(chunk.map(file => uploadFile(file)));
  }
}
```

### File State Types
```typescript
interface UploadingFile {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'compressing' | 'done' | 'error';
  progress: number;
  savedBytes?: number;
  error?: string;
}
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/BulkUploadZone.tsx` | Create | Drag & drop upload area |
| `src/components/admin/UploadProgressList.tsx` | Create | Progress tracking UI |
| `src/hooks/useImageOptimizer.ts` | Modify | Parallel + background processing |
| `src/pages/admin/Media.tsx` | Modify | Integrate new components |

## Benefits

- **3x faster uploads**: Parallel processing
- **No waiting**: Background compression
- **Better UX**: Drag & drop support
- **Clear feedback**: Per-file progress
- **Non-blocking**: Admin can continue working

