

# Image Gallery Picker Modal

Products পেজে একটি ইমেজ গ্যালারি সিলেক্টর মডাল যোগ করা হবে যেখানে দুটি অপশন থাকবে:
1. **Gallery থেকে সিলেক্ট** - মিডিয়া লাইব্রেরি থেকে ইমেজ বাছাই
2. **Instant Upload** - সরাসরি নতুন ইমেজ আপলোড করে সিলেক্ট

---

## পরিবর্তন সমূহ

### 1. নতুন Component তৈরি - `MediaPickerDialog`

একটি reusable মডাল কম্পোনেন্ট তৈরি হবে:

```text
+--------------------------------------------------+
|  Select Image                              [X]   |
+--------------------------------------------------+
| [Gallery]  [Upload]                              |
+--------------------------------------------------+
| Folder: [All Files ▼]                            |
+--------------------------------------------------+
|  +-------+  +-------+  +-------+  +-------+      |
|  | IMG 1 |  | IMG 2 |  | IMG 3 |  | IMG 4 |      |
|  +-------+  +-------+  +-------+  +-------+      |
|  +-------+  +-------+                            |
|  | IMG 5 |  | IMG 6 |                            |
|  +-------+  +-------+                            |
+--------------------------------------------------+
|                              [Cancel]  [Select]  |
+--------------------------------------------------+
```

**Features:**
- **Tabs**: Gallery / Upload দুটি ট্যাব থাকবে
- **Gallery Tab**: মিডিয়া ডাটাবেস থেকে ইমেজ লোড, ফোল্ডার ফিল্টার, ক্লিক করে সিলেক্ট
- **Upload Tab**: ফাইল ড্র্যাগ-এন্ড-ড্রপ বা বাটন দিয়ে আপলোড, আপলোড শেষে অটো সিলেক্ট
- **Multi-select**: একাধিক ইমেজ সিলেক্ট করার সুবিধা
- **Preview**: সিলেক্টেড ইমেজ হাইলাইট হবে

### 2. Products.tsx আপডেট

**বর্তমান (URL Input):**
```tsx
<Input placeholder="Image URL" value={imageInput} ... />
<Button onClick={addImage}>Add</Button>
```

**নতুন (Gallery Button + URL Input):**
```tsx
<div className="flex gap-2">
  <Button onClick={openGalleryModal}>
    <Image /> Gallery
  </Button>
  <Input placeholder="অথবা URL পেস্ট করুন" ... />
  <Button onClick={addImage}>Add</Button>
</div>
```

### 3. ইমেজ প্রিভিউ উন্নতি

সিলেক্টেড ইমেজ গুলো থাম্বনেইল সহ দেখাবে:

```text
+--------+  +--------+  +--------+
| [IMG]  |  | [IMG]  |  | [IMG]  |
| url... |  | url... |  | url... |
|   [X]  |  |   [X]  |  |   [X]  |
+--------+  +--------+  +--------+
```

---

## Technical Details

### MediaPickerDialog Component Props

```typescript
interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (urls: string[]) => void;
  multiple?: boolean; // default: true
  accept?: 'image' | 'video' | 'all'; // default: 'image'
}
```

### Data Flow

1. User clicks "Gallery" button → Modal opens
2. User can:
   - Browse existing media from `media` table
   - Filter by folder
   - Select one or multiple images
   - OR switch to Upload tab and upload new file
3. On upload complete → File added to `media` table with public URL
4. User clicks "Select" → `onSelect([selected_urls])` callback fires
5. Products form updates with new image URLs

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/admin/MediaPickerDialog.tsx` | **Create** - New reusable modal component |
| `src/pages/admin/Products.tsx` | **Modify** - Add gallery button and integrate modal |

---

## User Experience

1. **Gallery সিলেক্ট করতে**: Gallery বাটন → ইমেজ ক্লিক → Select বাটন
2. **Instant আপলোড করতে**: Gallery বাটন → Upload ট্যাব → ফাইল সিলেক্ট → অটো সিলেক্ট হয়ে যাবে
3. **URL দিয়ে Add করতে**: আগের মতোই URL পেস্ট → Add বাটন (এটাও থাকবে)

