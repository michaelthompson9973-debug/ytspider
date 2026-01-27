
# Multiple Products in Landing Page - Implementation Plan

## বর্তমান সিস্টেম

বর্তমানে একটা Landing Page এ শুধুমাত্র **একটি প্রোডাক্ট** লিংক করা যায়:
- `landing_pages` টেবিলে একটি `product_id` column আছে
- Checkout Section এ সেই single product দেখায়
- Order এ single product save হয়

## প্রস্তাবিত সমাধান

### নতুন UI Design - List Type Products

```text
┌─────────────────────────────────────────────────────────────────┐
│  🛒 Product List                                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [IMG] │ Product Name 1         │ ৳550   │ [-] 1 [+]        ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ [IMG] │ Product Name 2         │ ৳450   │ [-] 2 [+]        ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ [IMG] │ Product Name 3         │ ৳350   │ [-] 0 [+]        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Subtotal:     ৳1,450                                          │
│  Delivery:     ৳60                                              │
│  ─────────────────────────────────                              │
│  Total:        ৳1,510                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Changes

### 1. নতুন Junction Table: `landing_page_products`

```sql
CREATE TABLE public.landing_page_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    landing_page_id uuid NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sort_order integer NOT NULL DEFAULT 0,
    default_quantity integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(landing_page_id, product_id)
);

-- RLS Policies
ALTER TABLE landing_page_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage landing_page_products"
  ON landing_page_products FOR ALL USING (is_admin());

CREATE POLICY "Public can view products of published pages"
  ON landing_page_products FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM landing_pages lp 
      WHERE lp.id = landing_page_products.landing_page_id 
      AND (lp.published = true OR is_admin())
    )
  );
```

### 2. নতুন Table: `order_items` (Multiple Products per Order)

```sql
CREATE TABLE public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    product_name text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    unit_price numeric NOT NULL,
    subtotal numeric NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view order items"
  ON order_items FOR SELECT USING (is_admin());

CREATE POLICY "Anyone can insert order items"
  ON order_items FOR INSERT WITH CHECK (true);
```

---

## Component Changes

### 1. Admin Panel - Product Selection UI

**File: `src/components/admin/landing-page-editor/ProductsPanel.tsx` (নতুন)**

Multiple product selection panel যেখানে:
- Available products থেকে select করা যাবে
- Drag & Drop দিয়ে reorder করা যাবে
- প্রতিটা product এর default quantity সেট করা যাবে

```typescript
interface LandingPageProduct {
  id: string;
  product_id: string;
  sort_order: number;
  default_quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
}
```

### 2. Checkout Section - Multi-Product Cart

**File: `src/components/landing/CheckoutSection.tsx` (পরিবর্তন)**

Current single product UI এর বদলে Product List UI:

```typescript
interface CartItem {
  product: Product;
  quantity: number;
}

// State for multiple products
const [cart, setCart] = useState<CartItem[]>([]);

// Calculate total from all cart items
const subtotal = cart.reduce((sum, item) => 
  sum + (item.product.price * item.quantity), 0
);
```

### 3. Product List Component

**File: `src/components/landing/ProductList.tsx` (নতুন)**

```text
┌──────────────────────────────────────────────────────────────┐
│  Product Item                                                │
│  ┌──────┐                                                    │
│  │ IMG  │  Product Name                    ৳550              │
│  │ 60x60│  ────────────────────────────────────────          │
│  └──────┘  [ - ]   2   [ + ]                                 │
└──────────────────────────────────────────────────────────────┘
```

Component Features:
- Thumbnail image (square, 60x60)
- Product name
- Price with currency symbol
- Quantity controls (-, +)
- Real-time subtotal calculation

### 4. Order Storage Changes

**File: `src/components/landing/CheckoutSection.tsx`**

Order submit করার সময়:
1. প্রথমে `orders` টেবিলে main order create
2. তারপর `order_items` টেবিলে প্রতিটা product এর জন্য row insert

```typescript
// Insert main order
const { data: orderData } = await supabase
  .from('orders')
  .insert({
    landing_page_id: landingPageId,
    customer_name: form.customer_name,
    // ... other customer details
    subtotal: totalSubtotal,
    delivery_charge: delivery,
    total: grandTotal,
  })
  .select('id')
  .single();

// Insert order items
const orderItems = cart
  .filter(item => item.quantity > 0)
  .map(item => ({
    order_id: orderData.id,
    product_id: item.product.id,
    product_name: item.product.name,
    quantity: item.quantity,
    unit_price: item.product.price,
    subtotal: item.product.price * item.quantity,
  }));

await supabase.from('order_items').insert(orderItems);
```

---

## Files to Create/Edit

| File | Action | Description |
|------|--------|-------------|
| `migration` | Create | Database tables: `landing_page_products`, `order_items` |
| `src/components/admin/landing-page-editor/ProductsPanel.tsx` | Create | Admin UI for selecting multiple products |
| `src/components/admin/landing-page-editor/useProducts.ts` | Create | Hook for managing landing page products |
| `src/components/landing/ProductList.tsx` | Create | Public-facing product list with quantity controls |
| `src/components/landing/CheckoutSection.tsx` | Edit | Support multiple products cart |
| `src/pages/LandingPage.tsx` | Edit | Fetch multiple products instead of single |
| `src/components/admin/landing-page-editor/SectionBuilder.tsx` | Edit | Add Products tab |
| `src/pages/admin/Orders.tsx` | Edit | Show order items in order details |

---

## Expected Results

Implementation এর পরে:

1. **Admin Panel**
   - Landing Page Settings এ multiple product select করা যাবে
   - Products tab এ drag & drop reorder
   - প্রতিটা product এর default quantity সেট করা যাবে

2. **Public Checkout Page**
   - Product list UI (Image | Name | Price | Quantity)
   - প্রতিটা product এর quantity individually control
   - Real-time total calculation
   - Multiple products একসাথে order করা যাবে

3. **Orders Admin**
   - Order details এ সব products দেখাবে
   - Individual product quantities এবং prices

---

## Technical Notes

### Backward Compatibility

- পুরাতন `landing_pages.product_id` রাখা হবে (legacy support)
- যদি `landing_page_products` empty হয় কিন্তু `product_id` আছে, তাহলে single product mode
- Migration এ existing product_id গুলো automatically `landing_page_products` এ copy হবে

### Performance Considerations

- Products fetch করার সময় একটাই query ব্যবহার করা হবে (join)
- Cart state localStorage এ cache করা যেতে পারে
- Images lazy load হবে
