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
import Auth from "./pages/Auth";
import ShopLogin from "./pages/shop/ShopLogin";

// Super Admin pages (Platform Admin)
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import LandingPages from "./pages/admin/LandingPages";
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

// Shop Owner pages
import ShopDashboard from "./pages/shop/ShopDashboard";

// Shop area content wrappers (reuse admin page content with ShopLayout)
import { ShopProductsPage, ShopOrdersPage, ShopLandingPagesPage, ShopComponentLibraryPage, ShopMediaPage, ShopInboxMessengerPage, ShopTrackingPage, ShopCourierPage, ShopAiPage, ShopTeamPage, ShopSubscriptionPage, ShopAnalyticsPage, ShopSettingsPage } from "./pages/shop/ShopPages";

// Public pages
import LandingPage from "./pages/LandingPage";
import ThankYou from "./pages/ThankYou";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import PurchaseSuccess from "./pages/PurchaseSuccess";

const queryClient = new QueryClient();

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
                <Route path="/" element={<Navigate to="/shop" replace />} />
                
                {/* Auth Routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<ShopLogin />} />
                
                {/* ================================== */}
                {/* SHOP OWNER AREA (/shop/*) */}
                {/* For business owners to manage their shops */}
                {/* ================================== */}
                <Route path="/shop" element={<ShopProtectedRoute><ShopDashboard /></ShopProtectedRoute>} />
                <Route path="/shop/products" element={<ShopProtectedRoute><ShopProductsPage /></ShopProtectedRoute>} />
                <Route path="/shop/orders" element={<ShopProtectedRoute><ShopOrdersPage /></ShopProtectedRoute>} />
                <Route path="/shop/pages" element={<Navigate to="/shop/pages/manage" replace />} />
                <Route path="/shop/pages/manage" element={<ShopProtectedRoute><ShopLandingPagesPage /></ShopProtectedRoute>} />
                <Route path="/shop/pages/library" element={<ShopProtectedRoute><ShopComponentLibraryPage /></ShopProtectedRoute>} />
                <Route path="/shop/media" element={<ShopProtectedRoute><ShopMediaPage /></ShopProtectedRoute>} />
                <Route path="/shop/inbox" element={<Navigate to="/shop/inbox/messenger" replace />} />
                <Route path="/shop/inbox/messenger" element={<ShopProtectedRoute><ShopInboxMessengerPage /></ShopProtectedRoute>} />
                <Route path="/shop/tracking" element={<ShopProtectedRoute><ShopTrackingPage /></ShopProtectedRoute>} />
                <Route path="/shop/courier" element={<ShopProtectedRoute><ShopCourierPage /></ShopProtectedRoute>} />
                <Route path="/shop/ai" element={<ShopProtectedRoute><ShopAiPage /></ShopProtectedRoute>} />
                <Route path="/shop/team" element={<ShopProtectedRoute><ShopTeamPage /></ShopProtectedRoute>} />
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
                <Route path="/admin/api" element={<Navigate to="/admin/api/ai" replace />} />
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
