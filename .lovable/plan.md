
# Pathao Credential Simplification Implementation Plan

## সারসংক্ষেপ

বর্তমানে Pathao integration 5টি field চাচ্ছে (client_id, client_secret, username, password, store_id), কিন্তু PHP WooCommerce Plugin এর মতো `/aladdin/api/v1/external/login` endpoint ব্যবহার করলে শুধু **Client ID ও Client Secret** দিয়েই কাজ হবে।

## বর্তমান vs নতুন Credentials

| বর্তমান (5 fields) | নতুন (3 fields) |
|-------------------|-----------------|
| Client ID | Client ID |
| Client Secret | Client Secret |
| Username (Email) | ~~সরানো~~ |
| Password | ~~সরানো~~ |
| Store ID | Store ID (PathaoStoreConfig এ আলাদা) |

## পরিবর্তনসমূহ

### 1. Update `CourierCredentialsList.tsx`

**কি পরিবর্তন হবে:**
- `PATHAO_FIELDS` array থেকে `username`, `password`, এবং `store_id` সরানো হবে
- শুধু `client_id` এবং `client_secret` থাকবে
- Store ID আগে থেকেই `PathaoStoreConfig` component এ আলাদা আছে

```typescript
// আগে (5 fields)
const PATHAO_FIELDS = [
  { key: 'client_id', ... },
  { key: 'client_secret', ... },
  { key: 'username', ... },     // সরানো হবে
  { key: 'password', ... },     // সরানো হবে  
  { key: 'store_id', ... },     // সরানো হবে (PathaoStoreConfig এ আছে)
];

// পরে (2 fields)
const PATHAO_FIELDS = [
  { key: 'client_id', label: 'Client ID', placeholder: 'Enter Pathao Client ID' },
  { key: 'client_secret', label: 'Client Secret', placeholder: 'Enter Pathao Client Secret', isPassword: true },
];
```

### 2. Update `pathao-auth` Edge Function

**কি পরিবর্তন হবে:**
- `/aladdin/api/v1/issue-token` endpoint এর বদলে `/aladdin/api/v1/external/login` ব্যবহার করা হবে
- Request body থেকে `username`, `password`, এবং `grant_type` সরানো হবে
- Validation logic update করা হবে শুধু 2টি field check করতে

```typescript
// আগে - issue-token endpoint
const tokenResponse = await fetch('https://api-hermes.pathao.com/aladdin/api/v1/issue-token', {
  body: JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    username: username,
    password: password,
    grant_type: 'password',
  }),
});

// পরে - external/login endpoint
const tokenResponse = await fetch('https://api-hermes.pathao.com/aladdin/api/v1/external/login', {
  body: JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
  }),
});
```

## Files to Modify

| File | পরিবর্তন |
|------|----------|
| `src/components/admin/courier/CourierCredentialsList.tsx` | PATHAO_FIELDS সিম্পলিফাই করা |
| `supabase/functions/pathao-auth/index.ts` | External login endpoint ব্যবহার করা |

## যা পরিবর্তন হবে না

এই files গুলো unchanged থাকবে কারণ তারা শুধু `access_token` ব্যবহার করে:
- `supabase/functions/pathao-locations/index.ts` 
- `supabase/functions/courier-create-order/index.ts`
- `src/components/admin/courier/PathaoStoreConfig.tsx`
- `src/hooks/useCourierActions.ts`

## নতুন UI Flow

```text
┌─────────────────────────────────────────────────────────────┐
│  API Credentials                                            │
│  Enter your Pathao API credentials                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client ID                                                  │
│  ┌───────────────────────────────────────────────┐ ┌───┐   │
│  │ 7N1aMJQbWm                                    │ │ 🗑 │   │
│  └───────────────────────────────────────────────┘ └───┘   │
│                                                             │
│  Client Secret                                              │
│  ┌───────────────────────────────────────────────┐ ┌───┐   │
│  │ ●●●●●●●●●●●●●●●●●●●●●●●●●●●●                   │ │ 🗑 │   │
│  └───────────────────────────────────────────────┘ └───┘   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              💾 Save Credentials                       │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Test Credentials (Sandbox)

- Base URL: `https://courier-api-sandbox.pathao.com`
- Client ID: `7N1aMJQbWm`
- Client Secret: `wRcaibZkUdSNz2EI9ZyuXLlNrnAv0TdPUPXMnD39`

## Backward Compatibility

যাদের আগে থেকে `username` এবং `password` credentials stored আছে, তাদের data database এ থাকবে কিন্তু নতুন authentication এ ব্যবহার হবে না।
