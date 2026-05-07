import Purchases from 'react-native-purchases'
import { ENTITLEMENT_ID } from '../purchases/revenuecat'

export async function checkPremiumFeature(userId: string | undefined): Promise<boolean> {
  if (!userId) return false

  try {
    const customerInfo = await Purchases.getCustomerInfo()
    return customerInfo.entitlements.active[ENTITLEMENT_ID]?.isActive === true
  } catch {
    return false
  }
}

export function isPremiumRequired(feature: 'assistant' | 'unlimited_lessons' | 'offline_mode'): boolean {
  const premiumFeatures = ['assistant', 'unlimited_lessons']
  return premiumFeatures.includes(feature)
}
