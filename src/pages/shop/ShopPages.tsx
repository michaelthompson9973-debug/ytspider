/**
 * Shop Area Page Wrappers
 * These components wrap the shared content components with ShopLayout
 * for the shop owner experience (separate from Admin area)
 */

import { ShopLayout } from '@/components/shop';
import { ProductsContent } from '@/components/admin/products';
import { useShop } from '@/contexts/ShopContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShopGuard } from '@/components/admin/ShopGuard';

// Products Page for Shop Owners - Uses shared content
export function ShopProductsPage() {
  return (
    <ShopLayout>
      <ProductsContent />
    </ShopLayout>
  );
}

// Orders Page for Shop Owners
export function ShopOrdersPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="অর্ডার" description="অর্ডার ম্যানেজমেন্ট শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Landing Pages for Shop Owners
export function ShopLandingPagesPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="ল্যান্ডিং পেজ" description="ল্যান্ডিং পেজ বিল্ডার শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Component Library for Shop Owners
export function ShopComponentLibraryPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="কম্পোনেন্ট লাইব্রেরী" description="কম্পোনেন্ট লাইব্রেরী শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Media for Shop Owners
export function ShopMediaPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="মিডিয়া" description="মিডিয়া লাইব্রেরী শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Inbox Messenger for Shop Owners
export function ShopInboxMessengerPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="মেসেঞ্জার ইনবক্স" description="মেসেঞ্জার ইন্টিগ্রেশন শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Tracking for Shop Owners
export function ShopTrackingPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="ট্র্যাকিং" description="ট্র্যাকিং সেটআপ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Courier for Shop Owners
export function ShopCourierPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="কুরিয়ার" description="কুরিয়ার ইন্টিগ্রেশন শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// AI Settings for Shop Owners
export function ShopAiPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="AI সেটিংস" description="AI অটো-রিপ্লাই সেটআপ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Team for Shop Owners
export function ShopTeamPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="টিম মেম্বার" description="টিম ম্যানেজমেন্ট শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Subscription for Shop Owners
export function ShopSubscriptionPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="সাবস্ক্রিপশন" description="বিলিং ও প্ল্যান ম্যানেজমেন্ট শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Analytics for Shop Owners
export function ShopAnalyticsPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="অ্যানালিটিক্স" description="শপ অ্যানালিটিক্স শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Settings for Shop Owners
export function ShopSettingsPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="সেটিংস" description="শপ সেটিংস শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Placeholder component for pages not yet implemented
function PlaceholderPage({ title, description }: { title: string; description: string }) {
  const { currentShop } = useShop();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{currentShop?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-12">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
