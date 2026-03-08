export interface LibraryComponent {
  id: string;
  name: string;
  category: string;
  html: string;
  thumbnail_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  min_plan_tier: string;
  shop_id?: string | null;
  is_approved?: boolean | null;
}

export const componentCategories = [
  { value: 'hero', label: 'Hero' },
  { value: 'features', label: 'Features' },
  { value: 'cta', label: 'CTA' },
  { value: 'faq', label: 'FAQ' },
  { value: 'testimonial', label: 'Testimonial' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'footer', label: 'Footer' },
  { value: 'general', label: 'General' },
] as const;

export type ComponentCategory = typeof componentCategories[number]['value'];

/** Plan tier hierarchy — higher index = higher tier */
const PLAN_HIERARCHY = ['free', 'pro', 'enterprise'] as const;

/** Returns true if the user's plan meets or exceeds the required tier */
export function canAccessComponent(userPlan: string, requiredTier: string): boolean {
  const userIndex = PLAN_HIERARCHY.indexOf(userPlan as any);
  const requiredIndex = PLAN_HIERARCHY.indexOf(requiredTier as any);
  // Unknown plans default to free (index 0); unknown tiers default to accessible
  if (requiredIndex === -1) return true;
  return (userIndex === -1 ? 0 : userIndex) >= requiredIndex;
}
