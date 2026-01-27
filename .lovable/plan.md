
# Order Form Enhancement Plan

## Overview

এই প্ল্যানে তিনটি major enhancement implement করা হবে:

1. **PC তে 2-Column Layout** - Desktop এ form এবং product info পাশাপাশি দেখাবে
2. **Local Font Preloading** - Google Fonts এর বদলে locally hosted fonts দিয়ে faster loading
3. **Delivery Zone System** - "Inside City" এবং "Outside City" আলাদা charge সেট করার ব্যবস্থা

---

## 1. Two-Column Layout (PC Version)

### Current State
- `CheckoutSection.tsx` এ সব content একটি single column (`max-w-md`) এ আছে
- Mobile এবং Desktop একই layout

### Proposed Layout (Desktop)
```text
┌─────────────────────────────────────────────────────────────────────┐
│                        অর্ডার করুন                                   │
├───────────────────────────────┬─────────────────────────────────────┤
│      LEFT COLUMN (50%)        │       RIGHT COLUMN (50%)            │
│                               │                                     │
│  ┌───────────────────────┐    │   ┌───────────────────────────┐    │
│  │   Product Image       │    │   │   আপনার নাম              │    │
│  │   Gallery             │    │   │   [input]                  │    │
│  └───────────────────────┘    │   │   মোবাইল নম্বর            │    │
│  Product Name    ৳ Price      │   │   [input]                  │    │
│                               │   │   ডেলিভারি এলাকা           │    │
│  পরিমাণ:    [-] 1 [+]         │   │   ◉ ঢাকার মধ্যে - ৳60     │    │
│                               │   │   ○ ঢাকার বাহিরে - ৳120   │    │
│  ─────────────────────────    │   │   ঠিকানা                   │    │
│  সাবটোটাল:        ৳1000       │   │   [input]                  │    │
│  ডেলিভারি:        ৳60         │   │   শহর/জেলা                 │    │
│  ─────────────────────────    │   │   [input]                  │    │
│  সর্বমোট:         ৳1060       │   │                            │    │
│                               │   │   [অর্ডার সম্পন্ন করুন]     │    │
│                               │   └───────────────────────────┘    │
└───────────────────────────────┴─────────────────────────────────────┘
```

### Mobile Layout (Unchanged)
- Single column, product on top, form below
- Use CSS `md:grid-cols-2` for responsive

### Files to Edit
- `src/components/landing/CheckoutSection.tsx`

---

## 2. Local Font Preloading

### Current State
- Fonts are loaded from Google Fonts CDN at runtime
- Extra network requests slow down initial paint
- Theme Panel dynamically injects `<link>` tags

### Proposed Solution

**Step 1: Host fonts locally in `/public/fonts/`**

Download and host these font files:
- Hind Siliguri (woff2)
- Anek Bangla (woff2)
- Inter (woff2)
- Poppins (woff2)

**Step 2: Preload critical fonts in `index.html`**

```html
<head>
  <!-- Font Preloading -->
  <link rel="preload" href="/fonts/hind-siliguri-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/poppins-regular.woff2" as="font" type="font/woff2" crossorigin>
  ...
</head>
```

**Step 3: Define @font-face in `src/index.css`**

```css
@font-face {
  font-family: 'Hind Siliguri';
  src: url('/fonts/hind-siliguri-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
/* ... more @font-face rules */
```

**Step 4: Update `themeUtils.ts`**

Remove Google Fonts CDN dependency and use local fonts instead.

### Files to Edit/Create
- `public/fonts/` (new folder with font files)
- `index.html` (add preload links)
- `src/index.css` (add @font-face rules)
- `src/components/admin/landing-page-editor/themeUtils.ts` (remove CDN logic)
- `src/components/admin/landing-page-editor/types.ts` (update font definitions)

---

## 3. Delivery Zone System

### Current State
- Single `delivery_amount` field in database
- No option for different zones
- Delivery modes: flat, conditional, free

### Proposed Database Changes

**Alter table `landing_page_checkout_settings`:**

```sql
-- Add new columns for zone-based delivery
ALTER TABLE landing_page_checkout_settings
ADD COLUMN inside_city_label text DEFAULT 'ঢাকার মধ্যে',
ADD COLUMN inside_city_amount numeric DEFAULT 60,
ADD COLUMN outside_city_label text DEFAULT 'ঢাকার বাহিরে',
ADD COLUMN outside_city_amount numeric DEFAULT 120;
```

### Updated Type Definitions

```typescript
export type DeliveryMode = 'flat' | 'conditional' | 'free' | 'zoned';

export interface CheckoutSettings {
  // ... existing fields
  delivery_mode: DeliveryMode;
  delivery_amount: number;
  free_over_amount: number | null;
  
  // New zone fields
  inside_city_label: string;
  inside_city_amount: number;
  outside_city_label: string;
  outside_city_amount: number;
}
```

### Admin UI Changes

Add new "Zone Based" delivery mode option:

