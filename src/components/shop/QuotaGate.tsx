/**
 * QuotaGate — Wraps "Create" buttons with plan limit enforcement.
 * Disables the action and shows an upgrade tooltip when at limit.
 *
 * Usage:
 * <QuotaGate resource="products">
 *   <Button onClick={handleCreate}>Add Product</Button>
 * </QuotaGate>
 */

import { useQuotaCheck, type QuotaResource } from '@/hooks/useQuotaCheck';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Crown } from 'lucide-react';
import React from 'react';

interface QuotaGateProps {
  resource: QuotaResource;
  children: React.ReactElement;
  /** Custom message when at limit */
  limitMessage?: string;
}

const RESOURCE_LABELS: Record<QuotaResource, string> = {
  products: 'products',
  landing_pages: 'landing pages',
  team_members: 'team members',
  orders: 'orders',
};

export function QuotaGate({ resource, children, limitMessage }: QuotaGateProps) {
  const { canCreate, current, limit, plan } = useQuotaCheck(resource);

  if (canCreate) return children;

  const message =
    limitMessage ||
    `Your ${plan} plan allows up to ${limit === Infinity ? 'unlimited' : limit} ${RESOURCE_LABELS[resource]}. Upgrade to add more.`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-block">
          {React.cloneElement(children, {
            disabled: true,
            className: `${children.props.className || ''} opacity-50 cursor-not-allowed`,
          })}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="flex items-start gap-2">
          <Crown className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm">{message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Used: {current}/{limit === Infinity ? '∞' : limit}
            </p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
