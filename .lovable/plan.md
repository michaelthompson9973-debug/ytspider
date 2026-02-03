
# Quick Actions Bar হেডারে মুভ করা

## বর্তমান অবস্থা
Quick Actions বার (নতুন পেজ, টেমপ্লেট, Analytics, Bulk Import) আলাদা একটা row তে আছে Stats Cards এর নিচে।

## পরিবর্তন
Quick Actions buttons গুলোকে হেডারে "ল্যান্ডিং পেজ" title এর সাথে একই লাইনে (horizontally) রাখা হবে।

## নতুন Layout

```text
Before:
┌────────────────────────────────────────────────────────────┐
│ ল্যান্ডিং পেজ                              [+ নতুন পেজ]   │
│ আপনার সকল ল্যান্ডিং পেজ ম্যানেজ করুন                      │
├────────────────────────────────────────────────────────────┤
│ [Stats Cards Row]                                          │
├────────────────────────────────────────────────────────────┤
│ [+ পেজ] [টেমপ্লেট] [Analytics] [Import]  ← আলাদা row      │
└────────────────────────────────────────────────────────────┘

After:
┌────────────────────────────────────────────────────────────┐
│ ল্যান্ডিং পেজ    [+ পেজ] [টেমপ্লেট] [Analytics] [Import]  │
│ আপনার সকল ল্যান্ডিং পেজ ...                               │
├────────────────────────────────────────────────────────────┤
│ [Stats Cards Row]                                          │
└────────────────────────────────────────────────────────────┘
```

## Technical Changes

**File:** `src/pages/admin/LandingPages.tsx`

1. **Header Section (Lines 529-546) পরিবর্তন:**
   - আলাদা "নতুন পেজ" button রিমুভ
   - Quick Actions buttons গুলো header এর right side এ add করা
   - Mobile এ wrap হবে, Desktop এ এক লাইনে থাকবে

2. **Quick Actions Bar Section (Lines 593-615) রিমুভ:**
   - এই আলাদা section পুরোটা delete করা হবে

```tsx
{/* Header with Quick Actions */}
<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
  <div>
    <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight">
      ল্যান্ডিং পেজ
    </h1>
    <p className="text-sm text-muted-foreground mt-0.5">
      আপনার সকল ল্যান্ডিং পেজ ম্যানেজ করুন
    </p>
  </div>
  
  {/* Quick Actions - Horizontal */}
  <div className="flex flex-wrap items-center gap-2">
    <Button onClick={() => { resetForm(); setDialogOpen(true); }} size="sm">
      <Plus className="mr-1.5 h-4 w-4" />
      নতুন পেজ
    </Button>
    <Button variant="outline" size="sm" disabled>
      <Layout className="mr-1.5 h-4 w-4" />
      টেমপ্লেট
    </Button>
    <Button variant="outline" size="sm" disabled>
      <BarChart3 className="mr-1.5 h-4 w-4" />
      Analytics
    </Button>
    <Button variant="outline" size="sm" disabled>
      <Upload className="mr-1.5 h-4 w-4" />
      Bulk Import
    </Button>
  </div>
</div>
```

## Responsive Behavior

| Screen | Layout |
|--------|--------|
| Mobile | Title উপরে, Buttons নিচে (stack) |
| Tablet+ | Title বামে, Buttons ডানে (horizontal) |

## Summary
- Header এ Quick Actions merge করা
- আলাদা Quick Actions bar সম্পূর্ণ রিমুভ
- Cleaner, more compact design
- Less vertical space usage
