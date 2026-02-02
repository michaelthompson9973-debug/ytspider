

# 🔐 Facebook Login দিয়ে Page Connect করার সিস্টেম

## বর্তমান সমস্যা

এখন manually Page ID, Page Name, এবং Page Access Token দিতে হয় যা:
- জটিল এবং সময়সাপেক্ষ
- User-friendly না
- Meta Developer Console এ যেতে হয়

## নতুন সমাধান: Login with Facebook

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 📄 Messenger Pages                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │             🔵 Login with Facebook                                │  │
│  │                                                                   │  │
│  │  আপনার Facebook অ্যাকাউন্ট দিয়ে লগইন করুন এবং                   │  │
│  │  পেজ সিলেক্ট করে সংযুক্ত করুন                                    │  │
│  │                                                                   │  │
│  │  [🔵 Login with Facebook]    [Manual setup ↗]                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ↓ লগইন করার পর Page List দেখাবে ↓                                    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 📱 আপনার Pages                                                    │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  ☑ My Shop Page (1234567890)                      [Connect]       │  │
│  │  ☐ Store 2 (0987654321)                           [Connect]       │  │
│  │  ☑ Another Page (5678901234)           ✓ Connected                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## কীভাবে কাজ করবে

```text
User                     Frontend                    Facebook                  Backend
  |                         |                           |                         |
  |--[Login with FB]------->|                           |                         |
  |                         |--[FB.login() popup]------>|                         |
  |                         |<--[user access token]-----|                         |
  |                         |                           |                         |
  |                         |--[/me/accounts API]------>|                         |
  |                         |<--[pages list + tokens]---|                         |
  |                         |                           |                         |
  |<--[Show pages list]-----|                           |                         |
  |                         |                           |                         |
  |--[Select page]--------->|                           |                         |
  |                         |------[Save to DB]---------|------------------------>|
  |                         |<-----[Success]------------|-------------------------|
```

## প্রয়োজনীয় Secrets

Facebook OAuth এর জন্য দুটি secret লাগবে:

| Secret | Description |
|--------|-------------|
| `FACEBOOK_APP_ID` | Meta Developer Console থেকে App ID |
| `FACEBOOK_APP_SECRET` | Meta Developer Console থেকে App Secret |

## Implementation Plan

### Phase 1: Facebook SDK Integration

| ফাইল | পরিবর্তন |
|------|----------|
| `index.html` | Facebook SDK script যোগ করা |
| `src/hooks/useFacebookLogin.ts` | নতুন - FB Login hook |
| `src/components/admin/messenger/FacebookLoginButton.tsx` | নতুন - Login button component |
| `src/components/admin/messenger/PageSelector.tsx` | নতুন - Page list এবং selection UI |
| `src/components/admin/messenger/AddPageModal.tsx` | আপডেট - Tab দিয়ে Facebook Login ও Manual দুটো অপশন |
| `src/pages/admin/ApiMessenger.tsx` | আপডেট - Facebook login integration |

### Phase 2: Backend (Edge Function)

| ফাইল | পরিবর্তন |
|------|----------|
| `supabase/functions/facebook-pages/index.ts` | নতুন - Long-lived token exchange এবং page subscription |

## Technical Details

### Facebook SDK Initialization (index.html)
```html
<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId: 'YOUR_APP_ID',
      cookie: true,
      xfbml: true,
      version: 'v18.0'
    });
  };
</script>
<script async defer crossorigin="anonymous" 
  src="https://connect.facebook.net/en_US/sdk.js">
</script>
```

### useFacebookLogin Hook
```typescript
export function useFacebookLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  
  const login = async () => {
    // FB.login() with pages_show_list, pages_messaging permissions
    // Then call /me/accounts to get pages
  };
  
  return { login, isLoading, pages };
}
```

### Page List Response (Graph API)
```json
{
  "data": [
    {
      "id": "1234567890",
      "name": "My Shop",
      "access_token": "EAAG...",
      "category": "Shopping & Retail"
    }
  ]
}
```

### Long-Lived Token Exchange
Short-lived token (1 hour) → Long-lived token (60 days)
```
GET /oauth/access_token?
  grant_type=fb_exchange_token&
  client_id={app-id}&
  client_secret={app-secret}&
  fb_exchange_token={short-lived-token}
```

## AddPageModal Tab Design

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ ✚ নতুন Facebook Page যোগ করুন                                    [✕] │
├─────────────────────────────────────────────────────────────────────────┤
│  [🔵 Facebook Login]    [📝 Manual Setup]                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Facebook Login Tab:                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🔵 Login with Facebook                                          │   │
│  │                                                                   │   │
│  │  আপনার Facebook অ্যাকাউন্ট দিয়ে লগইন করুন                       │   │
│  │  প্রয়োজনীয় permissions:                                         │   │
│  │  • pages_show_list                                                │   │
│  │  • pages_messaging                                                │   │
│  │  • pages_read_engagement                                          │   │
│  │                                                                   │   │
│  │        [🔵 Login with Facebook]                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  লগইন করার পর:                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  আপনার Pages (3):                                                │   │
│  │                                                                   │   │
│  │  ☑ My Shop          Shopping & Retail       [Connect]             │   │
│  │  ☑ Store 2          E-Commerce              [Connect]             │   │
│  │  ☐ Test Page        App Page                ✓ Already Connected   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Security Considerations

1. **App Secret শুধু Backend এ থাকবে** - Edge Function এ
2. **Short-lived → Long-lived token exchange** Backend এ হবে
3. **Page Access Token encrypted** database এ store হবে
4. **Token expiry tracking** - 60 দিন পর re-auth prompt

## Required Facebook App Settings

Meta Developer Console এ:
1. App Type: Business
2. Products: Facebook Login + Messenger
3. Permissions: `pages_show_list`, `pages_messaging`, `pages_read_engagement`, `pages_manage_metadata`
4. Valid OAuth Redirect URIs: আপনার domain

