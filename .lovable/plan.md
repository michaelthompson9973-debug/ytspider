
# Shop তৈরি ও Multi-tenant Data Isolation বাস্তবায়ন

## সমস্যা বিশ্লেষণ

বর্তমানে:
- Shop তৈরি হলে শুধু `shops` ও `shop_members` টেবিলে ডেটা যায়
- **Products, Orders, Landing Pages, Media** ইত্যাদি পেজগুলো `shop_id` ফিল্টার ছাড়া সব ডেটা দেখায়
- নতুন ডেটা insert করার সময় `shop_id` যোগ হচ্ছে না

## লক্ষ্য

প্রতিটি Shop এর নিজস্ব আলাদা:
- Products
- Orders  
- Landing Pages
- Media
- Tracking Profiles
- API Keys
- Courier Credentials
- Allowed Domains
- Component Library
- AI Training Data
- Messenger Connections
- এবং আরও অনেক কিছু

---

## প্রযুক্তিগত পরিবর্তন

### ১. useShopQuery Hook ব্যবহার করা

বর্তমানে `useShopQuery` hook আছে কিন্তু ব্যবহার হচ্ছে না। এটি ব্যবহার করে সব queries shop-aware করতে হবে।

```typescript
// আগে (Products.tsx)
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    const { data } = await supabase.from('products').select('*');
    return data;
  },
});

// পরে (shop-aware)
const { data: products } = useShopQuery(
  ['products'],
  async (shopId) => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId);
    return data;
  }
);
```

### ২. Insert Operations এ shop_id যোগ করা

```typescript
// Products insert - আগে
const { error } = await supabase.from('products').insert([{
  name: data.name,
  price: data.price,
  // shop_id নেই!
}]);

// পরে
const { error } = await supabase.from('products').insert([{
  name: data.name,
  price: data.price,
  shop_id: currentShop.id, // যোগ করা হবে
}]);
```

### ৩. পেজ-ভিত্তিক পরিবর্তন

| পেজ | Query পরিবর্তন | Insert পরিবর্তন |
|-----|---------------|-----------------|
| `Products.tsx` | `.eq('shop_id', shopId)` | `shop_id` যোগ |
| `Orders.tsx` | `.eq('shop_id', shopId)` | N/A (public insert) |
| `LandingPages.tsx` | `.eq('shop_id', shopId)` | `shop_id` যোগ |
| `Media.tsx` | `.eq('shop_id', shopId)` | `shop_id` যোগ |
| `TrackingProfiles.tsx` | `.eq('shop_id', shopId)` | `shop_id` যোগ |
| `ApiAi.tsx` | `.eq('shop_id', shopId)` | `shop_id` যোগ |
| `ApiCourier.tsx` | `.eq('shop_id', shopId)` | `shop_id` যোগ |
| `AllowedDomains.tsx` | `.eq('shop_id', shopId)` | `shop_id` যোগ |
| `ComponentLibrary.tsx` | `.eq('shop_id', shopId)` | `shop_id` যোগ |
| `ApiMessenger.tsx` | `.eq('shop_id', shopId)` | `shop_id` যোগ |
| `InboxMessenger.tsx` | `.eq('shop_id', shopId)` | N/A |
| `Dashboard.tsx` | `.eq('shop_id', shopId)` | N/A |

### ৪. Shop তৈরির সময় কিছু default ডেটা (ঐচ্ছিক)

```typescript
// ShopContext.tsx - createShop function এ
const createShop = async (name: string): Promise<Shop> => {
  // 1. Shop তৈরি
  const { data: shop } = await supabase.from('shops').insert({...}).select().single();
  
  // 2. Shop member হিসেবে owner যোগ
  await supabase.from('shop_members').insert({...});
  
  // 3. (ঐচ্ছিক) Default tracking profile বা অন্য কিছু তৈরি
  // await supabase.from('tracking_profiles').insert({
  //   shop_id: shop.id,
  //   name: 'Default Profile',
  //   is_active: true,
  // });
  
  return shop;
};
```

### ৫. "No Shop Selected" Guard Component

যখন shop নির্বাচন করা নেই তখন একটি সুন্দর UI দেখানো:

```tsx
// নতুন component: ShopGuard.tsx
export function ShopGuard({ children }: { children: React.ReactNode }) {
  const { currentShop, isLoading } = useShop();
  
  if (isLoading) return <LoadingSkeleton />;
  
  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Store className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2>কোনো শপ নির্বাচন করা হয়নি</h2>
        <p>উপরের মেনু থেকে একটি শপ নির্বাচন করুন বা নতুন শপ তৈরি করুন</p>
      </div>
    );
  }
  
  return children;
}
```

