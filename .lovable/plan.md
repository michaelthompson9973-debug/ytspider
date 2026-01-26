
# Checkout Field Editor & Dynamic Product Preview Plan

## সমস্যার বিশ্লেষণ

### সমস্যা ১: Checkout Field Editor নেই
বর্তমানে CheckoutEditor শুধু title, ctaText, এবং enabled fields সম্পাদনা করতে দেয়। ফর্ম ফিল্ড (নাম, ফোন, ঠিকানা, শহর) গুলো হার্ডকোডেড এবং কাস্টমাইজ করা যায় না।

### সমস্যা ২: Product Preview Static
Checkout preview তে "Product Name" এবং "৳XXX" placeholder দেখায়। আসল product data (নাম, দাম, ছবি) দেখায় না।

### সমস্যা ৩: Database তে Product Link আছে কিন্তু Preview তে দেখাচ্ছে না
`landing_pages.product_id = a4d2e594...` সঠিকভাবে linked আছে, কিন্তু `CheckoutEditor` এবং `generateCheckoutPreviewHTML()` এই data fetch করছে না।

---

## সমাধান

### পরিবর্তন ১: CheckoutConfig Type এ Fields Array যোগ

```typescript
// types.ts
export interface CheckoutField {
  id: string;
  name: string;           // field name (customer_name, custom_field_1)
  type: 'text' | 'tel' | 'email' | 'textarea';
  label: string;          // "আপনার নাম"
  placeholder: string;    // "সম্পূর্ণ নাম লিখুন"
  required: boolean;
  enabled: boolean;
}

export interface CheckoutConfig {
  title: string;
  ctaText: string;
  enabled: boolean;
  fields: CheckoutField[];  // নতুন
}

export const defaultCheckoutFields: CheckoutField[] = [
  { id: 'name', name: 'customer_name', type: 'text', label: 'আপনার নাম', placeholder: 'সম্পূর্ণ নাম লিখুন', required: true, enabled: true },
  { id: 'phone', name: 'customer_phone', type: 'tel', label: 'মোবাইল নম্বর', placeholder: '01XXXXXXXXX', required: true, enabled: true },
  { id: 'address', name: 'customer_address', type: 'text', label: 'ডেলিভারি ঠিকানা', placeholder: 'বাড়ি নং, রাস্তা, এলাকা', required: true, enabled: true },
  { id: 'city', name: 'customer_city', type: 'text', label: 'শহর/জেলা', placeholder: 'ঢাকা', required: true, enabled: true },
];
```

### পরিবর্তন ২: CheckoutEditor এ Field Editor যোগ

Settings tab এ Field Editor section যোগ হবে:

```text
┌──────────────────────────────────────────┐
│  Section Name: [Order Form    ] [Save]   │
├──────────────────────────────────────────┤
│  [Preview] [Settings]                    │
├──────────────────────────────────────────┤
│  Form Title: [অর্ডার করুন            ]   │
│  Submit Button: [অর্ডার সম্পন্ন করুন   ]   │
│  ☑ Enable Checkout                       │
│                                          │
│  ─────── Form Fields ───────             │
│                                          │
│  ☑ আপনার নাম                    [Edit]   │
│    Label: [আপনার নাম          ]          │
│    Placeholder: [সম্পূর্ণ নাম লিখুন]       │
│                                          │
│  ☑ মোবাইল নম্বর                  [Edit]   │
│  ☑ ডেলিভারি ঠিকানা               [Edit]   │
│  ☑ শহর/জেলা                     [Edit]   │
│                                          │
│  [+ Add Custom Field]                    │
└──────────────────────────────────────────┘
```

### পরিবর্তন ৩: CheckoutEditor এ Product Data Fetch

CheckoutEditor component এ linked product fetch করতে হবে:

```typescript
// CheckoutEditor.tsx
const { data: linkedProduct } = useQuery({
  queryKey: ['linked-product', landingPageId],
  queryFn: async () => {
    const { data: lp } = await supabase
      .from('landing_pages')
      .select('product_id')
      .eq('id', landingPageId)
      .maybeSingle();
    
    if (!lp?.product_id) return null;
    
    const { data: product } = await supabase
      .from('products')
      .select('id, name, price, images')
      .eq('id', lp.product_id)
      .maybeSingle();
    
    return product;
  },
});
```

### পরিবর্তন ৪: generateCheckoutPreviewHTML() এ Product Data Pass

```typescript
export function generateCheckoutPreviewHTML(
  config: CheckoutConfig = defaultCheckoutConfig,
  themeConfig: ThemeConfig = defaultThemeConfig,
  product?: { name: string; price: number; images?: string[] } | null,  // নতুন
  checkoutSettings?: { currency: string; delivery_amount: number } | null  // নতুন
): string {
  const currencySymbol = '৳';
  const productName = product?.name || 'Product Name';
  const productPrice = product?.price || 0;
  const productImage = product?.images?.[0] || null;
  const deliveryAmount = checkoutSettings?.delivery_amount || 60;
  
  // Dynamic HTML with actual product data
  return `...`;
}
```

