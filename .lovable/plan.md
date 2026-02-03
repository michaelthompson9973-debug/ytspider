
# Landing Pages Master Management Dashboard

## Overview
Landing Pages ম্যানেজমেন্ট পেজটিকে একটি professional, feature-rich ড্যাশবোর্ডে রূপান্তর করা হবে - আরো স্ট্যাটস কার্ড, কুইক অ্যাকশন বার, বাল্ক সিলেকশন, এবং উন্নত টাইপোগ্রাফি সহ।

## Current State
- ৩টি সিম্পল স্ট্যাটস কার্ড (Total, Published, Draft)
- সার্চ + গ্রিড/লিস্ট ভিউ টগল
- Individual কার্ড অ্যাকশন

## Proposed Changes

### 1. Enhanced Stats Cards (6 Cards)

```text
┌──────────────┬──────────────┬──────────────┐
│ 📄 মোট পেজ   │ 🌐 পাবলিশড  │ ✏️ ড্রাফট   │
│     12       │      8       │      4       │
└──────────────┴──────────────┴──────────────┘
┌──────────────┬──────────────┬──────────────┐
│ 📦 অর্ডার    │ 💰 রেভিনিউ  │ 👁️ ভিউজ    │
│    156       │   ৳45,200   │    2,340     │
└──────────────┴──────────────┴──────────────┘
```

**New Stats to Add:**
- মোট অর্ডার (সব পেজ থেকে)
- মোট রেভিনিউ
- সপ্তাহে তৈরি (এই সপ্তাহে নতুন পেজ)

### 2. Quick Actions Bar (Always Visible)

```text
┌────────────────────────────────────────────────────────────────┐
│ [+ নতুন পেজ] [📋 টেমপ্লেট] [📊 Analytics] [⚡ Bulk Import]     │
└────────────────────────────────────────────────────────────────┘
```

**Quick Actions:**
- নতুন পেজ তৈরি
- টেমপ্লেট থেকে তৈরি
- Analytics দেখুন
- Bulk Import

### 3. Bulk Selection & Actions Bar

Orders পেজের মতো multi-select এবং floating action bar:

```text
Selected: [x] ৩টি সিলেক্টেড [X]
──────────────────────────────
[Publish] [Unpublish] [Delete]
```

### 4. Enhanced Card Design

**Grid Card Structure:**
```text
┌─────────────────────────────────────────┐
│ [ ] ☐ Checkbox                          │
│ ┌───────────────────────────────────┐   │
│ │  🖼️  Preview Thumbnail             │   │
│ │     (first section preview)        │   │
│ └───────────────────────────────────┘   │
│ /product-landing          [Published] ●  │
│ 🛍️ Premium Product                      │
│ ─────────────────────────────────────   │
│ 📦 12 orders  💰 ৳15,200  📅 2 days ago │
│ ─────────────────────────────────────   │
│ [Edit Builder] [•••]                    │
└─────────────────────────────────────────┘
```

### 5. Improved Typography & Spacing

| Element | Before | After |
|---------|--------|-------|
| Page Title | `text-2xl` | `text-2xl sm:text-3xl font-heading tracking-tight` |
| Card Title | `text-base` | `text-lg font-semibold font-heading` |
| Stats Number | `text-xl` | `text-2xl sm:text-3xl font-bold font-digit` |
| Meta Text | `text-xs` | `text-xs sm:text-sm text-muted-foreground` |

### 6. Filter Tabs (Status Filter)

```text
[সব] [পাবলিশড ●8] [ড্রাফট ●4] [এই সপ্তাহে ●2]
```

## Technical Implementation

### File: `src/pages/admin/LandingPages.tsx`

**New State Variables:**
```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
```

**Enhanced Stats Query:**
```tsx
const { data: enhancedStats } = useQuery({
  queryKey: ['landing-pages-stats'],
  queryFn: async () => {
    const [pagesData, ordersData] = await Promise.all([
      supabase.from('landing_pages').select('id, published, created_at'),
      supabase.from('orders')
        .select('landing_page_id, total')
        .not('landing_page_id', 'is', null),
    ]);
    
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    
    return {
      total: pagesData.data?.length ?? 0,
      published: pagesData.data?.filter(p => p.published).length ?? 0,
      draft: pagesData.data?.filter(p => !p.published).length ?? 0,
      thisWeek: pagesData.data?.filter(p => 
        new Date(p.created_at) >= thisWeekStart
      ).length ?? 0,
      totalOrders: ordersData.data?.length ?? 0,
      totalRevenue: ordersData.data?.reduce((sum, o) => sum + (Number(o.total) || 0), 0) ?? 0,
    };
  },
});
```

**Quick Actions Bar Component:**
```tsx
<div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border">
  <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
    <Plus className="mr-2 h-4 w-4" />
    নতুন পেজ
  </Button>
  <Button variant="outline">
    <Layout className="mr-2 h-4 w-4" />
    টেমপ্লেট
  </Button>
  <Button variant="outline">
    <BarChart3 className="mr-2 h-4 w-4" />
    Analytics
  </Button>
  <Button variant="outline">
    <Upload className="mr-2 h-4 w-4" />
    Bulk Import
  </Button>
</div>
```

**Bulk Actions Bar (Floating):**
```tsx
{selectedIds.length > 0 && (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background border rounded-lg shadow-lg px-4 py-3">
    <span className="font-medium">{selectedIds.length}টি সিলেক্টেড</span>
    <Button size="icon" variant="ghost" onClick={() => setSelectedIds([])}>
      <X className="h-4 w-4" />
    </Button>
    <div className="h-6 w-px bg-border" />
    <Button size="sm" variant="outline" onClick={handleBulkPublish}>
      <Globe className="mr-2 h-4 w-4" />
      Publish
    </Button>
    <Button size="sm" variant="outline" onClick={handleBulkUnpublish}>
      <EyeOff className="mr-2 h-4 w-4" />
      Unpublish
    </Button>
    <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </Button>
  </div>
)}
```

