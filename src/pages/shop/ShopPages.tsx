/**
 * Shop Area Page Wrappers
 * These components wrap the admin page content with ShopLayout
 * instead of AdminLayout for the shop owner experience
 */

import { ShopLayout } from '@/components/shop';
import { ShopGuard } from '@/components/admin/ShopGuard';

// We need to create lightweight wrappers that use ShopLayout
// For now, these are placeholder components that will be enhanced

import { useShop } from '@/contexts/ShopContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Products Page for Shop Owners
export function ShopProductsPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="প্রোডাক্ট" description="এই পেজ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Orders Page for Shop Owners
export function ShopOrdersPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="অর্ডার" description="এই পেজ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Landing Pages for Shop Owners
export function ShopLandingPagesPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="ল্যান্ডিং পেজ" description="এই পেজ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Component Library for Shop Owners
export function ShopComponentLibraryPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="কম্পোনেন্ট লাইব্রেরী" description="এই পেজ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Media for Shop Owners
export function ShopMediaPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="মিডিয়া" description="এই পেজ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Inbox Messenger for Shop Owners
export function ShopInboxMessengerPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="মেসেঞ্জার ইনবক্স" description="এই পেজ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Tracking for Shop Owners
export function ShopTrackingPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="ট্র্যাকিং" description="এই পেজ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Courier for Shop Owners
export function ShopCourierPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="কুরিয়ার সেটিংস" description="এই পেজ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// AI Settings for Shop Owners
export function ShopAiPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="AI সেটিংস" description="এই পেজ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Team for Shop Owners
export function ShopTeamPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="টিম মেম্বার" description="এই পেজ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Subscription for Shop Owners
export function ShopSubscriptionPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="সাবস্ক্রিপশন" description="এই পেজ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Analytics for Shop Owners
export function ShopAnalyticsPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="অ্যানালিটিক্স" description="এই পেজ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Settings for Shop Owners
export function ShopSettingsPage() {
  return (
    <ShopLayout>
      <ShopGuard>
        <PlaceholderPage title="সেটিংস" description="এই পেজ শীঘ্রই আসছে" />
      </ShopGuard>
    </ShopLayout>
  );
}

// Placeholder component
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
          <p className="text-muted-foreground text-center py-8">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
