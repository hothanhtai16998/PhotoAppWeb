import { QueryClient } from '@tanstack/react-query';

// Create a query client with optimized defaults for photo app
export const queryClient =
	new QueryClient({
		defaultOptions: {
			queries: {
				// Cache data for 5 minutes
				staleTime: 5 * 60 * 1000, // 5 minutes
				// Keep unused data in cache for 10 minutes
				gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
				// Retry failed requests 2 times
				retry: 2,
				// Refetch on window focus (good for keeping data fresh)
				refetchOnWindowFocus: true,
				// Don't refetch on mount if data is fresh
				refetchOnMount: false,
			},
			mutations: {
				// Retry failed mutations once
				retry: 1,
			},
		},
	});
