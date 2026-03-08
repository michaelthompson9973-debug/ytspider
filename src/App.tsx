import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ShopProvider } from "@/contexts/ShopContext";
import { AdminThemeProvider } from "@/contexts/AdminThemeContext";

import ProtectedRoute from "@/components/ProtectedRoute";
import { ShopProtectedRoute } from "@/components/shop/ShopProtectedRoute";
import { ShopLayout } from "@/components/shop";
import { ShopGuard } from "@/components/admin/ShopGuard";

// Auth pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ShopLogin from "./pages/shop/ShopLogin";

// Super Admin pages (Platform Admin)
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import LandingPages from "./pages/admin/LandingPages";
import LandingPageBuilder from "./pages/admin/LandingPageBuilder";
import ComponentLibrary from "./pages/admin/ComponentLibrary";
import Orders from "./pages/admin/Orders";
import Media from "./pages/admin/Media";
import Tracking from "./pages/admin/Tracking";
import TrackingProfiles from "./pages/admin/TrackingProfiles";
import Webhooks from "./pages/admin/Webhooks";
import AllowedDomains from "./pages/admin/AllowedDomains";
import ApiAi from "./pages/admin/ApiAi";
import ApiFraudCheck from "./pages/admin/ApiFraudCheck";
import ApiCourier from "./pages/admin/ApiCourier";
import ApiMessenger from "./pages/admin/ApiMessenger";
import ApiWhatsapp from "./pages/admin/ApiWhatsapp";
import ApiPaymentGateway from "./pages/admin/ApiPaymentGateway";
import InboxMessenger from "./pages/admin/InboxMessenger";
import InboxWhatsapp from "./pages/admin/InboxWhatsapp";
import Settings from "./pages/admin/Settings";
import TeamMembers from "./pages/admin/TeamMembers";
import AllShops from "./pages/admin/AllShops";
import ShopSubscription from "./pages/admin/ShopSubscription";
import ShopSecurity from "./pages/admin/ShopSecurity";
import ShopAnalytics from "./pages/admin/ShopAnalytics";
import ShopAuditLog from "./pages/admin/ShopAuditLog";
import PricingPlans from "./pages/admin/PricingPlans";

// Platform Libraries (Super Admin)
import PlatformProductLibrary from "./pages/admin/PlatformProductLibrary";
import PlatformLandingPageLibrary from "./pages/admin/PlatformLandingPageLibrary";
import PlatformComponentLibrary from "./pages/admin/PlatformComponentLibrary";
import PlatformCustomerBase from "./pages/admin/PlatformCustomerBase";
import PlatformRevenue from "./pages/admin/PlatformRevenue";

// Marketing (Super Admin)
import MarketingWhatsApp from "./pages/admin/MarketingWhatsApp";
import MarketingSMS from "./pages/admin/MarketingSMS";
import MarketingEmail from "./pages/admin/MarketingEmail";

// Shop Owner pages
import ShopDashboard from "./pages/shop/ShopDashboard";
import ShopOnboarding from "./pages/shop/ShopOnboarding";
import ShopCustomers from "./pages/shop/ShopCustomers";
import ShopCoupons from "./pages/shop/ShopCoupons";
import ShopReturns from "./pages/shop/ShopReturns";
import ShopCOD from "./pages/shop/ShopCOD";
import { ShopProductsPage, ShopOrdersPage, ShopLandingPagesPage, ShopComponentLibraryPage, ShopMediaPage, ShopInboxMessengerPage, ShopTrackingPage, ShopCourierPage, ShopAiPage, ShopTeamPage, ShopSecurityPage, ShopSubscriptionPage, ShopAnalyticsPage, ShopSettingsPage } from "./pages/shop/ShopPages";

// Public pages
import LandingPage from "./pages/LandingPage";
import ThankYou from "./pages/ThankYou";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import PurchaseSuccess from "./pages/PurchaseSuccess";

const queryClient = new QueryClient();

