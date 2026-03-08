/**
 * Graceful error handler for Supabase mutations.
 * Catches RLS quota violations and returns user-friendly messages.
 */

import { toast } from 'sonner';

const QUOTA_PATTERNS = [
  'row-level security',
  'new row violates',
  'check_plan_quota',
  'is_shop_active',
];

export function handleMutationError(error: unknown, fallbackMessage = 'Operation failed') {
  const message = (error as Error)?.message || String(error);
  const lower = message.toLowerCase();

  // Detect quota / RLS violation
  if (QUOTA_PATTERNS.some((p) => lower.includes(p))) {
    toast.error('Plan limit reached', {
      description:
        'You have reached the maximum allowed by your current plan. Please upgrade to continue.',
      action: {
        label: 'Upgrade',
        onClick: () => {
          window.location.href = '/shop/subscription';
        },
      },
      duration: 8000,
    });
    return;
  }

  // Generic error
  toast.error(fallbackMessage, {
    description: message.length > 120 ? message.slice(0, 120) + '…' : message,
  });
}