**Status Filter Tabs:**
```tsx
<div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
  {[
    { key: 'all', label: 'সব', count: enhancedStats?.total },
    { key: 'published', label: 'পাবলিশড', count: enhancedStats?.published },
    { key: 'draft', label: 'ড্রাফট', count: enhancedStats?.draft },
  ].map((tab) => (
    <Button
      key={tab.key}
      variant={statusFilter === tab.key ? 'default' : 'ghost'}
      size="sm"
      onClick={() => setStatusFilter(tab.key)}
    >
      {tab.label}
      <Badge variant="secondary" className="ml-2">{tab.count}</Badge>
    </Button>
  ))}
</div>
```

**Enhanced Card with Checkbox & Stats:**
```tsx
<Card className="group relative">
  {/* Checkbox */}
  <div className="absolute top-3 left-3 z-10">
    <Checkbox
      checked={selectedIds.includes(page.id)}
      onCheckedChange={(checked) => {
        setSelectedIds(prev => 
          checked 
            ? [...prev, page.id] 
            : prev.filter(id => id !== page.id)
        );
      }}
    />
  </div>
  
  <CardHeader>
    {/* Title & Badge */}
  </CardHeader>
  
  <CardContent>
    {/* Page Stats Row */}
    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 py-2 border-t border-b">
      <div className="flex items-center gap-1.5">
        <ShoppingCart className="h-3.5 w-3.5" />
        <span>{pageStats[page.id]?.orders ?? 0} অর্ডার</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Wallet className="h-3.5 w-3.5" />
        <span>৳{(pageStats[page.id]?.revenue ?? 0).toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        <span>{formatDistanceToNow(new Date(page.updated_at), { addSuffix: true, locale: bn })}</span>
      </div>
    </div>
    
    {/* Actions */}
  </CardContent>
</Card>
```

## Stats Cards Layout (6 Cards - 2 Rows)

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
  {/* Row 1: Page Stats */}
  <StatCard
    icon={FileText}
    label="মোট পেজ"
    value={enhancedStats?.total}
    color="primary"
  />
  <StatCard
    icon={Globe}
    label="পাবলিশড"
    value={enhancedStats?.published}
    color="green"
  />
  <StatCard
    icon={Pencil}
    label="ড্রাফট"
    value={enhancedStats?.draft}
    color="amber"
  />
  
  {/* Row 2: Performance Stats */}
  <StatCard
    icon={ShoppingCart}
    label="মোট অর্ডার"
    value={enhancedStats?.totalOrders}
    color="blue"
  />
  <StatCard
    icon={Wallet}
    label="মোট রেভিনিউ"
    value={`৳${enhancedStats?.totalRevenue?.toLocaleString()}`}
    color="purple"
  />
  <StatCard
    icon={TrendingUp}
    label="এই সপ্তাহে"
    value={enhancedStats?.thisWeek}
    subtext="নতুন পেজ"
    color="indigo"
  />
</div>
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/LandingPages.tsx` | Complete redesign with enhanced stats, quick actions, bulk selection, and improved UI |

## Visual Result

### Desktop View
```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ল্যান্ডিং পেজ                                              [+ নতুন পেজ]    │
│ আপনার সকল ল্যান্ডিং পেজ ম্যানেজ করুন                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐          │
│ │📄 মোট    │🌐 পাবলিশ │✏️ ড্রাফট │📦 অর্ডার│💰 রেভিনিউ│📈 এই সপ্তাহ│         │
│ │   12     │    8     │    4     │   156    │ ৳45,200 │    2      │          │
│ └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘          │
├──────────────────────────────────────────────────────────────────────────────┤
│ Quick Actions: [+ পেজ] [📋 টেমপ্লেট] [📊 Analytics] [⚡ Import]              │
├──────────────────────────────────────────────────────────────────────────────┤
│ [সব ●12] [পাবলিশড ●8] [ড্রাফট ●4]         🔍 [Search...]  [Grid] [List]     │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐                     │
│ │[☐] /product-1  │ │[☐] /product-2  │ │[☐] /promo-page │                     │
│ │ Premium Product│ │ Basic Product  │ │ Special Offer  │                     │
│ │────────────────│ │────────────────│ │────────────────│                     │
│ │📦 45  💰 ৳12K │ │📦 23  💰 ৳8K  │ │📦 88  💰 ৳25K │                     │
│ │[Edit] [•••]    │ │[Edit] [•••]    │ │[Edit] [•••]    │                     │
│ └────────────────┘ └────────────────┘ └────────────────┘                     │
└──────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────┐
                    │ 3টি সিলেক্টেড [X] | [Publish] [Delete]  │ ← Floating bar
                    └─────────────────────────────────────────┘
```

## Key Features Summary

| Feature | Description |
|---------|-------------|
| **6 Stats Cards** | Page counts + Revenue + Orders + This week |
| **Quick Actions** | Always visible action buttons |
| **Bulk Selection** | Checkbox on each card |
| **Floating Actions** | Publish/Unpublish/Delete selected |
| **Status Tabs** | Filter by All/Published/Draft |
| **Page Stats** | Orders & Revenue per page |
| **Better Typography** | `font-heading`, `font-digit`, proper sizing |
| **Smooth Animations** | Entry animations, hover effects |
