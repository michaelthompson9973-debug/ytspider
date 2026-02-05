import { useLanguage } from '@/contexts/LanguageContext';
import { useShop } from '@/contexts/ShopContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Bell } from 'lucide-react';
import {
  UsageOverview,
  CurrentPlanCard,
  BillingHistory,
} from '@/components/admin/billing';

export default function ShopSubscription() {
  const { t } = useLanguage();
  const { currentShop } = useShop();

  if (!currentShop) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t('subscription.noShop')}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t('subscription.title')}</h1>
            <p className="text-muted-foreground">{t('subscription.subtitle')}</p>
          </div>
        </div>

        {/* Current Plan - Shows subscription status */}
        <CurrentPlanCard 
          onChangePlan={() => {
            // Navigate to pricing page for upgrade
            window.open('/pricing', '_blank');
          }}
          onViewHistory={() => {
            // Scroll to billing history
            document.getElementById('billing-history')?.scrollIntoView({ 
              behavior: 'smooth' 
            });
          }}
        />

        {/* Usage Overview - Real data from database */}
        <UsageOverview />

        {/* Billing History */}
        <div id="billing-history">
          <BillingHistory />
        </div>
      </div>
    </AdminLayout>
  );
}
