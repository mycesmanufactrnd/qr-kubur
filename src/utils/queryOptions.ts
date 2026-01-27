/**
 * Time constants in milliseconds for easy reuse
 */
export const ONE_MINUTE = 60_000;
export const FIVE_MINUTES = 5 * ONE_MINUTE;
export const TEN_MINUTES = 10 * ONE_MINUTE;

/**
 * TRPC Query Options
 * Commonly used with `trpc.someQuery.useQuery(...)`
 * 
 * @property staleTime - How long data is considered fresh before being "stale". 
 *   Stale data will not refetch on mount or window focus until expired.
 * @property refetchOnMount - Should the query refetch when the component mounts.
 *   If false, it will use cached data if available.
 * @property refetchOnReconnect - Should the query refetch when the network reconnects after going offline.
 * @property refetchOnWindowFocus - Should the query refetch when the window/tab gains focus.
 * @property enabled - Whether the query is enabled or not. Useful for conditional queries.
 * @property cacheTime - How long unused/inactive query data stays in cache before being garbage collected.
 * @property keepPreviousData - Keep the previous data while fetching new data (useful for pagination or filters)
 */
export const notificationQueryOptions = {
  staleTime: FIVE_MINUTES,
  refetchOnMount: false,
  refetchOnReconnect: true, 
  refetchOnWindowFocus: true,
};

export const coordinatesQueryOptions = {
  staleTime: ONE_MINUTE,
  refetchOnMount: false,
  refetchOnReconnect: true,
  refetchOnWindowFocus: false,
};

export const ipAddressQueryOptions = {
  staleTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
};
