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
 * Get date range for filter
 */
export const getDateRange = (filter: DateFilter): { start: Date | null; end: Date | null } => {
  const now = new Date();
  
  switch (filter) {
    case 'today':
      return { start: startOfDay(now), end: null };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: startOfDay(now) };
    case '7days':
      return { start: subDays(now, 7), end: null };
    case '30days':
      return { start: subDays(now, 30), end: null };
    case 'all':
    default:
      return { start: null, end: null };
  }
};

/**
 * Generate short order ID for display
 */
export const getShortOrderId = (id: string): string => {
  return `#${id.slice(0, 8).toUpperCase()}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number = 30): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Convert Bengali digits to English
 */
export const bengaliToEnglishDigits = (str: string): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[০-৯]/g, (match) => String(bengaliDigits.indexOf(match)));
};

/**
 * Normalize phone number for API calls
 */
export const normalizePhone = (phone: string): string => {
  let normalized = bengaliToEnglishDigits(phone).replace(/[\s\-()]/g, '');
  if (normalized.startsWith('+88')) {
    normalized = normalized.slice(3);
  } else if (normalized.startsWith('88')) {
    normalized = normalized.slice(2);
  }
  if (!normalized.startsWith('01') && normalized.length === 10) {
    normalized = '0' + normalized;
  }
  return normalized;
};
