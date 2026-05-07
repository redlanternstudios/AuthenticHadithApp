import { useRevenueCatSubscription } from './useRevenueCatSubscription'

/**
 * Backward-compatible subscription hook that now uses RevenueCat.
 */
export function useSubscription() {
  const {
    isPro,
    isLoading,
    expirationDate,
    willRenew,
    productIdentifier,
  } = useRevenueCatSubscription()

  return {
    data: isPro
      ? {
          id: productIdentifier ?? 'revenuecat',
          user_id: '',
          status: 'active' as const,
          current_period_end: expirationDate ?? '',
          cancel_at_period_end: !willRenew,
        }
      : null,
    isLoading,
    error: null,
  }
}
