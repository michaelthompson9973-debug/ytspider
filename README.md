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
2. Copy the contents of `supabase/migrations/master.sql`
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
│   │   ├── send-webhook/
│   │   ├── track-conversion/
│   │   └── trigger-order-webhooks/
│   └── migrations/
│       └── master.sql      # Full database schema
└── .env.example            # Environment template
```

---

## Edge Functions

| Function | Purpose |
|----------|---------|
| `send-webhook` | Sends notifications to Telegram/Slack/Email |
| `track-conversion` | Logs server-side conversion events |
| `trigger-order-webhooks` | Fires all enabled webhooks on new order |

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
- [ ] Product CRUD works
- [ ] Landing pages publish and display publicly
- [ ] Orders insert from public forms
- [ ] GTM fires on landing pages
- [ ] Tracking debug panel shows events
- [ ] Webhooks trigger on new orders

---

## Troubleshooting

### "Row level security policy violation"
- Ensure you've added your user to `user_roles` table with admin role

### Edge functions not working
- Check function logs in Supabase dashboard
- Verify functions are deployed: `supabase functions list`

### Media upload fails
- Ensure storage bucket `media` exists and is public
- Check storage policies in SQL Editor

---

## License

Internal tool - not for public distribution.
