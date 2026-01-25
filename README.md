# Ytspider

A minimal, mobile-friendly internal web app for quickly creating and publishing product landing pages for paid traffic (YouTube Ads focus).

## Features

- **Product Management**: Create, edit, delete products with images/videos
- **Landing Page Builder**: HTML-only editor with live preview, GTM integration
- **Order Management**: Track orders with status updates, filters, CSV export
- **Media Library**: Upload and organize images/videos with folder support
- **Tracking**: GTM per page, UTM capture, server-side conversion events
- **Webhooks**: Telegram, Slack, Email notifications for new orders
- **Multi-Domain**: Map custom domains to landing page slugs

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Edge Functions)

---

## Self-Hosted Setup Guide

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish provisioning
3. Note your project URL and API keys from **Project Settings > API**

### 2. Run Database Migration

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `docs/master.sql`
3. Paste and run the entire script
4. Verify tables were created in **Table Editor**

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```

### 4. Deploy Edge Functions

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-id
   ```

4. Deploy all edge functions:
   ```bash
   supabase functions deploy send-webhook
   supabase functions deploy track-conversion
   supabase functions deploy trigger-order-webhooks
   ```

### 5. Configure Auth Settings

1. Go to **Authentication > Providers** in Supabase dashboard
2. Enable **Email** provider
3. (Optional) Disable "Confirm email" for faster testing in **Authentication > Settings**

### 6. Create Admin User

1. Start the app locally:
   ```bash
   npm install
   npm run dev
   ```

2. Go to `/auth` and sign up with your email

3. In Supabase **SQL Editor**, run:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, 'admin' FROM auth.users WHERE email = 'your-admin@email.com';
   ```

4. Refresh the app - you should now have admin access

---

## Security

### Authentication & Authorization

- **Route Protection**: All `/admin/*` routes are protected by `ProtectedRoute` component
- **Admin Role Check**: Users must have an `admin` role in `user_roles` table to access dashboard
- **Non-admin users**: See "Access Denied" screen when trying to access admin routes
- **Unauthenticated users**: Redirected to `/auth` login page

### Row Level Security (RLS)

All database tables have RLS enabled with the following policies:

| Table | Public Access | Admin Access |
|-------|---------------|--------------|
| `landing_pages` | SELECT (published only) | Full CRUD |
| `orders` | INSERT only | Full CRUD |
| `products` | SELECT (active only) | Full CRUD |
| `media` | None | Full CRUD |
| `webhooks` | None | Full CRUD |
| `conversion_events` | INSERT only | SELECT |
| `user_roles` | None | Full CRUD |
| `domain_mappings` | SELECT | Full CRUD |

### Edge Function Security

All edge functions implement:

| Security Layer | Description |
|----------------|-------------|
| **JWT Verification** | Validates Authorization header using `supabase.auth.getClaims()` |
| **Admin Role Check** | Verifies caller has admin role via `has_role()` function |
| **Service Role Auth** | Allows internal server-to-server calls with service role key |
| **Rate Limiting** | IP-based throttling (20-30 requests/minute per IP) |
| **Request Logging** | Logs timestamp, function, IP, user ID, and result |

#### Function Access Matrix

| Function | Public | Authenticated | Admin | Service Role |
|----------|--------|---------------|-------|--------------|
| `track-conversion` | ✅ (rate limited) | ✅ | ✅ | ✅ |
| `send-webhook` | ❌ | ❌ | ✅ | ✅ |
| `trigger-order-webhooks` | ❌ | ❌ | ✅ | ✅ |

### Security Best Practices

1. **Never expose service role key** - Only use in edge functions, never in client code
2. **Use anon key in frontend** - The publishable key has limited permissions via RLS
3. **Admin role verification** - Always checked server-side via `is_admin()` function
4. **Token validation** - JWTs are validated on every protected request
5. **No client-side role storage** - Roles are always fetched from database

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── admin/          # Admin layout components
│   │   ├── ProtectedRoute.tsx # Route guard for admin access
│   │   └── ui/             # shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx # Authentication context
│   ├── integrations/
│   │   └── supabase/       # Supabase client & types
│   ├── pages/
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── Auth.tsx        # Login/signup page
│   │   ├── LandingPage.tsx # Public landing page renderer
│   │   └── Index.tsx       # Home redirect
│   └── App.tsx             # Route definitions
├── supabase/
│   ├── functions/          # Edge functions
│   │   ├── _shared/        # Shared auth utilities
│   │   ├── send-webhook/
│   │   ├── track-conversion/
│   │   └── trigger-order-webhooks/
│   └── config.toml         # Supabase CLI config
├── docs/
│   └── master.sql          # Full database schema
└── .env.example            # Environment template
```

---

## Edge Functions

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `send-webhook` | Sends notifications to Telegram/Slack/Email | Admin or Service Role |
| `track-conversion` | Logs server-side conversion events | Public (rate limited) |
| `trigger-order-webhooks` | Fires all enabled webhooks on new order | Admin or Service Role |

---

## Database Tables

| Table | Description |
|-------|-------------|
| `user_roles` | Admin role assignments |
| `products` | Product catalog |
| `landing_pages` | Landing page content & config |
| `orders` | Customer orders with UTM data |
| `media` | Uploaded files metadata |
| `conversion_events` | Tracking event logs |
| `webhooks` | Webhook configurations |
| `domain_mappings` | Custom domain → slug mappings |

---

## Validation Checklist

After setup, verify:

- [ ] App runs locally (`npm run dev`)
- [ ] Auth works (signup/login)
- [ ] Admin role grants dashboard access
- [ ] Non-admin users see "Access Denied"
- [ ] Product CRUD works
- [ ] Landing pages publish and display publicly
- [ ] Orders insert from public forms
- [ ] GTM fires on landing pages
- [ ] Tracking debug panel shows events
- [ ] Webhooks trigger on new orders
- [ ] Invalid tokens return 401

---

## Troubleshooting

### "Row level security policy violation"
- Ensure you've added your user to `user_roles` table with admin role

### Edge functions not working
- Check function logs in Supabase dashboard
- Verify functions are deployed: `supabase functions list`

### "Unauthorized" from edge functions
- Verify Authorization header is being sent
- Check that user has admin role in database

### Media upload fails
- Ensure storage bucket `media` exists and is public
- Check storage policies in SQL Editor

---

## License

Internal tool - not for public distribution.