### পরিবর্তন ৫: SectionBuilder থেকে Props Pass

```typescript
// SectionBuilder.tsx
<CheckoutEditor
  section={activeSection}
  themeConfig={themeConfig}
  landingPageId={landingPageId}  // নতুন - product fetch করার জন্য
  onSave={...}
  isSaving={isUpdating}
/>
```

### পরিবর্তন ৬: CheckoutSection (Public) এ Dynamic Fields Support

```typescript
// CheckoutSection.tsx
// config.fields থেকে dynamic fields render করবে
{config.fields?.filter(f => f.enabled).map(field => (
  <div key={field.id} className="space-y-2">
    <label>{field.label}</label>
    <input
      type={field.type}
      placeholder={field.placeholder}
      required={field.required}
      value={form[field.name]}
      onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
    />
  </div>
))}
```

---

## Technical Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `types.ts` | Add `CheckoutField` interface, update `CheckoutConfig` |
| `CheckoutEditor.tsx` | Add field editor UI, fetch product data, pass to preview |
| `themeUtils.ts` | Update `generateCheckoutPreviewHTML()` to accept product data |
| `SectionBuilder.tsx` | Pass `landingPageId` to `CheckoutEditor` |
| `CheckoutSection.tsx` | Render dynamic fields from config |
| `FullPagePreview.tsx` | Pass product data to checkout preview generation |

### New Component: FieldEditor

```typescript
interface FieldEditorProps {
  field: CheckoutField;
  onChange: (field: CheckoutField) => void;
  onRemove?: () => void;
  isDefault?: boolean;
}

export function FieldEditor({ field, onChange, onRemove, isDefault }: FieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between">
        <Switch checked={field.enabled} onCheckedChange={(enabled) => onChange({ ...field, enabled })} />
        <span className="flex-1 ml-2">{field.label}</span>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
          <ChevronDown className={cn("h-4 w-4", isExpanded && "rotate-180")} />
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-3 space-y-3">
          <div>
            <Label>Label</Label>
            <Input value={field.label} onChange={(e) => onChange({ ...field, label: e.target.value })} />
          </div>
          <div>
            <Label>Placeholder</Label>
            <Input value={field.placeholder} onChange={(e) => onChange({ ...field, placeholder: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={field.required} onCheckedChange={(required) => onChange({ ...field, required })} />
            <Label>Required</Label>
          </div>
          {!isDefault && onRemove && (
            <Button variant="destructive" size="sm" onClick={onRemove}>Remove Field</Button>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Data Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                        SectionBuilder                           │
│                                                                 │
│  landingPageId ──────────────────────────────────────────────┐ │
│                                                               │ │
│  ┌───────────────┐    ┌────────────────────────────────────┐ │ │
│  │  SectionList  │    │         CheckoutEditor             │ │ │
│  │               │    │                                    │ │ │
│  │  - Add        │    │  landingPageId ─┐                  │ │ │
│  │  - Reorder    │    │                 ↓                  │ │ │
│  │  - Delete     │    │  useQuery(product) ─┐              │ │ │
│  │               │    │                     ↓              │ │ │
│  └───────────────┘    │  useQuery(checkout-settings)       │ │ │
│                       │                     ↓              │ │ │
│                       │  generateCheckoutPreviewHTML(      │ │ │
│                       │    config,                         │ │ │
│                       │    themeConfig,                    │ │ │
│                       │    product,     ← Dynamic!         │ │ │
│                       │    settings     ← Dynamic!         │ │ │
│                       │  )                                 │ │ │
│                       │                                    │ │ │
│                       │  FieldEditor × N                   │ │ │
│                       │    - Label input                   │ │ │
│                       │    - Placeholder input             │ │ │
│                       │    - Required toggle               │ │ │
│                       │    - Enable/Disable toggle         │ │ │
│                       └────────────────────────────────────┘ │ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary of Changes

1. **CheckoutField Type** - নতুন type যোগ করা হবে যাতে প্রতিটি ফিল্ডের label, placeholder, required, enabled সেভ করা যায়
2. **CheckoutEditor Update** - Field editor UI যোগ করা হবে যেখানে প্রতিটি ফিল্ড edit করা যাবে
3. **Product Data Fetch** - CheckoutEditor এ linked product এর তথ্য fetch করা হবে
4. **Dynamic Preview** - Preview তে আসল product name, price, image দেখাবে
5. **Public Checkout** - CheckoutSection dynamic fields render করবে config থেকে
6. **Custom Fields** - Admin চাইলে custom field যোগ করতে পারবে (optional feature)
