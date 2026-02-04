import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useShop } from '@/contexts/ShopContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { CreditCard } from 'lucide-react';
import {
  UsageOverview,
  CurrentPlanCard,
  PlanComparison,
  PaymentMethodCard,
  BillingHistory,
} from '@/components/admin/billing';

export default function ShopBilling() {
  const { t } = useLanguage();
  const { currentShop } = useShop();
  const [showHistory, setShowHistory] = useState(false);

  if (!currentShop) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No shop selected</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t('billing.title')}</h1>
            <p className="text-muted-foreground">{t('billing.subtitle')}</p>
          </div>
        </div>

        {/* Usage Overview - Real data from database */}
        <UsageOverview />

        {/* Current Plan */}
        <CurrentPlanCard 
          onChangePlan={() => {
            // Scroll to plan comparison
            document.getElementById('plan-comparison')?.scrollIntoView({ 
              behavior: 'smooth' 
            });
          }}
          onViewHistory={() => setShowHistory(!showHistory)}
        />

        {/* Plan Comparison */}
        <div id="plan-comparison">
          <PlanComparison />
        </div>

        {/* Payment Method */}
        <PaymentMethodCard />

        {/* Billing History */}
        <BillingHistory limit={showHistory ? undefined : 3} />
      </div>
    </AdminLayout>
  );
}
