import { useLanguage } from '@/contexts/LanguageContext';
import { useShop } from '@/contexts/ShopContext';
import { useInvoiceHistory } from '@/hooks/useInvoiceHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Calendar, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLAN_PRICES, type PlanType } from '@/lib/planLimits';
import { Skeleton } from '@/components/ui/skeleton';

interface CurrentPlanCardProps {
  onChangePlan?: () => void;
  onViewHistory?: () => void;
}

export function CurrentPlanCard({ onChangePlan, onViewHistory }: CurrentPlanCardProps) {
  const { t, language } = useLanguage();
  const { currentShop } = useShop();
  const { nextBillingDate, isLoading } = useInvoiceHistory();

  const plan = (currentShop?.plan as PlanType) || 'free';
  const price = PLAN_PRICES[plan];

  // Use real next billing date from subscription
  const displayBillingDate = nextBillingDate || null;

  const planNames: Record<PlanType, string> = {
    free: t('billing.free'),
    pro: t('billing.pro'),
    enterprise: t('billing.enterprise'),
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          👑 {t('billing.currentPlan')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-lg border bg-accent/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold capitalize">
                  {planNames[plan]} {t('billing.planLabel')}
                </h3>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-600 border-emerald-600 dark:text-emerald-400 dark:border-emerald-400">
              🟢 {t('billing.active')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{t('billing.nextBilling')}:</span>
              {isLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <span className="font-medium text-foreground">
                  {formatDate(displayBillingDate)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span>{t('billing.monthlyCost')}:</span>
              <span className="font-medium text-foreground font-digit">
                ৳{price}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onChangePlan}>
              {t('billing.changePlan')}
            </Button>
            <Button variant="ghost" onClick={onViewHistory}>
              {t('billing.billingHistory')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
