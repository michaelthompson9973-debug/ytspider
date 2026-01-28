

# Fraud Check API - Request Format Fix

## Problem Analysis

FraudCheck API আপনার key কে "invalid" বলছে কারণ আমরা ভুল content type পাঠাচ্ছি। আপনার documentation এর JavaScript example অনুযায়ী:

| Documentation | Current Code |
|---------------|--------------|
| `FormData` (multipart/form-data) | `URLSearchParams` (x-www-form-urlencoded) |
| No explicit Content-Type header | Explicit Content-Type header |

## Solution

Edge functions গুলো update করে `FormData` ব্যবহার করতে হবে, exactly আপনার docs এর মতো।

---

## Step 1: Update check-fraudcheck-key Edge Function

**File:** `supabase/functions/check-fraudcheck-key/index.ts`

```text
BEFORE:
const body = new URLSearchParams({ phone: "01700000000" });
const response = await fetch("https://fraudchecker.link/api/v1/qc/", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${keyValue}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body,
});

AFTER:
const formData = new FormData();
formData.append("phone", "01700000000");
const response = await fetch("https://fraudchecker.link/api/v1/qc/", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${keyValue}`,
    // No Content-Type - let fetch set it automatically for FormData
  },
  body: formData,
});
```

---

## Step 2: Update test-fraudcheck Edge Function

**File:** `supabase/functions/test-fraudcheck/index.ts`

Same change - `URLSearchParams` থেকে `FormData` এ switch:

```text
BEFORE:
const body = new URLSearchParams({ phone: cleanPhone });
const response = await fetch("https://fraudchecker.link/api/v1/qc/", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey.key_value}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body,
});

AFTER:
const formData = new FormData();
formData.append("phone", cleanPhone);
const response = await fetch("https://fraudchecker.link/api/v1/qc/", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey.key_value}`,
  },
  body: formData,
});
```

---

## Step 3: Deploy and Test

1. Deploy updated edge functions
2. Key status reset করুন (UI তে Reset button)
3. "Check All" দিয়ে key verify করুন
4. একটি real phone number দিয়ে "Check Phone" test করুন

---

## Files to Edit

| File | Change |
|------|--------|
| `supabase/functions/check-fraudcheck-key/index.ts` | URLSearchParams → FormData |
| `supabase/functions/test-fraudcheck/index.ts` | URLSearchParams → FormData |

---

## Expected Result

After this fix:
- API call সঠিক format এ যাবে (multipart/form-data)
- Key status "active" হবে
- Phone number check সফল হবে এবং delivery rate দেখাবে

