import { useState, useCallback } from 'react'
import Purchases, { PurchasesPackage } from 'react-native-purchases'
import { useRevenueCat } from '../lib/revenuecat/RevenueCatProvider'
import { ENTITLEMENT_ID } from '../lib/purchases/revenuecat'

interface PurchaseResult {
  success: boolean
  error?: string
}

export function useRevenueCatSubscription() {
  const { customerInfo, currentOffering, isPro, isLoading, restorePurchases, refreshCustomerInfo } = useRevenueCat()
  const [purchasing, setPurchasing] = useState(false)

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<PurchaseResult> => {
    setPurchasing(true)
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg)
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]?.isActive) {
        return { success: true }
      }
      return { success: false, error: 'Purchase completed but entitlement not active' }
    } catch (error: any) {
      if (error.userCancelled) {
        return { success: false, error: 'cancelled' }
      }
      return { success: false, error: error.message || 'Purchase failed' }
    } finally {
      setPurchasing(false)
    }
  }, [])

  const monthlyPackage = currentOffering?.monthly ?? null
  const yearlyPackage = currentOffering?.annual ?? null
  const lifetimePackage = currentOffering?.lifetime ?? null

  const activeSubscription = customerInfo?.entitlements.active[ENTITLEMENT_ID]
  const expirationDate = activeSubscription?.expirationDate ?? null
  const willRenew = activeSubscription?.willRenew ?? false
  const productIdentifier = activeSubscription?.productIdentifier ?? null

  return {
    isPro,
    isLoading,
    purchasing,
    monthlyPackage,
    yearlyPackage,
    lifetimePackage,
    currentOffering,
    customerInfo,
    expirationDate,
    willRenew,
    productIdentifier,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
  }
}
