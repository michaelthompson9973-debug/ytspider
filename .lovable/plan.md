
# YTSpider SaaS Architecture Restructure Plan

## বর্তমান অবস্থা বিশ্লেষণ

### বিদ্যমান সিস্টেম:
- **Shop Owner Area (`/shop/*`)**: ShopLayout সহ basic pages আছে (placeholder)
- **Super Admin Area (`/admin/*`)**: AdminLayout সহ সম্পূর্ণ features আছে
- **Database**: shops table-এ subscription_id, expires_at আছে; component_library-তে shop_id nullable

### যা নেই:
- Shop Type (Digital vs Physical) distinction
- Platform-wide Product/Landing Page/Component/Customer libraries
- Marketing tools (WhatsApp, SMS campaigns)
- Digital product order management
- Payment gateway integration

---

## Phase 1: Shop Type & Enhanced Onboarding

### Database Changes:
```text
shops table - নতুন columns:
├── shop_type ENUM ('physical', 'digital') DEFAULT 'physical'
├── business_category TEXT (optional)
└── onboarding_completed BOOLEAN DEFAULT false
```

### ShopOnboarding Enhancement:
- Step 1: Shop Name
- Step 2: Shop Type Selection (Physical/Digital product)
- Step 3: Business Category (optional)
- Step 4: Basic branding (logo upload)

---

## Phase 2: Shop Owner Area Restructure (`/shop/*`)

### Navigation Structure:
```text
Shop Owner Dashboard
├── ওভারভিউ
│   └── ড্যাশবোর্ড (stats, recent orders, quick actions)
│
├── ব্যবসা
│   ├── প্রোডাক্ট
│   ├── অর্ডার (Physical: COD flow, Digital: Payment + Delivery)
│   ├── ল্যান্ডিং পেজ
│   │   ├── লাইব্রেরী (Platform components access)
│   │   └── আমার পেজ
│   └── মিডিয়া
│
├── যোগাযোগ
│   ├── মেসেঞ্জার ইনবক্স
│   └── হোয়াটসঅ্যাপ (Phase 4)
│
├── ইন্টিগ্রেশন
│   ├── ট্র্যাকিং (FB Pixel, GTM)
│   ├── কুরিয়ার (Physical only)
│   ├── পেমেন্ট গেটওয়ে (Digital only)
│   └── AI সেটিংস
│
└── সেটিংস
    ├── টিম মেম্বার
    ├── সাবস্ক্রিপশন & বিলিং
    ├── অ্যানালিটিক্স
    └── শপ সেটিংস
```

### Key Features per Shop Type:
```text
Physical Products:
├── COD-based order flow
├── Courier integration (Steadfast, Pathao)
├── Fraud check system
└── Delivery tracking

Digital Products:
├── Payment gateway required (Stripe, bKash, Nagad)
├── Email delivery system
├── License key management (optional)
└── Download link generation
```

---

## Phase 3: Super Admin Platform Tools

### Navigation Structure:
```text
Platform Admin Dashboard
├── ওভারভিউ
│   └── প্ল্যাটফর্ম ড্যাশবোর্ড (aggregated stats)
│
├── বিজনেস ম্যানেজমেন্ট
│   ├── সব শপ (All Shops management)
│   ├── নতুন শপ তৈরি (Provision for users)
│   ├── সাবস্ক্রিপশন (Platform-wide)
│   └── অডিট লগ
│
├── প্ল্যাটফর্ম লাইব্রেরী
│   ├── প্রোডাক্ট লাইব্রেরী (All shops' products + trending)
│   ├── ল্যান্ডিং পেজ লাইব্রেরী (All published pages)
│   ├── কম্পোনেন্ট লাইব্রেরী (Master library + shop contributions)
│   └── কাস্টমার বেজ (Aggregated customer data)
│
├── মার্কেটিং টুলস
│   ├── WhatsApp Campaigns
│   ├── SMS Campaigns
│   └── Email Marketing
│
├── প্রাইসিং & বিলিং
│   ├── প্ল্যান ম্যানেজমেন্ট
│   └── রেভিনিউ রিপোর্ট
│
└── সেটিংস
    ├── ডোমেইন ম্যানেজমেন্ট
    ├── ওয়েবহুক
    └── API কনফিগারেশন
```

### Platform Libraries Features:

#### Product Library:
```text
├── সব শপের প্রোডাক্ট list
├── Trending products (based on sales)
├── Category-wise organization
├── Sales performance metrics
├── Shop attribution
└── Export/Analytics tools
```

#### Landing Page Library:
```text
├── সব শপের published landing pages
├── Performance metrics (conversions, views)
├── Template cloning capability
└── Best performing pages highlighting
```

#### Customer Base:
```text
├── Aggregated customer data (all shops)
├── Trust scoring (Trusted/Medium/Risky/New)
├── Courier history integration
├── Segmentation tools
└── Marketing campaign targeting
```

---

## Phase 4: Digital Product Order Management

