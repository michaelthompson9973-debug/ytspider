

# আপডেটেড প্ল্যান: ল্যান্ডিং পেজ ভিত্তিক ট্র্যাকিং প্রোফাইল সিস্টেম

## পরিবর্তিত ধারণা

আগের প্ল্যানে প্রোডাক্টের সাথে ট্র্যাকিং প্রোফাইল লিংক করার কথা ছিল। এখন এটা **ল্যান্ডিং পেজের সাথে** লিংক করব। এটা আরও ভালো কারণ:
- একই প্রোডাক্ট বিভিন্ন ল্যান্ডিং পেজে থাকতে পারে
- প্রতিটি ক্যাম্পেইন/পেজের জন্য আলাদা ট্র্যাকিং দরকার হতে পারে

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Tracking Flow                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ Tracking Profile│                                            │
│  │ (FB + TikTok +  │                                            │
│  │  Google)        │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ Landing Page A  │     │ Landing Page B  │                   │
│  │ (Profile 1)     │     │ (Profile 2)     │                   │
│  └────────┬────────┘     └────────┬────────┘                   │
│           │                       │                             │
│           ▼                       ▼                             │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ Order Created   │     │ Order Created   │                   │
│  │ → FB Pixel 1    │     │ → FB Pixel 2    │                   │
│  │ → TikTok 1      │     │ → TikTok 2      │                   │
│  └─────────────────┘     └─────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### ১. `tracking_profiles` টেবিল (নতুন)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | Primary key |
| name | TEXT | NOT NULL | Profile name |
| description | TEXT | NULL | Optional description |
| facebook_pixel_id | TEXT | NULL | FB Pixel ID |
| facebook_access_token | TEXT | NULL | FB CAPI Access Token |
| facebook_test_event_code | TEXT | NULL | FB Test Event Code |
| tiktok_pixel_id | TEXT | NULL | TikTok Pixel ID |
| tiktok_access_token | TEXT | NULL | TikTok Events API Token |
| tiktok_test_event_code | TEXT | NULL | TikTok Test Event Code |
| google_gtm_id | TEXT | NULL | GTM Container ID |
| google_ga4_id | TEXT | NULL | GA4 Measurement ID |
| google_ga4_secret | TEXT | NULL | GA4 API Secret |
| is_active | BOOLEAN | true | Active status |
| created_at | TIMESTAMPTZ | now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | now() | Update timestamp |

### ২. `tracking_event_logs` টেবিল (নতুন)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | UUID | gen_random_uuid() | Primary key |
| profile_id | UUID | FK | Reference to tracking_profiles |
| order_id | UUID | NULL | Reference to orders (optional) |
| platform | TEXT | NOT NULL | facebook, tiktok, google |
| event_name | TEXT | NOT NULL | purchase, add_to_cart, etc. |
| event_id | TEXT | NOT NULL | Unique event ID |
| request_payload | JSONB | NULL | Sent data |
| response_status | INT | NULL | HTTP status |
| response_body | TEXT | NULL | API response |
| sent_at | TIMESTAMPTZ | now() | Timestamp |

### ৩. `landing_pages` টেবিলে নতুন কলাম

```sql
ALTER TABLE landing_pages 
ADD COLUMN tracking_profile_id UUID REFERENCES tracking_profiles(id) ON DELETE SET NULL;
```

---

## ফাইল পরিবর্তন

### নতুন ফাইল

| ফাইল | বিবরণ |
|------|-------|
| `src/pages/admin/TrackingProfiles.tsx` | প্রোফাইল ম্যানেজমেন্ট পেজ |
| `src/components/admin/tracking/TrackingProfileCard.tsx` | প্রোফাইল কার্ড কম্পোনেন্ট |
| `src/components/admin/tracking/TrackingProfileDialog.tsx` | Create/Edit ডায়ালগ |
| `src/components/admin/tracking/PlatformSection.tsx` | Collapsible প্ল্যাটফর্ম সেকশন |
| `src/hooks/useTrackingProfiles.ts` | Data fetching hooks |
| `supabase/functions/track-event/index.ts` | Server-side event tracking |

### পরিবর্তিত ফাইল

| ফাইল | পরিবর্তন |
|------|----------|
| `src/App.tsx` | নতুন রাউট `/admin/tracking/profiles` যোগ |
| `src/components/admin/AdminSidebar.tsx` | Tracking এর নিচে submenu যোগ (Events, Profiles) |
| `src/pages/admin/LandingPages.tsx` | Tracking Profile selector যোগ করব Page Settings dialog-এ |

---

## Admin UI Design

