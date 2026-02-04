import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ShopProvider } from "@/contexts/ShopContext";
import { AdminThemeProvider } from "@/contexts/AdminThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
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
import ShopBilling from "./pages/admin/ShopBilling";
import ShopSecurity from "./pages/admin/ShopSecurity";
import ShopAnalytics from "./pages/admin/ShopAnalytics";
import ShopAuditLog from "./pages/admin/ShopAuditLog";
import LandingPage from "./pages/LandingPage";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Main App component with all providers
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
                <Route path="/" element={<Navigate to="/admin" replace />} />
                <Route path="/auth" element={<Auth />} />
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
                {/* Business Management Routes */}
                <Route path="/admin/business" element={<Navigate to="/admin/business/shops" replace />} />
                <Route path="/admin/business/shops" element={<ProtectedRoute requireAdmin><AllShops /></ProtectedRoute>} />
                <Route path="/admin/business/team" element={<ProtectedRoute requireAdmin><TeamMembers /></ProtectedRoute>} />
                <Route path="/admin/business/billing" element={<ProtectedRoute requireAdmin><ShopBilling /></ProtectedRoute>} />
                <Route path="/admin/business/security" element={<ProtectedRoute requireAdmin><ShopSecurity /></ProtectedRoute>} />
                <Route path="/admin/business/analytics" element={<ProtectedRoute requireAdmin><ShopAnalytics /></ProtectedRoute>} />
                <Route path="/admin/business/audit-log" element={<ProtectedRoute requireAdmin><ShopAuditLog /></ProtectedRoute>} />
                <Route path="/thank-you" element={<ThankYou />} />
                <Route path="/p/:slug" element={<LandingPage />} />
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
