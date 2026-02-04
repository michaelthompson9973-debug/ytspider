import { useLanguage } from '@/contexts/LanguageContext';
import { useShop } from '@/contexts/ShopContext';
import { useBillingUsage } from '@/hooks/useBillingUsage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Lock, Sparkles, ArrowUpRight } from 'lucide-react';
import { PLAN_LIMITS, PLAN_PRICES, type PlanType } from '@/lib/planLimits';
import { cn } from '@/lib/utils';

interface PlanFeature {
  key: string;
  getValue: (plan: PlanType) => string | number;
  included: (plan: PlanType) => boolean;
}

const PLAN_FEATURES: PlanFeature[] = [
  {
    key: 'shops',
    getValue: (plan) => PLAN_LIMITS[plan].shops === Infinity ? '∞' : PLAN_LIMITS[plan].shops,
    included: () => true,
  },
  {
    key: 'ordersPerMonth',
    getValue: (plan) => PLAN_LIMITS[plan].ordersPerMonth === Infinity ? '∞' : PLAN_LIMITS[plan].ordersPerMonth,
    included: () => true,
  },
  {
    key: 'teamMembers',
    getValue: (plan) => PLAN_LIMITS[plan].teamMembers === Infinity ? '∞' : PLAN_LIMITS[plan].teamMembers,
    included: () => true,
  },
  {
    key: 'basicSupport',
    getValue: () => '',
    included: () => true,
  },
  {
    key: 'prioritySupport',
    getValue: () => '',
    included: (plan) => plan === 'pro' || plan === 'enterprise',
  },
  {
    key: 'analytics',
    getValue: () => '',
    included: (plan) => plan === 'pro' || plan === 'enterprise',
  },
  {
    key: 'customBranding',
    getValue: () => '',
    included: (plan) => plan === 'pro' || plan === 'enterprise',
  },
  {
    key: 'customSLA',
    getValue: () => '',
    included: (plan) => plan === 'enterprise',
  },
  {
    key: 'dedicatedManager',
    getValue: () => '',
    included: (plan) => plan === 'enterprise',
  },
];

interface PlanTabContentProps {
  plan: PlanType;
  currentPlan: PlanType;
  usageStats: ReturnType<typeof useBillingUsage>['usageStats'];
}

function PlanTabContent({ plan, currentPlan, usageStats }: PlanTabContentProps) {
  const { t } = useLanguage();
  const isCurrentPlan = plan === currentPlan;
  const price = PLAN_PRICES[plan];

  const planNames: Record<PlanType, string> = {
    free: t('billing.free'),
    pro: t('billing.pro'),
    enterprise: t('billing.enterprise'),
  };

  // Calculate what would unlock with upgrade
  const getUnlockValue = (key: string): string | null => {
    if (isCurrentPlan) return null;
    
    const currentLimits = PLAN_LIMITS[currentPlan];
    const newLimits = PLAN_LIMITS[plan];
    
    switch (key) {
      case 'shops':
        if (newLimits.shops > currentLimits.shops) {
          const diff = newLimits.shops === Infinity ? '∞' : `+${newLimits.shops - currentLimits.shops}`;
          return `${diff} ${t('billing.features.shops')}`;
        }
        break;
      case 'ordersPerMonth':
        if (newLimits.ordersPerMonth > currentLimits.ordersPerMonth) {
          return t('billing.unlimitedOrders');
        }
        break;
      case 'teamMembers':
        if (newLimits.teamMembers > currentLimits.teamMembers) {
          const diff = newLimits.teamMembers === Infinity ? '∞' : `+${newLimits.teamMembers - currentLimits.teamMembers}`;
          return `${diff} ${t('billing.features.teamMembers')}`;
        }
        break;
    }
    return null;
  };

  const unlocks = ['shops', 'ordersPerMonth', 'teamMembers']
    .map(key => getUnlockValue(key))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{planNames[plan]} {t('billing.planLabel')}</h3>
          {price > 0 ? (
            <p className="text-2xl font-bold font-digit mt-1">
              ৳{price}<span className="text-sm font-normal text-muted-foreground">{t('billing.perMonth')}</span>
            </p>
          ) : (
            <p className="text-lg text-muted-foreground mt-1">{t('billing.freeForever')}</p>
          )}
        </div>
        {plan === 'pro' && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
            <Sparkles className="h-3 w-3 mr-1" />
            {t('billing.mostPopular')}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          {t('billing.whatYouGet')}:
        </h4>
        <ul className="space-y-2 pl-6">
          {PLAN_FEATURES.map((feature) => {
            const isIncluded = feature.included(plan);
            const value = feature.getValue(plan);
            
            return (
              <li 
                key={feature.key}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  !isIncluded && "text-muted-foreground line-through"
                )}
              >
                {isIncluded ? (
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span>
                  {value && <span className="font-medium">{value} </span>}
                  {t(`billing.features.${feature.key}`)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {!isCurrentPlan && unlocks.length > 0 && (
        <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
          <h4 className="font-medium flex items-center gap-2 text-primary">
            🔓 {t('billing.whatUnlocks')}:
          </h4>
          <ul className="space-y-2 pl-6">
            {unlocks.map((unlock, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <ArrowUpRight className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{unlock}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button 
        className="w-full" 
        variant={isCurrentPlan ? "outline" : "default"}
        disabled={isCurrentPlan}
        size="lg"
      >
        {isCurrentPlan ? (
          t('billing.currentPlanBtn')
        ) : plan === 'enterprise' ? (
          t('billing.contactSales')
        ) : (
          <>
            {t('billing.upgradeNowBtn')} - ৳{price}{t('billing.perMonth')}
          </>
        )}
      </Button>
    </div>
  );
}

export function PlanComparison() {
  const { t } = useLanguage();
  const { currentShop } = useShop();
  const { usageStats } = useBillingUsage();
  
  const currentPlan = (currentShop?.plan as PlanType) || 'free';

  return (
    <Card>
      <CardHeader>
        <CardTitle>📋 {t('billing.planComparison')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={currentPlan === 'free' ? 'pro' : currentPlan}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="free">{t('billing.free')}</TabsTrigger>
            <TabsTrigger value="pro" className="relative">
              {t('billing.pro')}
              {currentPlan === 'free' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="enterprise">{t('billing.enterprise')}</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="free">
              <PlanTabContent plan="free" currentPlan={currentPlan} usageStats={usageStats} />
            </TabsContent>
            <TabsContent value="pro">
              <PlanTabContent plan="pro" currentPlan={currentPlan} usageStats={usageStats} />
            </TabsContent>
            <TabsContent value="enterprise">
              <PlanTabContent plan="enterprise" currentPlan={currentPlan} usageStats={usageStats} />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
