/**
 * QuotaUpsellBanner — Non-intrusive banner shown when a resource is near/at its limit.
 * Routes to /shop/subscription for upgrade.
 */

import { useQuotaCheck, type QuotaResource } from '@/hooks/useQuotaCheck';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Crown, ArrowRight } from 'lucide-react';

interface QuotaUpsellBannerProps {
  resource: QuotaResource;
}

const RESOURCE_LABELS: Record<QuotaResource, string> = {
  products: 'Products',
  landing_pages: 'Landing Pages',
  team_members: 'Team Members',
  orders: 'Monthly Orders',
};

export function QuotaUpsellBanner({ resource }: QuotaUpsellBannerProps) {
  const { current, limit, percentage, isNearLimit, isAtLimit, plan, isLoading } =
    useQuotaCheck(resource);
  const navigate = useNavigate();

  if (isLoading || limit === Infinity || (!isNearLimit && !isAtLimit)) return null;

  return (
    <div
      className={`rounded-lg border p-4 ${
        isAtLimit
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-primary/20 bg-primary/5'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Crown
            className={`h-5 w-5 mt-0.5 shrink-0 ${
              isAtLimit ? 'text-destructive' : 'text-primary'
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">
              {isAtLimit
                ? `${RESOURCE_LABELS[resource]} limit reached`
                : `Approaching ${RESOURCE_LABELS[resource].toLowerCase()} limit`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAtLimit
                ? `Your ${plan} plan allows ${limit} ${RESOURCE_LABELS[resource].toLowerCase()}. Upgrade to unlock more capacity.`
                : `You've used ${current} of ${limit} available ${RESOURCE_LABELS[resource].toLowerCase()}.`}
            </p>
            <Progress
              value={percentage}
              className="h-1.5 mt-2 max-w-xs"
            />
            <p className="text-xs text-muted-foreground mt-1 font-digit">
              {current} / {limit}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={isAtLimit ? 'default' : 'outline'}
          onClick={() => navigate('/shop/subscription')}
          className="shrink-0"
        >
          Upgrade Plan
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
