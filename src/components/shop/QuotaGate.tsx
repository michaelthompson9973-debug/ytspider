/**
 * QuotaGate — Wraps "Create" buttons with plan limit enforcement
 * 
 * Usage:
 * <QuotaGate resource="products">
 *   <Button onClick={handleCreate}>নতুন প্রোডাক্ট</Button>
 * </QuotaGate>
 * 
 * When at limit: shows disabled state + upgrade tooltip
 */

import { useQuotaCheck, type QuotaResource } from '@/hooks/useQuotaCheck';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import React from 'react';

interface QuotaGateProps {
  resource: QuotaResource;
  children: React.ReactElement;
  /** Custom message when at limit */
  limitMessage?: string;
}

const resourceLabels: Record<QuotaResource, string> = {
  products: 'প্রোডাক্ট',
  landingPages: 'ল্যান্ডিং পেজ',
  teamMembers: 'টিম মেম্বার',
  orders: 'অর্ডার',
};

export function QuotaGate({ resource, children, limitMessage }: QuotaGateProps) {
  const { canCreate, current, limit, isAtLimit, plan } = useQuotaCheck(resource);

  if (canCreate) {
    return children;
  }

  const message = limitMessage || 
    `আপনার ${plan} প্ল্যানে সর্বোচ্চ ${limit}টি ${resourceLabels[resource]} যোগ করা যায়। আপগ্রেড করুন!`;

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
          <Crown className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">{message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ব্যবহৃত: {current}/{limit === Infinity ? '∞' : limit}
            </p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
