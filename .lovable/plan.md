

# ShopManage.tsx কে AllShops.tsx এ রূপান্তর - সব শপ লিস্ট দেখানো

## সমস্যা
বর্তমানে `ShopManage.tsx` পেজটি `currentShop` এর উপর নির্ভর করছে এবং shop selected না থাকলে "No shop selected" দেখায়। কিন্তু এটি `/admin/business/shops` route - যেখানে Super Admin সব শপ দেখবে।

## সমাধান
পেজটিকে সম্পূর্ণ রিফ্যাক্টর করে **সব শপের লিস্ট** দেখানো হবে।

## নতুন পেজ ডিজাইন

```text
┌────────────────────────────────────────────────────────────────────┐
│ 🏪 All Shops                                      [+ Create Shop] │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Shop Name     │ Owner       │ Plan       │ Status   │ Actions  │ │
│ ├───────────────┼─────────────┼────────────┼──────────┼──────────┤ │
│ │ 🏪 chaldal    │ owner@...   │ Pro        │ ✓ Active │ [⚙️] [🗑]│ │
│ │ 🏪 EcomX v2   │ admin@...   │ Free       │ ✓ Active │ [⚙️] [🗑]│ │
│ │ 🏪 My Store   │ user@...    │ Enterprise │ ○ Inactive│ [⚙️] [🗑]│ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ কোনো শপ না থাকলে:                                                  │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │            🏪                                                   │ │
│ │        No shops yet                                            │ │
│ │   Create your first shop to get started                        │ │
│ │              [+ Create Shop]                                   │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

## প্রযুক্তিগত পরিবর্তন

### 1. ফাইল রিনেম
```text
src/pages/admin/ShopManage.tsx → src/pages/admin/AllShops.tsx
```

### 2. ডেটা ফেচিং পরিবর্তন

**আগে (ভুল):**
```tsx
const { currentShop } = useShop();
// currentShop এর উপর নির্ভরশীল
if (!currentShop) return "No shop selected"
```

**পরে (সঠিক):**
```tsx
// সব শপ ফেচ করা (Super Admin view)
const { data: shops, isLoading } = useQuery({
  queryKey: ['all-shops'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
});
```

### 3. নতুন কম্পোনেন্ট স্ট্রাকচার

```tsx
export default function AllShops() {
  const { t } = useLanguage();
  const { data: shops, isLoading } = useQuery({...});
  
  return (
    <AdminLayout>
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1>{t('sidebar.allShops')}</h1>
          <p>Manage all shops in the system</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus /> Create Shop
        </Button>
      </div>
      
      {/* Shops Table */}
      {isLoading ? (
        <Skeleton />
      ) : shops?.length === 0 ? (
        <EmptyState />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shop Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shops.map((shop) => (
              <TableRow key={shop.id}>
                <TableCell>{shop.name}</TableCell>
                <TableCell>{shop.owner_id}</TableCell>
                <TableCell><Badge>{shop.plan}</Badge></TableCell>
                <TableCell>
                  <Switch checked={shop.is_active} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <Settings />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </AdminLayout>
  );
}
```

### 4. ফিচার যোগ করা

| ফিচার | বিবরণ |
|-------|-------|
| **Shop List** | সব শপের টেবিল view |
| **Create Shop** | নতুন শপ তৈরি করার ডায়ালগ |
| **Toggle Status** | শপ Active/Inactive করা |
| **Edit Shop** | শপ সেটিংস এডিট করা |
| **Delete Shop** | শপ ডিলিট করা (confirmation সহ) |
| **Empty State** | কোনো শপ না থাকলে সুন্দর UI |

### 5. App.tsx Route Update

```tsx
// Route unchanged but component import changes
<Route path="/admin/business/shops" element={
  <ProtectedRoute><AllShops /></ProtectedRoute>
} />
```

## ফাইল পরিবর্তন সারাংশ

| ফাইল | পরিবর্তন |
|------|---------|
| `src/pages/admin/ShopManage.tsx` | সম্পূর্ণ রিফ্যাক্টর করে AllShops হিসেবে, শপ লিস্ট টেবিল দেখানো |
| `src/App.tsx` | Import নাম আপডেট (যদি ফাইল rename করা হয়) |

## মূল পয়েন্ট
- এই পেজ **Super Admin এর জন্য** - সব শপ দেখবে ও ম্যানেজ করবে
- **Top bar এর Shop Switcher** হলো শুধু Quick Action - কোন পেজে কাজ করতে চাই সেটার জন্য
- এই পেজে `currentShop` এর দরকার নেই - সরাসরি `shops` টেবিল থেকে সব ডেটা আনবে

