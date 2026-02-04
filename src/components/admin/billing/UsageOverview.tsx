import { useLanguage } from '@/contexts/LanguageContext';
import { useBillingUsage } from '@/hooks/useBillingUsage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Users, FileText, Store, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageItemProps {
  icon: React.ReactNode;
  label: string;
  current: number;
  limit: number;
  percentage: number;
  isAtLimit: boolean;
  isNearLimit: boolean;
}

function UsageItem({ icon, label, current, limit, percentage, isAtLimit, isNearLimit }: UsageItemProps) {
  const { t } = useLanguage();
  const isUnlimited = limit === Infinity;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        {isAtLimit && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {t('billing.limitReached')}
          </Badge>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-digit">{current}</span>
        <span className="text-muted-foreground">
          /{isUnlimited ? t('billing.features.unlimited') : limit}
        </span>
      </div>
      {!isUnlimited && (
        <Progress 
          value={percentage} 
          className={cn(
            "h-2",
            isAtLimit && "[&>div]:bg-destructive",
            isNearLimit && !isAtLimit && "[&>div]:bg-amber-500 dark:[&>div]:bg-amber-400"
          )}
        />
      )}
      {!isUnlimited && (
        <p className="text-xs text-muted-foreground">
          {percentage.toFixed(0)}%
        </p>
      )}
    </div>
  );
}

export function UsageOverview() {
  const { t } = useLanguage();
  const { usageStats, isLoading, hasAnyLimitReached } = useBillingUsage();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          📊 {t('billing.usage')}
        </CardTitle>
        <Badge variant="outline">{t('billing.thisMonth')}</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <UsageItem
            icon={<ShoppingCart className="h-4 w-4" />}
            label={t('billing.orders')}
            {...usageStats.orders}
          />
          <UsageItem
            icon={<Users className="h-4 w-4" />}
            label={t('billing.teamMembers')}
            {...usageStats.teamMembers}
          />
          <UsageItem
            icon={<FileText className="h-4 w-4" />}
            label={t('billing.pages')}
            {...usageStats.landingPages}
          />
          <UsageItem
            icon={<Store className="h-4 w-4" />}
            label={t('billing.shops')}
            {...usageStats.shops}
          />
        </div>

        {hasAnyLimitReached && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {t('billing.limitReachedWarning')}
              </span>
            </div>
            <Button size="sm" variant="destructive">
              {t('billing.upgradeNow')}
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
