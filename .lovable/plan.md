

# Vercel Custom Domain Webhook Setup Plan

## Overview
Custom domain (যেমন `yourdomain.com/api/courier-webhook`) দিয়ে courier webhook URL সেটআপ করা হবে Vercel rewrites ব্যবহার করে। এটা করলে Supabase URL লুকানো থাকবে এবং professional দেখাবে।

---

## Implementation

### Step 1: Create `vercel.json`
Project root এ `vercel.json` ফাইল তৈরি করা হবে rewrite rules সহ:

```json
{
  "rewrites": [
    {
      "source": "/api/courier-webhook",
      "destination": "https://otibsrdecgygoeshfoho.supabase.co/functions/v1/courier-webhook"
    }
  ]
}
```

### Step 2: Update `WebhookStatusCard.tsx`
Webhook URL এখন custom domain URL দেখাবে:

**Before:**
```typescript
const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/courier-webhook`;
```

**After:**
```typescript
// Use custom domain path instead of Supabase URL
const webhookUrl = `${window.location.origin}/api/courier-webhook`;
```

---

## Result

| Before | After |
|--------|-------|
| `https://otibsrdecgygoeshfoho.supabase.co/functions/v1/courier-webhook` | `https://yourdomain.com/api/courier-webhook` |

---

## Technical Notes

- **Vercel Rewrites**: Request `/api/courier-webhook` এ আসলে Vercel সেটাকে internally Supabase edge function এ forward করে
- **No CORS Issues**: Same origin থেকে call হওয়ায় CORS problem থাকবে না
- **Localhost**: Development এ `localhost:5173/api/courier-webhook` কাজ করবে না (Vercel only), তবে সেটা কোনো সমস্যা না কারণ webhook শুধু production এ দরকার

---

## Files

| Action | File |
|--------|------|
| Create | `vercel.json` |
| Modify | `src/components/admin/courier/WebhookStatusCard.tsx` |

