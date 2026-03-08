

## Plan: Convert Entire Admin Panel to English

### Scope Assessment

There are **hardcoded Bengali strings in ~80+ files** across the entire codebase. While some pages use the `t()` translation system (which already has English translations), the majority of strings are **hardcoded Bengali** — not going through the locale system at all.

### Approach

Rather than expanding the locale system to cover all strings (which would be a much larger refactor), the most efficient approach is to **replace all hardcoded Bengali strings with English equivalents** across all files, and ensure the `t()` system defaults to English.

### Files to Modify (Grouped by Area)

**1. Auth & Public Pages (~6 files)**
- `src/pages/Auth.tsx` — Login/Register form labels
- `src/pages/ForgotPassword.tsx` — Reset password flow
- `src/pages/ResetPassword.tsx` — Password reset
- `src/pages/Register.tsx` — Registration
- `src/pages/AcceptInvite.tsx` — Invitation acceptance
- `src/pages/Index.tsx` — Homepage hero, features, pricing CTAs

**2. Landing/Public Components (~5 files)**
- `src/components/landing/HowItWorksSection.tsx` — Steps
- `src/components/landing/FAQSection.tsx` — FAQ items
- `src/components/landing/CTABanner.tsx` — CTA text
- `src/components/landing/Footer.tsx` — Footer description
- `src/components/landing/CheckoutSection.tsx` — Checkout form/toasts

**3. Admin Panel Pages (~19 files)**
- `src/pages/admin/PlatformRevenue.tsx` — Revenue labels
- `src/pages/admin/PlatformProductLibrary.tsx` — Product library
- `src/pages/admin/PlatformLandingPageLibrary.tsx` — Page library
- `src/pages/admin/PlatformComponentLibrary.tsx` — Component library
- `src/pages/admin/PlatformCustomerBase.tsx` — Customer base
- `src/pages/admin/ApiPaymentGateway.tsx` — Payment gateway setup
- `src/pages/admin/AllShops.tsx` — Shop management
- `src/pages/admin/AllowedDomains.tsx` — Domain management
- `src/pages/admin/PricingPlans.tsx` — Plan management
- `src/pages/admin/Webhooks.tsx` — Webhook config
- `src/pages/admin/Tracking.tsx` — Tracking events
- `src/pages/admin/TrackingProfiles.tsx` — Tracking profiles
- `src/pages/admin/Media.tsx` — Media management
- `src/pages/admin/MarketingSMS.tsx`, `MarketingEmail.tsx`, `MarketingWhatsApp.tsx`
- `src/pages/admin/InboxMessenger.tsx`, `InboxWhatsapp.tsx`
- Other admin pages with Bengali strings

**4. Admin Components (~20 files)**
- `src/components/admin/AdminSidebar.tsx` — Any hardcoded labels
- `src/components/admin/CreateShopDialog.tsx` — Shop creation form
- `src/components/admin/CreateShopForUserDialog.tsx` — Admin shop creation
- `src/components/admin/ShopManageModal.tsx` — Shop management
- `src/components/admin/SubdomainSetupHelper.tsx` — Setup steps
- `src/components/admin/messenger/*` — Chat window, add page modal
- `src/components/admin/orders/*` — Order filters, table, details
- `src/components/admin/courier/*` — Courier modals
- `src/components/admin/landing-page-editor/*` — Editor labels
- `src/components/admin/dashboard/*` — Dashboard components

**5. Shop Panel (~8 files)**
- `src/pages/shop/ShopDashboard.tsx` — KPIs, charts, labels
- `src/pages/shop/ShopLogin.tsx` — Login form
- `src/pages/shop/ShopOnboarding.tsx` — Onboarding
- `src/pages/shop/ShopPages.tsx` — Placeholder pages
- `src/components/shop/ShopSwitcher.tsx` — Shop selector
- `src/components/shop/ShopStatusGuard.tsx` — Subscription expiry
- `src/components/shop/UserMenu.tsx` — Logout label
- `src/components/shop/GlobalAnnouncementBanner.tsx` — Maintenance message

**6. Hooks & Utils (~5 files)**
- `src/hooks/useOrderNotification.ts` — Notification messages
- `src/hooks/usePricingPlans.ts` — Toast messages
- `src/hooks/useFacebookLogin.ts` — Error messages
- `src/hooks/useAISuggestion.ts` — Rate limit toast
- `src/hooks/useShopPermissions.ts` — Role descriptions

**7. Contexts & Validation (~2 files)**
- `src/contexts/ShopContext.tsx` — Error messages
- `src/lib/validations/shopValidation.ts` — Validation messages

**8. Other Pages (~3 files)**
- `src/pages/Checkout.tsx` — Checkout flow
- `src/pages/PurchaseSuccess.tsx` — Payment result
- `src/pages/ThankYou.tsx` — Thank you page

### Implementation Strategy

Due to the volume (~80 files), this will be implemented in **4-5 batches**:

1. **Batch 1**: Auth pages, contexts, hooks, utils (foundational strings)
2. **Batch 2**: Admin pages (`src/pages/admin/*`)
3. **Batch 3**: Admin components (`src/components/admin/*`)
4. **Batch 4**: Shop pages/components + Landing/public pages

Each Bengali string will be replaced with its natural English equivalent. The `t()` locale system will remain intact for pages already using it (those will automatically show English since the locale files already have English translations).

### What Will NOT Change
- The `bn.ts` locale file (kept for future use)
- The `LanguageContext` and `LanguageToggle` (kept but can be removed later if desired)
- The `LandingPage.tsx` dynamic renderer (shop landing pages are user-generated content)

