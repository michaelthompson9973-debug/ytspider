
# রেডিমেড কম্পোনেন্ট লাইব্রেরি

## বর্তমান অবস্থা
- Landing Pages একটা single menu item (`/admin/pages`)
- সেকশন তৈরি করতে হলে blank section থেকে শুরু করতে হয়
- কোনো pre-built component/template নেই

## প্রস্তাবিত সমাধান

### Navigation Structure

```text
Content
├── Products
├── Landing Pages ▾
│   ├── 📚 Library     ← রেডিমেড কম্পোনেন্ট
│   └── 📄 Pages       ← বর্তমান page management
└── Media
```

### Library Page UI

```text
┌─────────────────────────────────────────────────────────────────┐
│  Component Library                        [+ Add Component]     │
├─────────────────────────────────────────────────────────────────┤
│  Filter: [All ▾] [Hero ▾] [Features ▾] [CTA ▾] [FAQ ▾]          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │   ┌─────────┐    │  │   ┌─────────┐    │  │   ┌─────────┐  │ │
│  │   │ Preview │    │  │   │ Preview │    │  │   │ Preview │  │ │
│  │   │  Image  │    │  │   │  Image  │    │  │   │  Image  │  │ │
│  │   └─────────┘    │  │   └─────────┘    │  │   └─────────┘  │ │
│  │   Hero Modern    │  │   Feature Grid   │  │   CTA Banner   │ │
│  │   ───────────    │  │   ────────────   │  │   ──────────   │ │
│  │   [👁 Preview]   │  │   [👁 Preview]   │  │   [👁 Preview] │ │
│  │   [✏ Edit]       │  │   [✏ Edit]       │  │   [✏ Edit]     │ │
│  │   [🗑 Delete]    │  │   [🗑 Delete]    │  │   [🗑 Delete]  │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### কিভাবে কাজ করবে

| Feature | Description |
|---------|-------------|
| **Add to Library** | Admin নিজের তৈরি section save করতে পারবে library-তে |
| **Categories** | Hero, Features, CTA, FAQ, Testimonial, Footer ইত্যাদি |
| **Preview** | Component এর live preview দেখা যাবে |
| **Use in Page** | Section Builder থেকে library-র component insert করা যাবে |
| **Edit/Clone** | Library component edit বা duplicate করা যাবে |

---

## Implementation Steps

### Phase 1: Database Setup

**নতুন table: `component_library`**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Component name |
| category | text | Hero, Features, CTA, etc. |
| html | text | HTML content |
| thumbnail_url | text | Preview image (optional) |
| created_by | uuid | User reference |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### Phase 2: Navigation Update

**AdminSidebar.tsx পরিবর্তন:**

```typescript
{
  href: '/admin/pages',
  label: 'Landing Pages',
  icon: FileText,
  children: [
    { href: '/admin/pages/library', label: 'Library', icon: BookOpen },
    { href: '/admin/pages/manage', label: 'Pages', icon: FileText },
  ]
}
```

### Phase 3: New Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/pages` | Redirect | → `/admin/pages/manage` |
| `/admin/pages/manage` | `LandingPages.tsx` | বর্তমান page management |
| `/admin/pages/library` | `ComponentLibrary.tsx` | নতুন component library |

### Phase 4: Component Library Page

**নতুন file: `src/pages/admin/ComponentLibrary.tsx`**

Features:
- Grid view of all components
- Category filter
- Add new component (name, category, HTML editor)
- Edit component
- Delete component
- Preview modal
- Copy HTML to clipboard

### Phase 5: Section Builder Integration

**SectionList.tsx পরিবর্তন:**

Add Section Dialog-এ নতুন option:
- "From Library" button → Library modal open হবে
- Component select করলে সেটার HTML দিয়ে section তৈরি হবে

```text
┌──────────────────────────────────────────┐
│  Add New Section                         │
├──────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐        │
│  │  HTML       │  │  Checkout   │        │
│  │  Section    │  │  Section    │        │
│  └─────────────┘  └─────────────┘        │
│                                          │
│  ─────────── OR ───────────             │
│                                          │
│  [📚 Choose from Library]  ← নতুন        │
└──────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/admin/ComponentLibrary.tsx` | Create - Library page |
| `src/components/admin/library/ComponentCard.tsx` | Create - Grid card |
| `src/components/admin/library/ComponentEditor.tsx` | Create - Add/Edit dialog |
| `src/components/admin/library/LibraryPickerModal.tsx` | Create - For Section Builder |
| `src/components/admin/AdminSidebar.tsx` | Modify - Add dropdown |
| `src/components/admin/landing-page-editor/SectionList.tsx` | Modify - Add "From Library" |
| `src/App.tsx` | Modify - Add routes |

---

## Default Components (Pre-seeded)

প্রথমবার deploy করার সময় কিছু default component seed করা হবে:

| Category | Component Examples |
|----------|-------------------|
| **Hero** | Simple Hero, Video Hero, Split Hero |
| **Features** | 3-Column Grid, Icon Features, Alternating |
| **CTA** | Banner CTA, Inline CTA, Floating CTA |
| **FAQ** | Accordion FAQ, Grid FAQ |
| **Testimonial** | Slider, Grid, Single Quote |
| **Footer** | Simple Footer, Multi-column |

---

## Technical Details

### Database Migration

```sql
CREATE TABLE component_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  html TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE component_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read components"
  ON component_library FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert components"
  ON component_library FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own components"
  ON component_library FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own components"
  ON component_library FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
```

### Category Options

```typescript
export const componentCategories = [
  { value: 'hero', label: 'Hero' },
  { value: 'features', label: 'Features' },
  { value: 'cta', label: 'CTA' },
  { value: 'faq', label: 'FAQ' },
  { value: 'testimonial', label: 'Testimonial' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'footer', label: 'Footer' },
  { value: 'general', label: 'General' },
];
```

---

## Expected Result

- Landing Pages menu dropdown হবে Library ও Pages সহ
- Library page-এ সব saved component দেখা যাবে
- Category অনুযায়ী filter করা যাবে
- নতুন component add/edit/delete করা যাবে
- Section Builder থেকে library component use করা যাবে
- কিছু default component pre-loaded থাকবে