### Tracking Profiles পেজ (`/admin/tracking/profiles`)

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Tracking Profiles                              [+ Create Profile]   │
├─────────────────────────────────────────────────────────────────────┤
│  [🔍 Search profiles...]                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────┐  ┌────────────────────────────┐     │
│  │ 📊 Main Campaign           │  │ 📊 Dropship Campaign       │     │
│  │                            │  │                            │     │
│  │ ✅ Facebook (Active)       │  │ ✅ TikTok (Active)         │     │
│  │ ✅ TikTok (Active)         │  │ ⬚ Facebook (Not Set)      │     │
│  │ ✅ Google (Active)         │  │ ⬚ Google (Not Set)        │     │
│  │                            │  │                            │     │
│  │ [Edit] [Test] [Delete]     │  │ [Edit] [Test] [Delete]     │     │
│  └────────────────────────────┘  └────────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Create/Edit Dialog (Collapsible Sections)

```text
┌─────────────────────────────────────────────────────────────────┐
│  Edit Tracking Profile                                     [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Name: [Main Campaign                           ]                │
│  Description: [Primary tracking for FB ads      ]                │
│                                                                  │
│  ┌─ ▼ Facebook Pixel ─────────────────────────────────────────┐ │
│  │ ☑ Enable Facebook Tracking                                 │ │
│  │                                                             │ │
│  │ Pixel ID:        [123456789012345      ]                   │ │
│  │ Access Token:    [●●●●●●●●●●●●       ] [👁]                │ │
│  │ Test Event Code: [TEST12345            ] (optional)         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ ▶ TikTok Pixel ───────────────────────────────── (closed) ─┐ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ ▶ Google Analytics ───────────────────────────── (closed) ─┐ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                                      [Cancel]  [Save Profile]    │
└─────────────────────────────────────────────────────────────────┘
```

### Landing Page Settings-এ Tracking Profile Selector

```text
┌─────────────────────────────────────────────────────────────────┐
│  Edit Page Settings                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Slug: [mustard-oil                             ]                │
│  Product: [Premium Mustard Oil              ▼]                  │
│  GTM ID: [GTM-XXXXXXX                         ]                 │
│                                                                  │
│  ┌─ Tracking ──────────────────────────────────────────────────┐│
│  │                                                              ││
│  │ Tracking Profile: [Main Campaign              ▼]            ││
│  │                                                              ││
│  │ ⓘ Events (purchase, add_to_cart) will use this profile     ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [Published ☑]                                                  │
│                                                                  │
│                                      [Cancel]  [Save]            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Edge Function: `track-event`

### Request Format

```typescript
interface TrackEventRequest {
  // Profile lookup
  profileId?: string;           // Direct profile ID
  landingPageId?: string;       // OR lookup via landing page
  orderId?: string;             // For logging
  
  // Direct config (for testing without DB)
  config?: {
    facebook?: { pixelId, accessToken, testEventCode? };
    tiktok?: { pixelId, accessToken, testEventCode? };
  };
  
  // Event data
  eventName: string;            // 'Purchase', 'AddToCart', etc.
  eventData: {
    value: number;
    currency: string;
    contentIds?: string[];
    contentType?: string;
  };
  
  // User data (will be SHA256 hashed)
  userData: {
    phone?: string;
    email?: string;
    city?: string;
    country?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbp?: string;               // Facebook browser ID
    fbc?: string;               // Facebook click ID
  };
}
```

### Response Format

```typescript
interface TrackEventResponse {
  success: boolean;
  results: {
    facebook?: { success: boolean; response?: any; error?: string };
    tiktok?: { success: boolean; response?: any; error?: string };
  };
  logId?: string;               // ID of the tracking_event_logs entry
}
```

---

## Sidebar Navigation Update

```text
Operations
├── Orders
├── Tracking
│   ├── Events      ← বর্তমান /admin/tracking পেজ
│   └── Profiles    ← নতুন /admin/tracking/profiles পেজ
└── Inbox
```

---

## Implementation Steps

### Step 1: Database Migration
1. Create `tracking_profiles` table with all platform columns
2. Create `tracking_event_logs` table for event logging
3. Add `tracking_profile_id` column to `landing_pages` table
4. Create RLS policies (admin only)
5. Create updated_at trigger

### Step 2: Admin UI - Tracking Profiles
1. Create `/admin/tracking/profiles` page
2. Profile cards with platform badges
3. Create/Edit dialog with collapsible sections
4. Password toggle for tokens
5. Search functionality
6. Test event button

### Step 3: Landing Page Integration
1. Add `tracking_profile_id` to PageForm type
2. Add Tracking Profile select dropdown in Page Settings dialog
3. Query tracking_profiles for dropdown options
4. Save `tracking_profile_id` with page update

### Step 4: Edge Function
1. Create `track-event` function
2. Facebook Conversion API integration
3. TikTok Events API integration
4. SHA256 hashing for user data
5. Log all events to database

### Step 5: Navigation
1. Update AdminSidebar - Tracking submenu
2. Update App.tsx routes

---

## ফাইল সারাংশ

| ক্যাটাগরি | ফাইল সংখ্যা |
|-----------|-------------|
| নতুন ডেটাবেস টেবিল | 2 |
| নতুন কলাম (landing_pages) | 1 |
| নতুন Admin পেজ | 1 |
| নতুন Components | 4 |
| নতুন Hooks | 1 |
| নতুন Edge Functions | 1 |
| পরিবর্তিত ফাইল | 3 |

