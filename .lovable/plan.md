

# 📱 Facebook Page Management System

## বর্তমান অবস্থা

বর্তমানে `/admin/api/messaging/messenger` পেজে শুধু App ID এবং App Secret ইনপুট আছে। কিন্তু Facebook Page connection সম্পূর্ণ করতে আরও তথ্য দরকার:
- Page Access Token
- Page ID
- Page Name
- Webhook Verify Token

## Database Schema (বিদ্যমান)

`messenger_connections` টেবিলে যা আছে:

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| page_id | text | Facebook Page ID |
| page_name | text | Page নাম |
| page_access_token | text | Page Access Token |
| webhook_verify_token | text | Webhook verification |
| is_active | boolean | Active/Inactive |
| app_id | text | Facebook App ID |

## নতুন UI Design

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 📄 Messenger Pages                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 📱 Connected Pages                              [+ নতুন পেজ যোগ]  │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │ 📘 My Shop Page                                   🟢 Active │ │  │
│  │  │    Page ID: 1234567890                                      │ │  │
│  │  │    Added: 2 days ago                                        │ │  │
│  │  │    [Toggle: ON] [Webhook URL] [Delete]                      │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │ 📘 Store 2                                      🔴 Inactive │ │  │
│  │  │    Page ID: 0987654321                                      │ │  │
│  │  │    Added: 1 week ago                                        │ │  │
│  │  │    [Toggle: OFF] [Webhook URL] [Delete]                     │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  │                                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 🔧 Setup Guide                                                    │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ 1. Meta Developer Console এ যান                                  │  │
│  │ 2. আপনার App এ Messenger প্রোডাক্ট যোগ করুন                      │  │
│  │ 3. Page Access Token জেনারেট করুন                                │  │
│  │ 4. নিচের Webhook URL ব্যবহার করুন                                │  │
│  │                                                                   │  │
│  │ Webhook URL:                                                      │  │
│  │ ┌─────────────────────────────────────────────────────────────┐  │  │
│  │ │ https://...supabase.co/functions/v1/messenger-webhook  [📋] │  │  │
│  │ └─────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

[Add Page Modal]
┌─────────────────────────────────────────────────────────────────────────┐
│ ✚ নতুন Facebook Page যোগ করুন                                    [✕] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Page Name *                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ My Shop                                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Page ID *                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 1234567890123456                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Page Access Token *                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ EAAG...                                                     [👁] │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                                         [বাতিল]  [পেজ যোগ করুন]        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### ফাইল তৈরি/আপডেট

| ফাইল | পরিবর্তন |
|------|----------|
| `src/pages/admin/ApiMessenger.tsx` | সম্পূর্ণ রিরাইট - Page list, Add modal, Setup guide |
| `src/components/admin/messenger/PageConnectionCard.tsx` | নতুন - Individual page card component |
| `src/components/admin/messenger/AddPageModal.tsx` | নতুন - Add new page dialog |
| `src/components/admin/messenger/hooks/useConnections.ts` | `useCreateConnection` mutation যোগ করা |

### নতুন Hook - useCreateConnection

```typescript
export function useCreateConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      page_name: string;
      page_id: string;
      page_access_token: string;
    }) => {
      // Generate random webhook verify token
      const webhook_verify_token = crypto.randomUUID();
      
      const { error } = await supabase
        .from('messenger_connections')
        .insert({
          ...data,
          webhook_verify_token,
          is_active: true,
        });
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger-connections'] });
    },
  });
}
```

### Features

1. **Page List View**
   - সব connected pages দেখাবে
   - Active/Inactive status badge
   - Toggle switch দিয়ে enable/disable
   - Delete button সাথে confirmation

2. **Add Page Modal**
   - Page Name input
   - Page ID input
   - Page Access Token input (password field + show/hide)
   - Automatic webhook verify token generation

3. **Webhook Info Section**
   - Webhook URL copy করার সুবিধা
   - Verify Token দেখানো (per page)
   - Setup instructions

4. **Individual Page Actions**
   - Enable/Disable toggle
   - View webhook details
   - Delete with confirmation

## Technical Details

### Webhook URL Format
```
https://otibsrdecgygoeshfoho.supabase.co/functions/v1/messenger-webhook
```

### Webhook Verification
Facebook থেকে GET request আসবে `hub.verify_token` parameter সহ। এই token টি database এ stored token এর সাথে match করতে হবে।

### Security
- Page Access Token masked দেখাবে (শেষ ৬ character ছাড়া)
- Delete এ confirmation dialog
- RLS policy দ্বারা admin-only access

