

# নতুন Checkout Section ডিজাইন Implementation পরিকল্পনা

## বর্তমান অবস্থা

এখন `CheckoutSection.tsx` একটি React component-based checkout ব্যবহার করে যেখানে:
- `ProductList.tsx` দিয়ে প্রোডাক্ট দেখানো হয়
- Form fields dynamically generate হয়
- Price calculation JavaScript এ হয়

## আপনার নতুন ডিজাইন

আপনি একটি সম্পূর্ণ HTML-based checkout চান যেখানে:
- **Package Cards** - Radio button দিয়ে প্রোডাক্ট সিলেক্ট
- **Size Options** - ডাইনামিক সাইজ selector
- **3-Column Layout** - Product (2 col) + Summary (1 col)
- **Sticky Order Summary** - ডান পাশে fixed
- **Quantity per Product** - প্রতিটি প্রোডাক্টে আলাদা quantity
- **Free Delivery Banner** - সবুজ গ্র্যাডিয়েন্ট ব্যানার

---

## Implementation Approach: Hybrid Strategy

আপনার HTML ডিজাইন হুবহু রাখতে হলে দুটি অপশন আছে:

### Option A: React Component Rewrite (সুপারিশকৃত)

`CheckoutSection.tsx` কে নতুন করে লেখা হবে আপনার HTML structure অনুযায়ী, কিন্তু:
- React state management রাখা হবে (order submission, validation)
- Database integration ঠিক থাকবে
- GA4/GTM tracking কাজ করবে

### Option B: Raw HTML Section Type

একটি নতুন section type `html-checkout` তৈরি করা যেখানে:
- আপনি raw HTML paste করতে পারবেন
- JavaScript include করতে পারবেন
- কিন্তু order submission custom handle করতে হবে

---

## সুপারিশ: Option A (React Component Rewrite)

নতুন `CheckoutSection.tsx` তৈরি করা হবে যা আপনার ডিজাইন হুবহু follow করবে:

```text
┌─────────────────────────────────────────────────────────────────┐
│                     অর্ডার করতে নিচের ফর্মে...                   │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────┐  ┌────────────────────────┐ │
│ │                                 │  │                        │ │
│ │   PACKAGE SELECTION CARDS       │  │   ORDER SUMMARY        │ │
│ │   ────────────────────────      │  │   (Sticky)             │ │
│ │   [●] ৩ পিস প্যান্ট ৳550        │  │                        │ │
│ │   [ ] ৪ পিস প্যান্ট ৳700        │  │   [Product Image]      │ │
│ │   [ ] ৫ পিস প্যান্ট ৳850        │  │   Product Name × 1     │ │
│ │                                 │  │   ───────────────      │ │
│ │   ┌─ সাইজ বাছাই করুন ─┐        │  │   Subtotal: ৳550      │ │
│ │   │ (●) ০-৩ মাস       │        │  │   Delivery: ফ্রি       │ │
│ │   │ ( ) ৩-১৫ মাস      │        │  │   ───────────────      │ │
│ │   │ ( ) ১৫-৩৬ মাস     │        │  │   সর্বমোট: ৳550       │ │
│ │   └───────────────────┘        │  │                        │ │
│ │                                 │  │  [Free Delivery Banner]│ │
│ │   ┌─ ডেলিভারি তথ্য ─────────┐  │  │                        │ │
│ │   │ আপনার নাম: [_______]   │  │  │  [অর্ডার কনফার্ম করুন] │ │
│ │   │ মোবাইল: [_______]      │  │  │        ৳550            │ │
│ │   │ ঠিকানা: [_______]      │  │  │                        │ │
│ │   └────────────────────────┘  │  │                        │ │
│ └─────────────────────────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## ফাইল পরিবর্তনসমূহ

| ফাইল | পরিবর্তন |
|------|----------|
| `src/components/landing/CheckoutSection.tsx` | সম্পূর্ণ নতুন করে লেখা হবে আপনার HTML অনুযায়ী |
| `src/components/admin/landing-page-editor/themeUtils.ts` | `generateCheckoutPreviewHTML()` আপডেট করতে হবে |

---

## নতুন Features যা যোগ হবে

1. **Package Card Selection** - Radio button দিয়ে প্রোডাক্ট select
2. **Per-Product Quantity** - প্রতিটি প্রোডাক্টে +/- button
3. **Size Options** - Product এর সাথে linked size selector
4. **Sticky Summary** - Desktop এ ডান পাশে fixed
5. **Free Delivery Banner** - সবুজ gradient banner
6. **3-Column Grid** - Desktop এ 2:1 ratio layout

---

## Technical Details

### New State Management

```typescript
interface PackageSelection {
  productId: string;
  quantity: number;
  size?: string;
}

const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
const [quantities, setQuantities] = useState<Record<string, number>>({});
const [selectedSize, setSelectedSize] = useState<string | null>(null);
```

### CSS Classes (Tailwind)

```css
/* Package Card */
.package-card-label {
  @apply relative p-3 bg-white border border-gray-200 rounded-xl 
         flex items-center gap-3 cursor-pointer transition-all 
         duration-150 hover:border-primary/60;
}

.package-card-label.selected {
  @apply border-primary bg-primary/5;
}

/* Radio Indicator */
.radio-indicator {
  @apply absolute left-2 top-2 w-5 h-5 bg-white border-2 
         border-primary rounded-full flex items-center justify-center;
}
```

### Order Summary Dynamic Update

```typescript
const updateSummary = useCallback(() => {
  const selectedProduct = products.find(p => p.id === selectedPackage);
  if (!selectedProduct) return;
  
  const quantity = quantities[selectedPackage] || 1;
  const subtotal = selectedProduct.price * quantity;
  const deliveryCharge = isFreeDelivery ? 0 : settings.delivery_amount;
  const total = subtotal + deliveryCharge;
  
  return { subtotal, deliveryCharge, total };
}, [selectedPackage, quantities, products, settings]);
```

---

## Database Considerations

Size options এর জন্য database schema change লাগতে পারে:

```sql
-- Products table এ size_options column যোগ করা (optional)
ALTER TABLE products 
ADD COLUMN size_options jsonb DEFAULT NULL;

-- Example: [{"label": "০-৩ মাস", "value": "s"}, {"label": "৩-১৫ মাস", "value": "m"}]
```

অথবা আপাতত static size options রাখা যেতে পারে।

---

## Order Items Update

নতুন checkout এ multiple products একসাথে order করা যাবে না (single product selection), কিন্তু size ও quantity সেভ হবে:

```typescript
// Order insert এ size যোগ করা
const orderItem = {
  order_id: orderData.id,
  product_id: selectedPackage,
  product_name: selectedProduct.name,
  quantity: quantities[selectedPackage] || 1,
  unit_price: selectedProduct.price,
  subtotal: selectedProduct.price * quantity,
  size: selectedSize, // নতুন field
};
```

---

## সারাংশ

| বিষয় | বিবরণ |
|-------|-------|
| মূল পরিবর্তন | `CheckoutSection.tsx` সম্পূর্ণ নতুন করে লেখা |
| Design | আপনার HTML হুবহু React এ convert |
| State | Single product selection + quantity + size |
| Layout | 3-column grid with sticky summary |
| Database | সম্ভাব্য size_options column যোগ |
| Tracking | GA4/GTM tracking বহাল থাকবে |