### Database Changes:
```text
orders table - নতুন columns:
├── order_type ENUM ('physical', 'digital') DEFAULT 'physical'
├── payment_status ENUM ('pending', 'paid', 'failed', 'refunded')
├── payment_method TEXT
├── payment_transaction_id TEXT
└── digital_delivery_status ENUM ('pending', 'sent', 'downloaded')

digital_deliveries table (new):
├── id UUID
├── order_id UUID (FK)
├── product_id UUID
├── download_link TEXT
├── license_key TEXT (optional)
├── expires_at TIMESTAMP
├── download_count INTEGER
├── max_downloads INTEGER
└── delivered_at TIMESTAMP
```

### Digital Order Flow:
```text
1. Customer places order on landing page
2. Redirect to payment gateway
3. Payment confirmed → Order created
4. Automatic email with download link/license
5. Download tracking
```

---

## Phase 5: Payment Gateway Integration

### Supported Gateways:
```text
International:
├── Stripe (Credit/Debit cards)
└── PayPal

Bangladesh Local:
├── bKash
├── Nagad
├── Rocket
└── SSLCommerz (aggregator)
```

### Database:
```text
payment_gateways table:
├── id UUID
├── shop_id UUID
├── provider TEXT (stripe, bkash, nagad)
├── credentials JSONB (encrypted)
├── is_active BOOLEAN
├── is_test_mode BOOLEAN
└── created_at TIMESTAMP
```

---

## Phase 6: Marketing Tools

### WhatsApp Marketing:
```text
whatsapp_connections table:
├── id UUID
├── shop_id UUID
├── phone_number TEXT
├── business_account_id TEXT
├── access_token TEXT
└── is_active BOOLEAN

whatsapp_campaigns table:
├── id UUID
├── shop_id UUID (null for platform-wide)
├── name TEXT
├── template_id TEXT
├── target_segment JSONB
├── scheduled_at TIMESTAMP
├── status ENUM
└── stats JSONB
```

### SMS Marketing:
```text
sms_providers table:
├── id UUID
├── shop_id UUID
├── provider TEXT (twilio, ssl_sms)
├── credentials JSONB
└── is_active BOOLEAN

sms_campaigns table:
├── Similar structure to whatsapp_campaigns
```

---

## Implementation Priority

### Immediate (Week 1-2):
1. Shop Type enum & database migration
2. Enhanced ShopOnboarding with type selection
3. Conditional sidebar based on shop_type
4. Platform libraries basic views

### Short-term (Week 3-4):
5. Product Library with trending/analytics
6. Landing Page Library
7. Customer Base dashboard
8. Shop-level subscription page (real data)

### Medium-term (Week 5-8):
9. Payment gateway integration (Stripe first)
10. Digital product order flow
11. Email delivery system
12. WhatsApp integration

### Long-term (Month 3+):
13. SMS marketing
14. Advanced analytics
15. Multi-currency support
16. White-label customization

---

## Technical Considerations

### Component Library Architecture:
```text
component_library table restructure:
├── shop_id NULL = Platform master library
├── shop_id = Shop's own components
├── is_approved BOOLEAN (for shop contributions)
├── source_shop_id (if cloned from shop)
└── usage_count (tracking popularity)
```

### RLS Policies:
```text
Platform Libraries:
├── Admins: Full read/write
├── Shop Owners: Read platform components
├── Shop Owners: Write own shop components
└── Contribution → Admin approval → Platform library
```

### Performance Considerations:
```text
├── Pagination for large libraries
├── Search/filter indexing
├── Cached aggregations for dashboards
└── Lazy loading for shop-specific data
```

---

## File Changes Summary

### New Files:
```text
src/pages/shop/
├── ShopProducts.tsx (wrapper for ProductsContent)
├── ShopOrders.tsx (with order_type conditional)
├── ShopPayments.tsx (digital shops only)
└── ShopWhatsApp.tsx

src/pages/admin/
├── PlatformProductLibrary.tsx
├── PlatformLandingPageLibrary.tsx
├── PlatformCustomerBase.tsx
├── MarketingWhatsApp.tsx
└── MarketingSMS.tsx

src/components/admin/
├── platform-library/
│   ├── ProductLibraryTable.tsx
│   ├── ProductTrendingCard.tsx
│   ├── LandingPageLibraryGrid.tsx
│   └── CustomerBaseTable.tsx
├── marketing/
│   ├── CampaignBuilder.tsx
│   ├── SegmentPicker.tsx
│   └── CampaignStats.tsx
└── payments/
    ├── PaymentGatewaySetup.tsx
    └── PaymentHistory.tsx
```

### Modified Files:
```text
├── src/components/shop/ShopSidebar.tsx (conditional items)
├── src/components/admin/AdminSidebar.tsx (new groups)
├── src/pages/shop/ShopOnboarding.tsx (multi-step)
├── src/App.tsx (new routes)
└── supabase/migrations/xxx.sql (schema changes)
```