```text
┌────────────────────────────────────────────────┐
│ Delivery Mode                                  │
│ [Dropdown: Flat / Conditional / Free / Zoned] │
├────────────────────────────────────────────────┤
│ (If "Zoned" selected)                          │
│                                                │
│ Inside City Label:                             │
│ [ঢাকার মধ্যে_______________________________] │
│                                                │
│ Inside City Amount:                            │
│ ৳ [60_______________________________________] │
│                                                │
│ Outside City Label:                            │
│ [ঢাকার বাহিরে______________________________] │
│                                                │
│ Outside City Amount:                           │
│ ৳ [120______________________________________] │
└────────────────────────────────────────────────┘
```

### Public Checkout UI Changes

Add radio buttons for zone selection:

```text
┌─────────────────────────────────────────────┐
│ ডেলিভারি এলাকা                               │
│                                             │
│ ◉ ঢাকার মধ্যে            ৳60               │
│ ○ ঢাকার বাহিরে           ৳120              │
└─────────────────────────────────────────────┘
```

### Updated Calculation Logic

```typescript
function calculateTotals(
  quantity: number,
  unitPrice: number,
  settings: CheckoutSettings,
  selectedZone?: 'inside' | 'outside' // NEW
): { subtotal: number; delivery: number; total: number } {
  const subtotal = quantity * unitPrice;
  let delivery = 0;

  switch (settings.delivery_mode) {
    case 'zoned':
      // Use zone-based pricing
      delivery = selectedZone === 'outside' 
        ? settings.outside_city_amount 
        : settings.inside_city_amount;
      break;
    // ... existing cases
  }

  return { subtotal, delivery, total: subtotal + delivery };
}
```

### Files to Edit
- `src/components/admin/landing-page-editor/types.ts` (update types)
- `src/components/admin/landing-page-editor/CheckoutSettingsPanel.tsx` (add zone UI)
- `src/components/admin/landing-page-editor/useCheckoutSettings.ts` (save new fields)
- `src/components/landing/CheckoutSection.tsx` (add zone selection + 2-column layout)
- `src/components/admin/landing-page-editor/themeUtils.ts` (update preview HTML)
- Database migration for new columns

---

## Implementation Order

1. **Database Migration** - Add new columns
2. **Types Update** - Update TypeScript types
3. **Admin Panel** - Update CheckoutSettingsPanel with zone inputs
4. **Public Checkout** - 
   - Add 2-column responsive layout
   - Add delivery zone radio buttons
   - Update calculation logic
5. **Font System** - Download fonts, add preload, update CSS
6. **Preview Update** - Update themeUtils.ts for accurate preview

---

## Technical Details

### Responsive Breakpoints
```css
/* Mobile first approach */
.checkout-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .checkout-grid {
    grid-template-columns: 1fr 1fr;
  }
}
```

### Font File Structure
```text
public/
└── fonts/
    ├── hind-siliguri-300.woff2
    ├── hind-siliguri-400.woff2
    ├── hind-siliguri-500.woff2
    ├── hind-siliguri-600.woff2
    ├── hind-siliguri-700.woff2
    ├── anek-bangla-400.woff2
    ├── anek-bangla-500.woff2
    ├── anek-bangla-600.woff2
    ├── inter-400.woff2
    ├── inter-500.woff2
    ├── inter-600.woff2
    └── poppins-400.woff2
```

### Zone Selection State
```typescript
const [selectedZone, setSelectedZone] = useState<'inside' | 'outside'>('inside');

// Include in order submission
const { error } = await supabase.from('orders').insert({
  // ... existing fields
  delivery_zone: selectedZone,
  delivery_charge: selectedZone === 'outside' 
    ? settings.outside_city_amount 
    : settings.inside_city_amount,
});
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | Add zone columns |
| `src/components/admin/landing-page-editor/types.ts` | Edit | Add zoned delivery type |
| `src/components/admin/landing-page-editor/CheckoutSettingsPanel.tsx` | Edit | Add zone configuration UI |
| `src/components/landing/CheckoutSection.tsx` | Edit | 2-column layout + zone radio buttons |
| `public/fonts/` | Create | Local font files |
| `index.html` | Edit | Add font preload links |
| `src/index.css` | Edit | Add @font-face rules |
| `src/components/admin/landing-page-editor/themeUtils.ts` | Edit | Update for local fonts + preview |

---

## Expected Results

After implementation:

1. **PC Layout**: Product info on left, form on right (2 columns)
2. **Mobile Layout**: Unchanged, single column
3. **Font Loading**: Instant font display with `font-display: swap`
4. **Delivery Options**: Customer can select "ঢাকার মধ্যে" বা "ঢাকার বাহিরে"
5. **Dynamic Pricing**: Total updates based on zone selection
6. **Admin Control**: Full customization of zone labels and prices

---

## Acceptance Criteria

- [ ] Desktop shows 2-column checkout layout
- [ ] Mobile remains single column
- [ ] Fonts are preloaded locally
- [ ] No Google Fonts network requests
- [ ] Admin can set zone labels and prices
- [ ] Customer can select delivery zone
- [ ] Order total updates dynamically
- [ ] Zone selection saved with order
- [ ] Preview matches live checkout
