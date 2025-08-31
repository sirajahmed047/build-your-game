'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Performance optimized caching strategy
            staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
            gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
            retry: (failureCount, error) => {
              // Smart retry logic based on error type
              if (error instanceof Error) {
                // Don't retry on authentication errors
                if (error.message.includes('auth') || error.message.includes('unauthorized')) {
                  return false
                }
                // Don't retry on validation errors
                if (error.message.includes('validation') || error.message.includes('invalid')) {
                  return false
                }
              }
              // Retry up to 2 times for other errors
              return failureCount < 2
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
            refetchOnWindowFocus: false, // Prevent unnecessary refetches
            refetchOnReconnect: true, // Refetch when connection restored
            refetchOnMount: true, // Always refetch on component mount
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}