import { useLanguage } from '@/contexts/LanguageContext';
import { useShop } from '@/contexts/ShopContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Calendar, Wallet } from 'lucide-react';
import { PLAN_PRICES, type PlanType } from '@/lib/planLimits';

interface CurrentPlanCardProps {
  onChangePlan?: () => void;
  onViewHistory?: () => void;
}

export function CurrentPlanCard({ onChangePlan, onViewHistory }: CurrentPlanCardProps) {
  const { t } = useLanguage();
  const { currentShop } = useShop();

  const plan = (currentShop?.plan as PlanType) || 'free';
  const price = PLAN_PRICES[plan];

  // Mock next billing date (in real implementation, this would come from subscription data)
  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  nextBillingDate.setDate(15);

  const planNames: Record<PlanType, string> = {
    free: t('billing.free'),
    pro: t('billing.pro'),
    enterprise: t('billing.enterprise'),
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
              <span className="font-medium text-foreground">
                {nextBillingDate.toLocaleDateString('bn-BD', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
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
