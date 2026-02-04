export type PlanType = 'free' | 'pro' | 'enterprise';

export interface PlanLimits {
  shops: number;
  ordersPerMonth: number;
  teamMembers: number;
  landingPages: number;
  products: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    shops: 1,
    ordersPerMonth: 100,
    teamMembers: 2,
    landingPages: 10,
    products: 50,
  },
  pro: {
    shops: 5,
    ordersPerMonth: Infinity,
    teamMembers: 10,
    landingPages: 100,
    products: 500,
  },
  enterprise: {
    shops: Infinity,
    ordersPerMonth: Infinity,
    teamMembers: Infinity,
    landingPages: Infinity,
    products: Infinity,
  },
};

export const PLAN_PRICES: Record<PlanType, number> = {
  free: 0,
  pro: 999,
  enterprise: 4999,
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanType] || PLAN_LIMITS.free;
}

export function isAtLimit(current: number, limit: number): boolean {
  return limit !== Infinity && current >= limit;
}

export function isNearLimit(current: number, limit: number, threshold = 0.8): boolean {
  return limit !== Infinity && current >= limit * threshold;
}

export function getUsagePercentage(current: number, limit: number): number {
  if (limit === Infinity) return 0;
  return Math.min((current / limit) * 100, 100);
}
