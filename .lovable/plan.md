

# Delivery Charge & Free Shipping Implementation Plan

Landing page এ delivery charge এবং free shipping লজিক যোগ করা হবে - Theme settings থেকে সম্পূর্ণ আলাদাভাবে।

---

## Database Changes

### 1. নতুন Table তৈরি: `landing_page_checkout_settings`

```sql
-- Create delivery mode enum
CREATE TYPE delivery_mode AS ENUM ('flat', 'conditional', 'free');

-- Create checkout settings table
CREATE TABLE landing_page_checkout_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id uuid NOT NULL UNIQUE REFERENCES landing_pages(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'BDT',
  delivery_mode delivery_mode NOT NULL DEFAULT 'flat',
  delivery_amount numeric NOT NULL DEFAULT 0,
  free_over_amount numeric DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add updated_at trigger
CREATE TRIGGER update_landing_page_checkout_settings_updated_at
  BEFORE UPDATE ON landing_page_checkout_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE landing_page_checkout_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage checkout settings"
  ON landing_page_checkout_settings FOR ALL
  USING (is_admin());

CREATE POLICY "Anyone can view checkout settings of published pages"
  ON landing_page_checkout_settings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM landing_pages lp
    WHERE lp.id = landing_page_checkout_settings.landing_page_id
    AND (lp.published = true OR is_admin())
  ));
```

### 2. Orders Table Extension

```sql
-- Add pricing columns to orders table
ALTER TABLE orders
ADD COLUMN quantity integer NOT NULL DEFAULT 1,
ADD COLUMN unit_price numeric DEFAULT NULL,
ADD COLUMN subtotal numeric DEFAULT NULL,
ADD COLUMN delivery_charge numeric DEFAULT NULL,
ADD COLUMN total numeric DEFAULT NULL,
ADD COLUMN currency text DEFAULT 'BDT';
```

---

## File Changes

### 1. নতুন Types যোগ করা (`types.ts`)

```typescript
export type DeliveryMode = 'flat' | 'conditional' | 'free';

export interface CheckoutSettings {
  id: string;
  landing_page_id: string;
  currency: string;
  delivery_mode: DeliveryMode;
  delivery_amount: number;
  free_over_amount: number | null;
  created_at: string;
  updated_at: string;
}

export const defaultCheckoutSettings: Omit<CheckoutSettings, 'id' | 'landing_page_id' | 'created_at' | 'updated_at'> = {
  currency: 'BDT',
  delivery_mode: 'flat',
  delivery_amount: 60,
  free_over_amount: null,
};

export const currencyOptions = [
  { value: 'BDT', label: '৳ BDT', symbol: '৳' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'INR', label: '₹ INR', symbol: '₹' },
];

export const deliveryModeOptions = [
  { value: 'flat', label: 'Flat Charge', description: 'Fixed delivery fee for all orders' },
  { value: 'conditional', label: 'Free Above Amount', description: 'Free delivery if order exceeds threshold' },
  { value: 'free', label: 'Always Free', description: 'No delivery charge' },
];
```

### 2. নতুন Hook তৈরি: `useCheckoutSettings.ts`

```typescript
// Similar pattern to useTheme.ts
export function useCheckoutSettings(landingPageId: string | null) {
  // Fetch checkout settings
  // Save checkout settings (upsert)
  // Return { settings, isLoading, saveSettings, isSaving }
}
```

### 3. নতুন Component: `CheckoutSettingsPanel.tsx`

Admin panel for configuring checkout settings:

```text
+--------------------------------------------------+
| Checkout Settings                         [Save] |
+--------------------------------------------------+
| Currency                                         |
| [৳ BDT ▼]                                        |
+--------------------------------------------------+
| Delivery Mode                                    |
| [Flat Charge ▼]                                  |
+--------------------------------------------------+
| Delivery Amount                                  |
| [৳] [60____]                                     |
+--------------------------------------------------+
| (If conditional selected)                        |
| Free Shipping Above                              |
| [৳] [500___]                                     |
+--------------------------------------------------+
| Preview                                          |
| ┌────────────────────────────────────────────┐   |
| │ Subtotal:        ৳500                      │   |
| │ Delivery:        ৳60                       │   |
| │ Total:           ৳560                      │   |
| └────────────────────────────────────────────┘   |
+--------------------------------------------------+
```

### 4. SectionBuilder Update

Add new tab for Checkout Settings:

**Desktop Header:**
```tsx
<Button onClick={() => setRightPanel('preview')}>Preview</Button>
<Button onClick={() => setRightPanel('theme')}>Theme</Button>
<Button onClick={() => setRightPanel('checkout')}>Checkout</Button>  // NEW
```

**Mobile Navigation:**
Add new tab: `{ id: 'checkout', label: 'Checkout', icon: ShoppingCart }`

### 5. CheckoutSection Update

Update the checkout component to:

1. **Fetch checkout settings** from `landing_page_checkout_settings`
2. **Add quantity selector** (optional, simple +/- buttons)
3. **Calculate pricing:**
   ```typescript
   const calculateTotals = (qty: number, unitPrice: number, settings: CheckoutSettings) => {
     const subtotal = qty * unitPrice;
     let delivery = 0;
     
     switch (settings.delivery_mode) {
       case 'free':
         delivery = 0;
         break;
       case 'flat':
         delivery = settings.delivery_amount;
         break;
       case 'conditional':
         delivery = subtotal >= (settings.free_over_amount || 0) 
           ? 0 
           : settings.delivery_amount;
         break;
     }
     
     return { subtotal, delivery, total: subtotal + delivery };
   };
   ```

4. **Display breakdown UI:**
   ```text
   ┌─────────────────────────────────────┐
   │ Product Name                        │
   │                                     │
   │ Quantity:    [-] 2 [+]              │
   │                                     │
   │ ─────────────────────────────────── │
   │ সাবটোটাল:           ৳1,000          │
   │ ডেলিভারি চার্জ:       ৳0 (ফ্রি!)    │
   │ ─────────────────────────────────── │
   │ সর্বমোট:             ৳1,000         │
   └─────────────────────────────────────┘
   ```

5. **Update order submission** to include:
   ```typescript
   await supabase.from('orders').insert({
     // ... existing fields
     quantity,
     unit_price: product.price,
     subtotal,
     delivery_charge: delivery,
     total,
     currency: settings.currency,
   });
   ```

### 6. Track Conversion Update

Update purchase event to include new fields:

```typescript
pushDataLayer('purchase', {
  transaction_id: eventId,
  value: total,           // Changed from price to total
  subtotal,               // NEW
  shipping: delivery,     // NEW
  currency: settings.currency,
  items: [{
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    quantity,             // NEW
  }],
});
```

### 7. Orders Admin Update

Display new columns:

| Customer | Phone | City | Product | Qty | Subtotal | Delivery | Total | Status |
|----------|-------|------|---------|-----|----------|----------|-------|--------|
| John     | 017.. | Dhaka| Oil     | 2   | ৳1,000   | ৳60      | ৳1,060| New    |

Update CSV export to include new columns.

---

## Component Structure

```text
src/
├── components/
│   └── admin/
│       └── landing-page-editor/
│           ├── types.ts                    (update - add CheckoutSettings)
│           ├── SectionBuilder.tsx          (update - add Checkout tab)
│           ├── MobileNavigation.tsx        (update - add Checkout tab)
│           ├── CheckoutSettingsPanel.tsx   (create)
│           └── useCheckoutSettings.ts      (create)
│   └── landing/
│       └── CheckoutSection.tsx             (update - pricing logic)
└── pages/
    └── admin/
        └── Orders.tsx                      (update - show totals)
```

---

## Data Flow

```text
[Admin: Set Checkout Settings]
       ↓
[landing_page_checkout_settings table]
       ↓
[Public: CheckoutSection loads settings]
       ↓
[User: Changes quantity]
       ↓
[Live calculation: subtotal + delivery = total]
       ↓
[User: Submits order]
       ↓
[orders table: quantity, subtotal, delivery_charge, total]
       ↓
[track-conversion: value=total, shipping=delivery]
       ↓
[Admin: Orders page shows breakdown]
```

---

## Pricing Logic Summary

| Mode        | Delivery Calculation                                    |
|-------------|--------------------------------------------------------|
| `free`      | `delivery = 0`                                         |
| `flat`      | `delivery = delivery_amount`                           |
| `conditional` | `delivery = subtotal >= free_over_amount ? 0 : delivery_amount` |

---

## Files to Create

| File | Description |
|------|-------------|
| `src/components/admin/landing-page-editor/CheckoutSettingsPanel.tsx` | Admin UI for checkout settings |
| `src/components/admin/landing-page-editor/useCheckoutSettings.ts` | Hook for CRUD checkout settings |

## Files to Modify

| File | Changes |
|------|---------|
| `types.ts` | Add `CheckoutSettings`, `DeliveryMode` types |
| `SectionBuilder.tsx` | Add Checkout Settings tab |
| `MobileNavigation.tsx` | Add Checkout tab (5th tab) |
| `CheckoutSection.tsx` | Add pricing logic, quantity, breakdown UI |
| `Orders.tsx` | Show qty, subtotal, delivery, total columns |
| `index.ts` | Export new components |

---

## Theme Separation

**Theme Panel** (visual only):
- Primary color
- Background color
- Fonts (heading, body, button, digit)
- Button style
- Border radius
- Container width

**Checkout Settings** (business logic only):
- Currency
- Delivery mode
- Delivery amount
- Free shipping threshold

NO overlap between the two!

---

## Summary

1. **DB Migration**: New `landing_page_checkout_settings` table + extend `orders` table
2. **Admin UI**: New Checkout Settings tab in Section Builder
3. **Pricing Logic**: Calculate subtotal + delivery = total
4. **Checkout UI**: Show breakdown with quantity selector
5. **Orders**: Store and display all pricing fields
6. **Tracking**: Include shipping and subtotal in events

