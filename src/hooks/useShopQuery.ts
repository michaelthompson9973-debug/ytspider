import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useShop } from '@/contexts/ShopContext';

/**
 * A wrapper around useQuery that automatically adds shop_id to the query key
 * and passes the current shop ID to the query function.
 * 
 * Queries are automatically disabled when no shop is selected.
 */
export function useShopQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
>(
  key: string[],
  queryFn: (shopId: string) => Promise<TQueryFnData>,
  options?: Omit<UseQueryOptions<TQueryFnData, TError, TData>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  const { currentShop } = useShop();

  return useQuery({
    queryKey: [...key, currentShop?.id],
    queryFn: () => {
      if (!currentShop) {
        throw new Error('No shop selected');
      }
      return queryFn(currentShop.id);
    },
    enabled: !!currentShop && (options?.enabled !== false),
    ...options,
  });
}

/**
 * Hook to get the current shop ID for use in queries outside of useShopQuery
 */
export function useCurrentShopId(): string | null {
  const { currentShop } = useShop();
  return currentShop?.id ?? null;
}
