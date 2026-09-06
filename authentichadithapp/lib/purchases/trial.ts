import type { PurchasesPackage } from 'react-native-purchases'

export interface TrialDetails {
  hasTrial: boolean
  durationDays: number
  badgeText: string
  ctaText: string
  billingSubtext: string
}

const PACKAGE_CADENCE: Record<string, string> = {
  MONTHLY: ' / month',
  ANNUAL: ' / year',
  LIFETIME: '',
}

/**
 * Derives introductory trial details directly from StoreKit / RevenueCat metadata.
 *
 * Requirements:
 * - Authoritative trial must come from StoreKit introductory offer metadata (introPrice.price === 0).
 * - Lifetime is non-consumable, not a subscription, and never has a trial.
 * - Ineligible users (e.g. already consumed trial) must not be shown a trial offer.
 * - If no trial is configured in App Store Connect, returns hasTrial: false with default CTA.
 */
export function getPackageTrialDetails(
  pkg: PurchasesPackage | null,
  isEligible: boolean | undefined = true
): TrialDetails {
  if (!pkg || isEligible === false) {
    return {
      hasTrial: false,
      durationDays: 0,
      badgeText: '',
      ctaText: 'Start My Plan',
      billingSubtext: '',
    }
  }

  // Lifetime is a one-time purchase, not a subscription, no trial
  if (pkg.packageType === 'LIFETIME') {
    return {
      hasTrial: false,
      durationDays: 0,
      badgeText: '',
      ctaText: 'Unlock Lifetime Access',
      billingSubtext: 'One-time purchase · Lifetime access',
    }
  }

  const intro = pkg.product.introPrice
  // Real StoreKit introductory offer check: price MUST be 0 for a free trial
  if (intro && intro.price === 0) {
    let days = 7
    if (intro.periodUnit === 'DAY') {
      days = intro.periodNumberOfUnits
    } else if (intro.periodUnit === 'WEEK') {
      days = intro.periodNumberOfUnits * 7
    } else if (intro.periodUnit === 'MONTH') {
      days = intro.periodNumberOfUnits * 30
    }

    const durationLabel = `${days}-Day Free Trial`
    return {
      hasTrial: true,
      durationDays: days,
      badgeText: durationLabel,
      ctaText: `Start ${days}-Day Free Trial`,
      billingSubtext: `${days} days free, then ${pkg.product.priceString}${PACKAGE_CADENCE[pkg.packageType] || ''}. Cancel anytime.`,
    }
  }

  return {
    hasTrial: false,
    durationDays: 0,
    badgeText: '',
    ctaText: 'Start My Plan',
    billingSubtext: '',
  }
}
