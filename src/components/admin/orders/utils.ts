import { formatDistanceToNow, format, isToday, isYesterday, subDays, startOfDay } from 'date-fns';
import { TrustLevel, DateFilter } from './types';

/**
 * Format currency with ৳ symbol
 */
export const formatCurrency = (amount: number | null, currency?: string | null): string => {
  if (amount === null || amount === undefined) return '-';
  const symbol = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : '৳';
  return `${symbol}${Number(amount).toLocaleString()}`;
};

/**
 * Format date as relative time
 */
export const formatRelativeTime = (date: string): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Format date
 */
export const formatDateBengali = (date: string, formatStr: string = 'dd MMM, HH:mm'): string => {
  return format(new Date(date), formatStr);
};

/**
 * Get trust level based on success rate
 */
export const getTrustLevel = (successRate: number | null): TrustLevel => {
  if (successRate === null) return 'new';
  if (successRate > 70) return 'trusted';
  if (successRate >= 50) return 'medium';
  return 'risky';
};

/**
 * Get trust badge config
 */
export const getTrustBadgeConfig = (level: TrustLevel): { emoji: string; label: string; color: string; bgColor: string } => {
  switch (level) {
    case 'trusted':
      return { emoji: '🟢', label: 'Trusted', color: 'text-green-700', bgColor: 'bg-green-100' };
    case 'medium':
      return { emoji: '🟡', label: 'Medium', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
    case 'risky':
      return { emoji: '🔴', label: 'Risky', color: 'text-red-700', bgColor: 'bg-red-100' };
    case 'new':
    default:
      return { emoji: '⚪', label: 'New', color: 'text-gray-700', bgColor: 'bg-gray-100' };
  }
};

/**
 * Get short order ID
 */
export const getShortOrderId = (id: string): string => {
  return '#' + id.substring(0, 8).toUpperCase();
};

/**
 * Get date range filter
 */
export const getDateRange = (filter: DateFilter): { from: Date; to: Date } => {
  const today = startOfDay(new Date());

  switch (filter) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday':
      const yesterday = subDays(today, 1);
      return { from: yesterday, to: yesterday };
    case '7days':
      const last7Days = subDays(today, 7);
      return { from: last7Days, to: today };
    case '30days':
      const last30Days = subDays(today, 30);
      return { from: last30Days, to: today };
    case 'all':
    default:
      return { from: new Date(0), to: today };
  }
};