---

## ফাইল পরিবর্তন তালিকা

### নতুন ফাইল তৈরি
| ফাইল | উদ্দেশ্য |
|------|---------|
| `src/components/admin/ShopGuard.tsx` | Shop না থাকলে fallback UI দেখানো |

### বিদ্যমান ফাইল আপডেট
| ফাইল | পরিবর্তন |
|------|---------|
| `src/pages/admin/Products.tsx` | useShop ব্যবহার, query ও insert এ shop_id |
| `src/pages/admin/Orders.tsx` | Query এ shop_id ফিল্টার |
| `src/pages/admin/LandingPages.tsx` | useShop ব্যবহার, query ও insert এ shop_id |
| `src/pages/admin/Media.tsx` | useShop ব্যবহার, query ও insert এ shop_id |
| `src/pages/admin/TrackingProfiles.tsx` | useShop ব্যবহার, query ও insert এ shop_id |
| `src/pages/admin/ApiAi.tsx` | useShop ব্যবহার, query ও insert এ shop_id |
| `src/pages/admin/ApiCourier.tsx` | useShop ব্যবহার, query ও insert এ shop_id |
| `src/pages/admin/AllowedDomains.tsx` | useShop ব্যবহার, query ও insert এ shop_id |
| `src/pages/admin/ComponentLibrary.tsx` | useShop ব্যবহার, query ও insert এ shop_id |
| `src/pages/admin/ApiMessenger.tsx` | useShop ব্যবহার, query ও insert এ shop_id |
| `src/pages/admin/InboxMessenger.tsx` | Query এ shop_id ফিল্টার |
| `src/pages/admin/Dashboard.tsx` | Query এ shop_id ফিল্টার |
| `src/hooks/useBulkUpload.ts` | shop_id parameter যোগ |
| `src/hooks/useTrackingProfiles.ts` | shop_id ফিল্টার |
| `src/hooks/useCourierCredentials.ts` | shop_id ফিল্টার |
| `src/components/admin/MediaPickerDialog.tsx` | shop_id ফিল্টার |

---

## উদাহরণ: Products.tsx পরিবর্তন

```typescript
// আগে
export default function Products() {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*')
        .order('created_at', { ascending: false });
      return data;
    },
  });
  
  // Insert
  const { error } = await supabase.from('products').insert([{
    name: data.name,
    price: data.price,
  }]);
}

// পরে
export default function Products() {
  const { currentShop } = useShop();
  
  const { data: products } = useQuery({
    queryKey: ['products', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      const { data } = await supabase.from('products')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });
      return data;
    },
    enabled: !!currentShop,
  });
  
  // Insert
  const { error } = await supabase.from('products').insert([{
    name: data.name,
    price: data.price,
    shop_id: currentShop.id, // নতুন যোগ
  }]);
  
  // Shop না থাকলে fallback
  if (!currentShop) {
    return (
      <AdminLayout>
        <ShopGuard>
          <div />
        </ShopGuard>
      </AdminLayout>
    );
  }
}
```

---

## বাস্তবায়ন ধাপ

### Phase 1: Core Infrastructure
1. `ShopGuard.tsx` কম্পোনেন্ট তৈরি
2. Products.tsx আপডেট (টেমপ্লেট হিসেবে)

### Phase 2: Content Pages
3. LandingPages.tsx আপডেট
4. Media.tsx আপডেট
5. ComponentLibrary.tsx আপডেট

### Phase 3: Operations Pages
6. Orders.tsx আপডেট
7. Dashboard.tsx আপডেট

### Phase 4: API & Settings Pages
8. ApiAi.tsx আপডেট
9. ApiCourier.tsx আপডেট
10. AllowedDomains.tsx আপডেট
11. TrackingProfiles.tsx আপডেট

### Phase 5: Messenger Pages
12. ApiMessenger.tsx আপডেট
13. InboxMessenger.tsx আপডেট

### Phase 6: Hooks & Utilities
14. useBulkUpload.ts আপডেট
15. useTrackingProfiles.ts আপডেট
16. useCourierCredentials.ts আপডেট
17. MediaPickerDialog.tsx আপডেট

---

## ফলাফল

এই পরিবর্তনের পর:
- ✅ প্রতিটি শপ শুধু নিজের ডেটা দেখতে পাবে
- ✅ নতুন ডেটা সঠিক shop_id সহ সংরক্ষিত হবে
- ✅ Shop switch করলে সঠিক ডেটা লোড হবে
- ✅ Shop না থাকলে সুন্দর fallback UI দেখাবে
- ✅ True multi-tenant isolation নিশ্চিত হবে
