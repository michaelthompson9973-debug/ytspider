
# Fraud Check API Integration - Implementation Plan

## Overview

AI API page এর মতো Fraud Check API integration page তৈরি করা হবে। এতে থাকবে:
- API Key management (add, batch import, delete)
- Key status check functionality
- Export functionality
- Phone number test feature

---

## API Documentation Summary

| Field | Value |
|-------|-------|
| **Base URL** | `https://fraudchecker.link/api/v1/qc/` |
| **Method** | POST |
| **Auth Header** | `Authorization: Bearer {API_KEY}` |
| **Body** | `phone` (form-data) |
| **Credits** | 1 credit per call |

**Response Fields:**
- `mobile_number` - Phone number checked
- `total_parcels` - Total orders found
- `total_delivered` - Successful deliveries  
- `total_cancel` - Cancelled orders
- `apis` - Courier-wise breakdown (Pathao, Steadfast, etc.)

---

## Implementation Steps

### Step 1: Database Schema Update

`api_keys` table এ provider হিসেবে `fraudcheck` support add করতে হবে। Table structure already exists, just need to use different provider value.

### Step 2: Edge Function তৈরি করা

**New File: `supabase/functions/check-fraudcheck-key/index.ts`**

এই function করবে:
1. API key validate করা fraudchecker.link API দিয়ে একটা test phone number check করে
2. Key status update করা (active/invalid/rate_limited)

```
Request: POST
Body: { keyId, keyValue }
Response: { status: 'active' | 'invalid' | 'rate_limited', keyId }
```

### Step 3: ApiFraudCheck Page Update

**File: `src/pages/admin/ApiFraudCheck.tsx`**

ApiAi.tsx এর pattern follow করে complete page তৈরি করা:

```text
┌──────────────────────────────────────────────────────────────┐
│ Fraud Check API                                              │
│ Manage fraud detection API keys for order validation         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ + Add New API Key                                        │ │
│ │ Get your key from fraudchecker.link dashboard            │ │
│ │                                                          │ │
│ │ Name (Optional)     │ API Key                            │ │
│ │ [________________]  │ [____________________________]     │ │
│ │                                                          │ │
│ │ [Add Key] [Batch Import]                                 │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 🔑 API Keys (3)                    [Check All] [Export]  │ │
│ │                                                          │ │
│ │ ┌────────────────────────────────────────────────────┐   │ │
│ │ │ FraudCheck Key 1         [Active ✓]                │   │ │
│ │ │ 577d••••••1a58          Used 45 times              │   │ │
│ │ │                          [👁] [📋] [🗑]            │   │ │
│ │ └────────────────────────────────────────────────────┘   │ │
│ │                                                          │ │
│ │ ┌────────────────────────────────────────────────────┐   │ │
│ │ │ FraudCheck Key 2         [Rate Limited ⚠]          │   │ │
│ │ │ 89ab••••••cd12          Used 150 times             │   │ │
│ │ │                          [🔄] [👁] [📋] [🗑]       │   │ │
│ │ └────────────────────────────────────────────────────┘   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 🧪 Test Fraud Check                                      │ │
│ │ Test your API by checking a phone number                 │ │
│ │                                                          │ │
│ │ Phone Number: [01712345678_____] [Check Phone]           │ │
│ │                                                          │ │
│ │ ┌────────────────────────────────────────────────────┐   │ │
│ │ │ Result:                                            │   │ │
│ │ │ Total Parcels: 15                                  │   │ │
│ │ │ Delivered: 12 (80%)     Cancelled: 3 (20%)         │   │ │
│ │ │                                                    │   │ │
│ │ │ Courier Breakdown:                                 │   │ │
│ │ │ • Pathao: 4/5 delivered                            │   │ │
│ │ │ • Steadfast: 3/4 delivered                         │   │ │
│ │ └────────────────────────────────────────────────────┘   │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Step 4: Admin Sidebar Badge Update

**File: `src/components/admin/AdminSidebar.tsx`**

Fraud Check item এর badge "N/A" থেকে "available" এ change করা।

---

## Files to Create/Edit

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/check-fraudcheck-key/index.ts` | Create | Edge function for validating FraudCheck API keys |
| `supabase/functions/test-fraudcheck/index.ts` | Create | Edge function for testing phone number lookup |
| `supabase/config.toml` | Edit | Add new edge function configs |
| `src/pages/admin/ApiFraudCheck.tsx` | Edit | Full page implementation |
| `src/components/admin/AdminSidebar.tsx` | Edit | Update badge to "available" |

---

## Technical Details

### Edge Function: check-fraudcheck-key

```typescript
// Pseudocode
async function checkFraudCheckKey(keyId, keyValue) {
  // Test the key by making a simple API call
  const response = await fetch('https://fraudchecker.link/api/v1/qc/', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${keyValue}` },
    body: formData({ phone: '01700000000' }) // Test phone
  });

  if (response.status === 401 || response.status === 403) {
    return { status: 'invalid' };
  }
  if (response.status === 429) {
    return { status: 'rate_limited' };
  }
  return { status: 'active' };
}
```

### Edge Function: test-fraudcheck

```typescript
// Pseudocode
async function testFraudCheck(phone) {
  // Get active fraud check API key
  const { data: keys } = await supabase
    .from('api_keys')
    .select('*')
    .eq('provider', 'fraudcheck')
    .eq('status', 'active')
    .limit(1);

  if (!keys?.length) {
    throw new Error('No active fraud check API key');
  }

  // Make API call
  const response = await fetch('https://fraudchecker.link/api/v1/qc/', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${keys[0].key_value}` },
    body: formData({ phone })
  });

  // Update usage count
  await supabase.from('api_keys')
    .update({ 
      usage_count: keys[0].usage_count + 1,
      last_used_at: new Date().toISOString()
    })
    .eq('id', keys[0].id);

  return await response.json();
}
```

### ApiFraudCheck Page Features

1. **Add New Key** - Single key add form
2. **Batch Import** - Dialog for pasting multiple keys
3. **Key List** - Show all fraudcheck provider keys with status
4. **Batch Check** - Check all keys sequentially with progress bar
5. **Copy/Export** - Copy all or export to .txt file
6. **Test Section** - Phone number input + result display with delivery rate visualization

### Delivery Rate Visualization

```text
┌────────────────────────────────────────┐
│ Delivery Rate                          │
│ ████████████████████░░░░░ 80%          │
│                                        │
│ ✅ Delivered: 12    ❌ Cancelled: 3    │
└────────────────────────────────────────┘
```

---

## Security Considerations

1. API key শুধুমাত্র server-side (Edge Function) এ use হবে
2. Client থেকে সরাসরি fraudchecker.link API call হবে না
3. Admin only access (RLS policy দ্বারা protected)
4. Key masking UI তে (প্রথম ৪ ও শেষ ৪ character দেখাবে)
