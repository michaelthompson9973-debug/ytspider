import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import LandingPages from "./pages/admin/LandingPages";
import Orders from "./pages/admin/Orders";
import Media from "./pages/admin/Media";
import Tracking from "./pages/admin/Tracking";
import Webhooks from "./pages/admin/Webhooks";
import Domains from "./pages/admin/Domains";
import ApiSettings from "./pages/admin/ApiSettings";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute requireAdmin><Products /></ProtectedRoute>} />
            <Route path="/admin/pages" element={<ProtectedRoute requireAdmin><LandingPages /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><Orders /></ProtectedRoute>} />
            <Route path="/admin/media" element={<ProtectedRoute requireAdmin><Media /></ProtectedRoute>} />
            <Route path="/admin/tracking" element={<ProtectedRoute requireAdmin><Tracking /></ProtectedRoute>} />
            <Route path="/admin/webhooks" element={<ProtectedRoute requireAdmin><Webhooks /></ProtectedRoute>} />
            <Route path="/admin/domains" element={<ProtectedRoute requireAdmin><Domains /></ProtectedRoute>} />
            <Route path="/admin/api" element={<ProtectedRoute requireAdmin><ApiSettings /></ProtectedRoute>} />
            <Route path="/p/:slug" element={<LandingPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