// App component with proper provider order
const App = () => (
  <AdminThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ShopProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Root redirect */}
                <Route path="/" element={<Index />} />
                
                {/* Auth Routes */}
                <Route path="/admin/login" element={<Auth />} />
                <Route path="/auth" element={<Navigate to="/admin/login" replace />} />
                <Route path="/shop/register" element={<Register />} />
                <Route path="/register" element={<Navigate to="/shop/register" replace />} />
                <Route path="/shop/login" element={<ShopLogin />} />
                <Route path="/login" element={<Navigate to="/shop/login" replace />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* ================================== */}
                {/* SHOP OWNER AREA (/shop/*) */}
                {/* For business owners to manage their shops */}
                {/* ================================== */}
                <Route path="/shop" element={<ShopProtectedRoute><ShopDashboard /></ShopProtectedRoute>} />
                <Route path="/shop/onboarding" element={<ShopOnboarding />} />
                <Route path="/shop/products" element={<ShopProtectedRoute><ShopProductsPage /></ShopProtectedRoute>} />
                <Route path="/shop/orders" element={<ShopProtectedRoute><ShopOrdersPage /></ShopProtectedRoute>} />
                <Route path="/shop/customers" element={<ShopProtectedRoute><ShopCustomers /></ShopProtectedRoute>} />
                <Route path="/shop/coupons" element={<ShopProtectedRoute><ShopCoupons /></ShopProtectedRoute>} />
                <Route path="/shop/returns" element={<ShopProtectedRoute><ShopReturns /></ShopProtectedRoute>} />
                <Route path="/shop/cod" element={<ShopProtectedRoute><ShopCOD /></ShopProtectedRoute>} />
                <Route path="/shop/pages" element={<Navigate to="/shop/pages/manage" replace />} />
                <Route path="/shop/pages/manage" element={<ShopProtectedRoute><ShopLandingPagesPage /></ShopProtectedRoute>} />
                <Route path="/shop/pages/builder/:pageId" element={<ShopProtectedRoute><LandingPageBuilder /></ShopProtectedRoute>} />
                <Route path="/shop/pages/library" element={<ShopProtectedRoute><ShopComponentLibraryPage /></ShopProtectedRoute>} />
                <Route path="/shop/media" element={<ShopProtectedRoute><ShopMediaPage /></ShopProtectedRoute>} />
                <Route path="/shop/inbox" element={<Navigate to="/shop/inbox/messenger" replace />} />
                <Route path="/shop/inbox/messenger" element={<ShopProtectedRoute><ShopInboxMessengerPage /></ShopProtectedRoute>} />
                <Route path="/shop/tracking" element={<ShopProtectedRoute><ShopTrackingPage /></ShopProtectedRoute>} />
                <Route path="/shop/courier" element={<ShopProtectedRoute><ShopCourierPage /></ShopProtectedRoute>} />
                <Route path="/shop/ai" element={<ShopProtectedRoute><ShopAiPage /></ShopProtectedRoute>} />
                <Route path="/shop/team" element={<ShopProtectedRoute><ShopTeamPage /></ShopProtectedRoute>} />
                <Route path="/shop/security" element={<ShopProtectedRoute><ShopSecurityPage /></ShopProtectedRoute>} />
                <Route path="/shop/subscription" element={<ShopProtectedRoute><ShopSubscriptionPage /></ShopProtectedRoute>} />
                <Route path="/shop/analytics" element={<ShopProtectedRoute><ShopAnalyticsPage /></ShopProtectedRoute>} />
                <Route path="/shop/settings" element={<ShopProtectedRoute><ShopSettingsPage /></ShopProtectedRoute>} />
                
                {/* ================================== */}
                {/* SUPER ADMIN AREA (/admin/*) */}
                {/* Platform administration - requires admin role */}
                {/* ================================== */}
                <Route path="/admin" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />
                <Route path="/admin/products" element={<ProtectedRoute requireAdmin><Products /></ProtectedRoute>} />
                <Route path="/admin/pages" element={<Navigate to="/admin/pages/manage" replace />} />
                <Route path="/admin/pages/manage" element={<ProtectedRoute requireAdmin><LandingPages /></ProtectedRoute>} />
                <Route path="/admin/pages/builder/:pageId" element={<ProtectedRoute requireAdmin><LandingPageBuilder /></ProtectedRoute>} />
                <Route path="/admin/pages/library" element={<ProtectedRoute requireAdmin><ComponentLibrary /></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><Orders /></ProtectedRoute>} />
                <Route path="/admin/media" element={<ProtectedRoute requireAdmin><Media /></ProtectedRoute>} />
                <Route path="/admin/tracking" element={<ProtectedRoute requireAdmin><Tracking /></ProtectedRoute>} />
                <Route path="/admin/tracking/profiles" element={<ProtectedRoute requireAdmin><TrackingProfiles /></ProtectedRoute>} />
                <Route path="/admin/inbox" element={<Navigate to="/admin/inbox/messenger" replace />} />
                <Route path="/admin/inbox/messenger" element={<ProtectedRoute requireAdmin><InboxMessenger /></ProtectedRoute>} />
                <Route path="/admin/inbox/whatsapp" element={<ProtectedRoute requireAdmin><InboxWhatsapp /></ProtectedRoute>} />
                <Route path="/admin/webhooks" element={<ProtectedRoute requireAdmin><Webhooks /></ProtectedRoute>} />
                <Route path="/admin/domains" element={<ProtectedRoute requireAdmin><AllowedDomains /></ProtectedRoute>} />
                <Route path="/admin/api" element={<Navigate to="/admin/api/payment-gateway" replace />} />
                <Route path="/admin/api/payment-gateway" element={<ProtectedRoute requireAdmin><ApiPaymentGateway /></ProtectedRoute>} />
                <Route path="/admin/api/ai" element={<ProtectedRoute requireAdmin><ApiAi /></ProtectedRoute>} />
                <Route path="/admin/api/fraud-check" element={<ProtectedRoute requireAdmin><ApiFraudCheck /></ProtectedRoute>} />
                <Route path="/admin/api/courier" element={<ProtectedRoute requireAdmin><ApiCourier /></ProtectedRoute>} />
                <Route path="/admin/api/messaging/messenger" element={<ProtectedRoute requireAdmin><ApiMessenger /></ProtectedRoute>} />
                <Route path="/admin/api/messaging/whatsapp" element={<ProtectedRoute requireAdmin><ApiWhatsapp /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><Settings /></ProtectedRoute>} />
                
                {/* Business Management (Platform Admin) */}
                <Route path="/admin/business" element={<Navigate to="/admin/business/shops" replace />} />
                <Route path="/admin/business/shops" element={<ProtectedRoute requireAdmin><AllShops /></ProtectedRoute>} />
                <Route path="/admin/business/team" element={<ProtectedRoute requireAdmin><TeamMembers /></ProtectedRoute>} />
                <Route path="/admin/business/subscription" element={<ProtectedRoute requireAdmin><ShopSubscription /></ProtectedRoute>} />
                <Route path="/admin/business/security" element={<ProtectedRoute requireAdmin><ShopSecurity /></ProtectedRoute>} />
                <Route path="/admin/business/analytics" element={<ProtectedRoute requireAdmin><ShopAnalytics /></ProtectedRoute>} />
                <Route path="/admin/business/audit-log" element={<ProtectedRoute requireAdmin><ShopAuditLog /></ProtectedRoute>} />
                <Route path="/admin/platform/pricing" element={<ProtectedRoute requireAdmin><PricingPlans /></ProtectedRoute>} />
                <Route path="/admin/platform/revenue" element={<ProtectedRoute requireAdmin><PlatformRevenue /></ProtectedRoute>} />
                
                {/* Platform Libraries (Super Admin) */}
                <Route path="/admin/platform/libraries" element={<Navigate to="/admin/platform/libraries/products" replace />} />
                <Route path="/admin/platform/libraries/products" element={<ProtectedRoute requireAdmin><PlatformProductLibrary /></ProtectedRoute>} />
                <Route path="/admin/platform/libraries/landing-pages" element={<ProtectedRoute requireAdmin><PlatformLandingPageLibrary /></ProtectedRoute>} />
                <Route path="/admin/platform/libraries/components" element={<ProtectedRoute requireAdmin><PlatformComponentLibrary /></ProtectedRoute>} />
                <Route path="/admin/platform/libraries/customers" element={<ProtectedRoute requireAdmin><PlatformCustomerBase /></ProtectedRoute>} />
                
                {/* Marketing (Super Admin) */}
                <Route path="/admin/platform/marketing" element={<Navigate to="/admin/platform/marketing/whatsapp" replace />} />
                <Route path="/admin/platform/marketing/whatsapp" element={<ProtectedRoute requireAdmin><MarketingWhatsApp /></ProtectedRoute>} />
                <Route path="/admin/platform/marketing/sms" element={<ProtectedRoute requireAdmin><MarketingSMS /></ProtectedRoute>} />
                <Route path="/admin/platform/marketing/email" element={<ProtectedRoute requireAdmin><MarketingEmail /></ProtectedRoute>} />
                
                {/* ================================== */}
                {/* PUBLIC PAGES */}
                {/* ================================== */}
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/purchase-success" element={<PurchaseSuccess />} />
                <Route path="/thank-you" element={<ThankYou />} />
                <Route path="/accept-invite" element={<AcceptInvite />} />
                <Route path="/p/:slug" element={<LandingPage />} />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ShopProvider>
      </AuthProvider>
    </QueryClientProvider>
  </AdminThemeProvider>
);

export default App;
