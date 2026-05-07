import { useRevenueCat } from '../lib/revenuecat/RevenueCatProvider'

export function usePremiumStatus() {
  const { isPro, isLoading } = useRevenueCat()

  return { isPremium: isPro, isLoading }
}
