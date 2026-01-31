
# Library Picker Modal - Multi-Select এবং Preview সহ

## বর্তমান অবস্থা
- `LibraryPickerModal` শুধুমাত্র একটি component select করতে দেয়
- Component preview নেই - শুধু name ও category দেখায়
- `useSections` hook একটি করে section add করে

## পরিবর্তনের পরিকল্পনা

### 1. LibraryPickerModal আপডেট
**ফাইল:** `src/components/admin/library/LibraryPickerModal.tsx`

পরিবর্তন:
- Single selection (`useState<LibraryComponent | null>`) থেকে multi-select (`useState<Set<string>>`) এ পরিবর্তন
- প্রতিটি component card এ **Checkbox** যোগ
- প্রতিটি card এ **iframe preview** যোগ (ComponentCard এর মত)
- `onSelect` callback পরিবর্তন করে array of components পাঠাবে
- Footer এ selected count দেখাবে: "৩টি সিলেক্টেড"
- "Select All" ও "Clear All" বাটন যোগ

**নতুন UI Layout:**
```text
+------------------------------------------+
| 🔍 Search...          | [Category ▼]     |
+------------------------------------------+
| ☐ Select All                 Clear All   |
+------------------------------------------+
| +----------------+ +----------------+     |
| |   [Preview]    | |   [Preview]    |    |
| | ☑ হিরো - সেন্ট | | ☐ হিরো - স্প্  |    |
| |   hero         | |   hero         |     |
| +----------------+ +----------------+     |
| +----------------+ +----------------+     |
| |   [Preview]    | |   [Preview]    |    |
| | ☐ ফিচার্স     | | ☐ প্রাইসিং    |     |
| |   features     | |   pricing      |     |
| +----------------+ +----------------+     |
+------------------------------------------+
| [Cancel]          ৩টি সিলেক্টেড [Add]   |
+------------------------------------------+
```

### 2. useSections Hook আপডেট
**ফাইল:** `src/components/admin/landing-page-editor/useSections.ts`

পরিবর্তন:
- নতুন `addMultipleSections` mutation যোগ যা একসাথে একাধিক section insert করবে
- Sort order sequential হবে প্রতিটি নতুন section এর জন্য

### 3. SectionList আপডেট
**ফাইল:** `src/components/admin/landing-page-editor/SectionList.tsx`

পরিবর্তন:
- `LibraryPickerModal` এর `onSelect` handler আপডেট
- Single component এর বদলে array handle করবে
- নতুন `addMultipleSections` function ব্যবহার করবে

### 4. Props Interface আপডেট

```typescript
// LibraryPickerModal props
interface LibraryPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (components: LibraryComponent[]) => void; // Changed: single -> array
}

// SectionList props - add new function
onAddMultipleSections?: (data: Array<{ name: string; html: string; type: SectionType; config: unknown }>) => void;
```

## টেকনিক্যাল ডিটেইলস

### Preview iframe (Google Fonts সহ)
```html
<iframe 
  srcDoc={previewHtml}
  className="aspect-video w-full"
  sandbox="allow-scripts allow-same-origin"
/>
```
- Hind Siliguri হেডিং এ
- Anek Bangla বডিতে
- Tailwind CDN
- Scale 0.25 for thumbnail

### Multi-select State
```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

const toggleSelect = (id: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};

const handleSelectAll = () => {
  setSelectedIds(new Set(filteredComponents.map(c => c.id)));
};

const handleClearAll = () => {
  setSelectedIds(new Set());
};
```

### Bulk Insert (useSections)
```typescript
const addMultipleSectionsMutation = useMutation({
  mutationFn: async (items: Array<{ name: string; html: string; type: SectionType; config: unknown }>) => {
    const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) : -1;
    
    const insertData = items.map((item, index) => ({
      landing_page_id: landingPageId,
      name: item.name,
      html: item.html,
      type: item.type,
      config: item.config as Json,
      sort_order: maxOrder + 1 + index,
    }));

    const { data, error } = await supabase
      .from('landing_page_sections')
      .insert(insertData)
      .select();
      
    if (error) throw error;
    return data;
  },
});
```

## ফাইল পরিবর্তন সারাংশ

| ফাইল | পরিবর্তন |
|------|---------|
| `LibraryPickerModal.tsx` | Multi-select, preview, Select All/Clear |
| `useSections.ts` | `addMultipleSections` mutation যোগ |
| `SectionList.tsx` | Handler আপডেট for multi-select |

## ফলাফল
- ইউজার একসাথে একাধিক component select করতে পারবে
- প্রতিটি component এ preview থাকবে
- "Add" বাটনে ক্লিক করলে সব সিলেক্টেড component section হিসেবে যোগ হবে
- চাইলে একটা select করেও add করতে পারবে
