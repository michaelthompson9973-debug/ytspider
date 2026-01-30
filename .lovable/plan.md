

# Steadfast ও Pathao Courier API Integration Plan

## Overview

এই প্ল্যানে দুইটি বাংলাদেশী কুরিয়ার সার্ভিস (Steadfast এবং Pathao) এর সম্পূর্ণ integration করা হবে। Features:

1. **Create Order** - অর্ডার কুরিয়ারে পাঠানো
2. **Status Automation** - স্বয়ংক্রিয় স্ট্যাটাস সিঙ্ক
3. **Webhook Ready** - কুরিয়ার থেকে স্ট্যাটাস আপডেট receive
4. **Push to Courier** - অর্ডার এন্ট্রি করা

---

## Phase 1: Database Schema Updates

### New Tables

```text
+---------------------------+        +---------------------------+
|    courier_credentials    |        |     pathao_locations      |
+---------------------------+        +---------------------------+
| id (uuid, PK)             |        | id (uuid, PK)             |
| provider (text)           |        | city_id (int)             |
| credential_type (text)    |        | city_name (text)          |
| credential_value (text)   |        | zone_id (int, nullable)   |
| label (text)              |        | zone_name (text, nullable)|
| is_active (boolean)       |        | area_id (int, nullable)   |
| access_token (text)       |        | area_name (text, nullable)|
| token_expires_at (ts)     |        | created_at (ts)           |
| created_at (ts)           |        +---------------------------+
| updated_at (ts)           |
+---------------------------+
```

### Updates to Existing `orders` Table

Already has:
- `courier_provider` - ইতিমধ্যে আছে
- `consignment_id` - ইতিমধ্যে আছে
- `tracking_code` - ইতিমধ্যে আছে
- `courier_status` - ইতিমধ্যে আছে
- `courier_synced_at` - ইতিমধ্যে আছে

---

## Phase 2: Edge Functions

### 2.1 `courier-create-order/index.ts`

**Purpose**: অর্ডার Steadfast/Pathao তে পাঠানো

```text
POST /courier-create-order
Body: { orderId: string, provider: 'steadfast' | 'pathao' }

Flow:
1. Authenticate admin user
2. Fetch order details from DB
3. Fetch courier credentials
4. Call courier API
5. Update order with consignment_id, tracking_code
6. Return response
```

**Steadfast API Call:**
- URL: `https://portal.packzy.com/api/v1/create_order`
- Headers: `Api-Key`, `Secret-Key`
- Body: `invoice`, `recipient_name`, `recipient_phone`, `recipient_address`, `cod_amount`

**Pathao API Call:**
- URL: `https://api-hermes.pathao.com/aladdin/api/v1/orders`
- Headers: `Authorization: Bearer {access_token}`
- Body: `store_id`, `recipient_name`, `recipient_phone`, `recipient_address`, `recipient_city`, `recipient_zone`, `recipient_area`, `delivery_type`, `item_type`, `item_quantity`, `item_weight`, `amount_to_collect`

### 2.2 `courier-sync-status/index.ts`

**Purpose**: অর্ডারের স্ট্যাটাস manually sync করা

```text
POST /courier-sync-status
Body: { orderId: string }

Flow:
1. Fetch order with consignment_id
2. Call courier status API
3. Update order courier_status
4. Log status change if different
```

### 2.3 `courier-webhook/index.ts`

**Purpose**: Steadfast/Pathao থেকে webhook receive করা

```text
POST /courier-webhook
Body: (Steadfast format or Pathao format)

Flow:
1. Validate webhook signature (Pathao)
2. Parse status from payload
3. Find order by consignment_id
4. Update courier_status
5. Auto-update order status if applicable
6. Trigger order webhooks
```

### 2.4 `pathao-auth/index.ts`

**Purpose**: Pathao OAuth token refresh

```text
POST /pathao-auth

Flow:
1. Fetch Pathao credentials
2. Call Pathao token endpoint
3. Store access_token with expiry
```

### 2.5 `pathao-locations/index.ts`

**Purpose**: Pathao cities/zones/areas fetch করা

```text
GET /pathao-locations?type=cities
GET /pathao-locations?type=zones&cityId=1
GET /pathao-locations?type=areas&zoneId=298
```

---

## Phase 3: Admin UI - ApiCourier.tsx

### Layout Structure

