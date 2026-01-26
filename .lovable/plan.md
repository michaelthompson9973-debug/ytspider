
# Checkout Section Implementation Plan

Landing page এ একটি নতুন checkout section type যোগ করা হবে যা HTML এর পরিবর্তে একটি system checkout component render করবে।

---

## Database Changes

### Migration: Add type and config columns

```sql
-- Add section type enum and columns
ALTER TABLE landing_page_sections 
ADD COLUMN type text NOT NULL DEFAULT 'html' CHECK (type IN ('html', 'checkout'));

ALTER TABLE landing_page_sections 
ADD COLUMN config jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN landing_page_sections.type IS 'Section type: html for raw HTML, checkout for system checkout form';
COMMENT ON COLUMN landing_page_sections.config IS 'Configuration for special section types like checkout';
```

---

## File Changes

### 1. Update Types (`src/components/admin/landing-page-editor/types.ts`)

```typescript
// Add new interfaces
export interface CheckoutConfig {
  title: string;
  ctaText: string;
  enabled: boolean;
}

export const defaultCheckoutConfig: CheckoutConfig = {
  title: 'অর্ডার করুন',
  ctaText: 'অর্ডার সম্পন্ন করুন',
  enabled: true,
};

// Update Section interface
export interface Section {
  id: string;
  landing_page_id: string;
  name: string;
  html: string;
  sort_order: number;
  created_at: string;
  type: 'html' | 'checkout';       // NEW
  config: CheckoutConfig | null;   // NEW
}
```

### 2. Update Section List (`SectionList.tsx`)

Add section type selection when adding:

```text
+--------------------------------------------------+
|  Add New Section                            [X]  |
+--------------------------------------------------+
| Section Type:                                    |
| [HTML Section]  [Checkout Section]               |
+--------------------------------------------------+
| Section Name: [_____________________]            |
+--------------------------------------------------+
|                           [Cancel]  [Add]        |
+--------------------------------------------------+
```

- HTML Section: Works as before with default HTML template
- Checkout Section: Creates with `type: 'checkout'` and default config

### 3. Update Section Editor (`SectionEditor.tsx`)

Show different UI based on `section.type`:

**For HTML sections (existing):**
- Section name input
- HTML textarea
- AI Enhance button

**For Checkout sections (new):**
```text
+--------------------------------------------------+
| Section Name: [Checkout]                  [Save] |
+--------------------------------------------------+
| Title                                            |
| [অর্ডার করুন________________________]            |
+--------------------------------------------------+
| Button Text                                      |
| [অর্ডার সম্পন্ন করুন___________________]         |
+--------------------------------------------------+
| [✓] Enable Checkout                              |
+--------------------------------------------------+
```

### 4. Create Checkout Component (`src/components/landing/CheckoutSection.tsx`)

A new component that renders the order form with theme integration:

```typescript
interface CheckoutSectionProps {
  config: CheckoutConfig;
  product: { id: string; name: string; price: number } | null;
  landingPageId: string;
  onOrderSuccess: (orderId: string) => void;
}
```

**Features:**
- Uses theme utility classes: `font-heading`, `font-body`, `font-button`, `text-primary`, `bg-primary`, `rounded-theme`
- Form fields: name, phone, address, city
- Loading state during submission
- Success message after order
- Validates with zod schema
- Submits to orders table
- Triggers tracking function

### 5. Update Landing Page Renderer (`LandingPage.tsx`)

Change section rendering logic:

```typescript
// Current (renders all as HTML)
const htmlContent = sections.map(s => s.html).join('\n');

// New (conditional rendering)
{sections.map(section => (
  section.type === 'checkout' ? (
    <CheckoutSection
      key={section.id}
      config={section.config as CheckoutConfig}
      product={page.products}
      landingPageId={page.id}
      onOrderSuccess={handleOrderSuccess}
    />
  ) : (
    <div 
      key={section.id}
      dangerouslySetInnerHTML={{ __html: section.html }} 
    />
  )
))}
```

Remove hardcoded order form at bottom (now handled by checkout section).

### 6. Update useSections Hook (`useSections.ts`)

Update mutations to include type and config:

```typescript
// addSectionMutation
const { data, error } = await supabase
  .from('landing_page_sections')
  .insert({
    landing_page_id: landingPageId,
    name,
    html,
    type,           // NEW
    config,         // NEW
    sort_order: maxOrder + 1,
  })
```

### 7. Update Theme Utils (`themeUtils.ts`)

Add `rounded-theme` utility class:

```css
.rounded-theme {
  border-radius: var(--theme-radius);
}
```

---

## Component Structure

```text
src/
├── components/
│   ├── admin/
│   │   └── landing-page-editor/
│   │       ├── types.ts              (update)
│   │       ├── SectionList.tsx       (update)
│   │       ├── SectionEditor.tsx     (update)
│   │       ├── useSections.ts        (update)
│   │       └── CheckoutEditor.tsx    (create)
│   └── landing/
│       └── CheckoutSection.tsx       (create)
└── pages/
    └── LandingPage.tsx               (update)
```

---

## Data Flow

```text
[Admin: Add Checkout Section]
       ↓
[SectionList: type='checkout', config={...}]
       ↓
[Database: landing_page_sections]
       ↓
[Public: LandingPage.tsx fetches sections]
       ↓
[Render: CheckoutSection component]
       ↓
[User: Fills form, submits]
       ↓
[Supabase: orders table]
       ↓
[Track: track-conversion function]
       ↓
[Admin: Orders page shows new order]
```

---

## Theme Integration

CheckoutSection will use ONLY theme utility classes:

| Element | Classes |
|---------|---------|
| Title | `font-heading text-primary` |
| Labels | `font-body` |
| Inputs | `font-body rounded-theme` |
| Button | `font-button bg-primary text-white rounded-theme` |
| Price | `font-digit text-primary` |

No inline colors or hardcoded fonts.

---

## Files to Create

| File | Description |
|------|-------------|
| `src/components/admin/landing-page-editor/CheckoutEditor.tsx` | Admin editor for checkout config |
| `src/components/landing/CheckoutSection.tsx` | Public checkout form component |

## Files to Modify

| File | Changes |
|------|---------|
| `types.ts` | Add CheckoutConfig interface, update Section |
| `SectionList.tsx` | Add section type selection in dialog |
| `SectionEditor.tsx` | Conditional rendering based on type |
| `useSections.ts` | Handle type and config in mutations |
| `themeUtils.ts` | Add rounded-theme class |
| `LandingPage.tsx` | Conditional section rendering, remove hardcoded form |

---

## Migration Summary

1. **DB Migration**: Add `type` and `config` columns
2. **Types**: Add `CheckoutConfig` interface
3. **Admin UI**: Section type selection + checkout editor
4. **Public UI**: CheckoutSection component with theme
5. **Rendering**: Conditional section rendering

---

## What This Does NOT Include

- Delivery pricing/charges
- Free shipping logic
- Custom CSS for checkout
- Multiple products per order
- Quantity editing (optional, simple implementation)
- GTM flow changes (uses existing)
