/**
 * useQuotaCheck — Frontend pre-flight quota check hook
 * 
 * Uses the existing useBillingUsage data to determine if a resource
 * can be created before hitting the server. Shows upgrade CTA when at limit.
 */

import { useBillingUsage } from './useBillingUsage';

export type QuotaResource = 'products' | 'landingPages' | 'teamMembers' | 'orders';

interface QuotaCheckResult {
  /** Whether the shop can create more of this resource */
  canCreate: boolean;
  /** Current count */
  current: number;
  /** Max allowed by plan */
  limit: number;
  /** Usage percentage (0-100) */
  percentage: number;
  /** Whether near the limit (80%+) */
  isNearLimit: boolean;
  /** Whether at the limit */
  isAtLimit: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Current plan name */
  plan: string;
}

export function useQuotaCheck(resource: QuotaResource): QuotaCheckResult {
  const { usageStats, plan, isLoading } = useBillingUsage();

  const stat = usageStats[resource];

  return {
    canCreate: !stat.isAtLimit,
    current: stat.current,
    limit: stat.limit,
    percentage: stat.percentage,
    isNearLimit: stat.isNearLimit,
    isAtLimit: stat.isAtLimit,
    isLoading,
    plan,
  };
}