```text
+------------------------------------------+
|  Courier API                              |
|  Configure courier integrations           |
+------------------------------------------+
|                                          |
|  [Tabs: Steadfast | Pathao]              |
|                                          |
|  +--------------------------------------+|
|  | Credentials Card                     ||
|  | +----------------------------------+ ||
|  | | API Key: *********** [Show] [Del]| ||
|  | | Secret Key: ******* [Show] [Del] | ||
|  | +----------------------------------+ ||
|  | [+ Add Credential]                   ||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  | Pathao Store Config (Pathao only)   ||
|  | Store ID: [__________]              ||
|  | Default City: [Dropdown]            ||
|  | Default Zone: [Dropdown]            ||
|  | Default Area: [Dropdown]            ||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  | Webhook Status                       ||
|  | URL: https://xxx.supabase.co/...     ||
|  | Last received: 2 hours ago           ||
|  | [Copy URL] [Test Webhook]            ||
|  +--------------------------------------+|
|                                          |
+------------------------------------------+
```

### Key Components

1. **CourierProviderTabs** - Steadfast/Pathao switch
2. **CourierCredentialsList** - API keys manage
3. **PathaoStoreConfig** - Store setup
4. **PathaoLocationSelect** - City/Zone/Area cascading dropdowns
5. **WebhookStatusCard** - Webhook URL ও status

---

## Phase 4: Order Integration

### OrderDetailsModal Updates

```text
+--------------------------------------+
| কুরিয়ারে পাঠান                       |
+--------------------------------------+
| Provider: [Steadfast ▼] [Pathao ▼]   |
|                                      |
| [Pathao only:]                       |
| City: [Dhaka ▼]                      |
| Zone: [Uttara ▼]                     |
| Area: [Sector 10 ▼]                  |
|                                      |
| Weight: [0.5] kg                     |
| Special Instructions: [__________]   |
|                                      |
| [পাঠান]                              |
+--------------------------------------+
```

### Bulk Actions

Orders.tsx এ bulk courier send:
- Select multiple orders
- Choose provider
- Send all selected orders

---

## Phase 5: Status Mapping

### Steadfast Status -> Order Status

| Steadfast Status | Order Status |
|------------------|--------------|
| Booked           | shipped      |
| Allocated        | shipped      |
| In Transit       | shipped      |
| Delivered        | delivered    |
| Cancelled        | cancelled    |

### Pathao Status -> Order Status

| Pathao Status       | Order Status |
|---------------------|--------------|
| order.created       | shipped      |
| order.picked        | shipped      |
| order.in_transit    | shipped      |
| order.delivered     | delivered    |
| order.returned      | cancelled    |

---

## Files to Create/Modify

### New Files

| File | Description |
|------|-------------|
| `supabase/functions/courier-create-order/index.ts` | Create order in courier |
| `supabase/functions/courier-sync-status/index.ts` | Sync status from courier |
| `supabase/functions/courier-webhook/index.ts` | Receive courier webhooks |
| `supabase/functions/pathao-auth/index.ts` | Pathao OAuth token |
| `supabase/functions/pathao-locations/index.ts` | Fetch Pathao locations |
| `src/pages/admin/ApiCourier.tsx` | Full UI rewrite |
| `src/components/admin/courier/CourierProviderTabs.tsx` | Provider switcher |
| `src/components/admin/courier/CourierCredentialsList.tsx` | Credentials CRUD |
| `src/components/admin/courier/PathaoLocationSelect.tsx` | Location dropdowns |
| `src/components/admin/courier/SendToCourierModal.tsx` | Send to courier dialog |
| `src/hooks/useCourierLocations.ts` | Pathao locations hook |
| `src/hooks/useCourierCredentials.ts` | Credentials management |

### Modified Files

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add new function configs |
| `src/components/admin/orders/OrderDetailsModal.tsx` | Courier send integration |
| `src/pages/admin/Orders.tsx` | Bulk courier send |

---

## API Secrets Required

Admin এ input নিতে হবে:

### Steadfast
- `Api-Key` - Steadfast API key
- `Secret-Key` - Steadfast secret key

### Pathao
- `client_id` - Pathao OAuth client ID
- `client_secret` - Pathao OAuth client secret
- `username` - Merchant email
- `password` - Merchant password
- `store_id` - Pathao store ID

---

## Security Considerations

1. **Credentials Storage**: `courier_credentials` table এ encrypted store করা হবে
2. **Admin Only Access**: সব edge functions admin-only
3. **Webhook Validation**: Pathao webhook signature verify করা হবে
4. **Rate Limiting**: Courier API calls rate limited

---

## Implementation Order

1. Database schema migration (courier_credentials, pathao_locations)
2. Steadfast integration (simpler, no OAuth)
3. ApiCourier.tsx UI with Steadfast
4. Pathao OAuth flow
5. Pathao location sync
6. Pathao order creation
7. Webhook handling
8. Status sync automation
9. OrderDetailsModal integration
10. Bulk actions

