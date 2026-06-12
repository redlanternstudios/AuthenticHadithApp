import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import Purchases, { CustomerInfo, PurchasesOffering, LOG_LEVEL } from 'react-native-purchases'
import { ENTITLEMENT_ID, isReviewerEmail } from './config'
import {
  configureRevenueCat,
  isRevenueCatConfigured,
  identifyUser,
  resetUser,
  attemptConfigureRetry,
} from '../purchases/revenuecat'
import { useAuth } from '../auth/AuthProvider'

interface RevenueCatContextType {
  customerInfo: CustomerInfo | null
  currentOffering: PurchasesOffering | null
  isPro: boolean
  isLoading: boolean
  isConfigured: boolean
  purchasesAvailable: boolean
  error: Error | null
  restorePurchases: () => Promise<CustomerInfo | null>
  refreshCustomerInfo: () => Promise<void>
}

const RevenueCatContext = createContext<RevenueCatContextType>({
  customerInfo: null,
  currentOffering: null,
  isPro: false,
  isLoading: true,
  isConfigured: false,
  purchasesAvailable: false,
  error: null,
  restorePurchases: async () => null,
  refreshCustomerInfo: async () => {},
})

export const useRevenueCat = () => useContext(RevenueCatContext)

interface RevenueCatProviderProps {
  children: React.ReactNode
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const { user } = useAuth()
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Apple reviewer bypass: the exact demo account is always premium so the
  // reviewer can evaluate premium features even if RevenueCat doesn't resolve
  // their entitlement live. Exact-email-match only — no effect on any other
  // user, who still needs a real RevenueCat `premium` entitlement (via IAP).
  const isPro = isReviewerEmail(user?.email) || customerInfo?.entitlements.active[ENTITLEMENT_ID]?.isActive === true
  // Purchases is available iff configure() has succeeded. Until then no
  // default-instance call (getCustomerInfo, getOfferings, restorePurchases,
  // addCustomerInfoUpdateListener) is safe.
  const purchasesAvailable = isConfigured

  // Refs guard the customerInfo listener against double-attach when the bounded
  // configure-retry succeeds after the initial init failed.
  const listenerAttachedRef = useRef(false)
  const listenerRef = useRef<((info: CustomerInfo) => void) | null>(null)

  // Post-configure setup (customerInfo + offerings + listener attach) shared
  // between the mount-time init path and the retry-success path.
  const runPostConfigure = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo()
      setCustomerInfo(info)
    } catch (err) {
      const e = err as { name?: string; code?: string | number; message?: string }
      __DEV__ && console.warn('[RC] getCustomerInfo failed (non-fatal):', e?.message)
    }

    try {
      const offerings = await Purchases.getOfferings()
      if (offerings.current) {
        setCurrentOffering(offerings.current)
      }
    } catch (err) {
      const e = err as { name?: string; code?: string | number; message?: string }
      __DEV__ && console.warn('[RC] getOfferings failed (non-fatal):', e?.message)
    }

    if (!listenerAttachedRef.current) {
      const listener = (newInfo: CustomerInfo) => {
        setCustomerInfo(newInfo)
      }
      Purchases.addCustomerInfoUpdateListener(listener)
      listenerRef.current = listener
      listenerAttachedRef.current = true
    }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        // Native log level. WARN unconditionally in production so RC native
        // warnings surface in iOS Console.app on TestFlight devices. DEBUG in
        // DEV for verbose local diagnostics.
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN)

        // Route through the helper so this module and lib/purchases/revenuecat.ts
        // share one isConfigured truth and returns false in degraded mode
        // rather than throwing.
        const ok = await configureRevenueCat(user?.id)
        if (!ok || !isRevenueCatConfigured()) {
          // Degraded mode. The retry useEffect below may attempt one bounded
          // recovery when user?.id transitions.
          return
        }
        setIsConfigured(true)
        await runPostConfigure()
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        __DEV__ && console.warn('[RC] Configure error:', e.message)
        setError(e)
      } finally {
        setIsLoading(false)
      }
    }

    init()

    return () => {
      if (listenerAttachedRef.current && listenerRef.current) {
        try {
          Purchases.removeCustomerInfoUpdateListener(listenerRef.current)
        } catch {
          // No-op — provider unmount during teardown
        }
      }
    }
    // Intentionally omits user?.id — mount-once init; the retry useEffect below
    // handles user?.id transitions with bounded retry logic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runPostConfigure])

  // Bounded retry: if the mount-time configure failed (e.g. user?.id was not
  // yet hydrated, or a transient SDK error), attempt one recovery when
  // user?.id transitions to a real value. attemptConfigureRetry is bounded
  // to a single retry per app session.
  useEffect(() => {
    if (isConfigured) return
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      const ok = await attemptConfigureRetry(user.id)
      if (cancelled) return
      if (ok && isRevenueCatConfigured()) {
        setIsConfigured(true)
        await runPostConfigure()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, isConfigured, runPostConfigure])

  // Keep RevenueCat's App User ID in sync with the Supabase session. Init runs
  // once on mount with the user at that instant; auth hydration is async, so
  // this effect catches login, logout, and any later identity swap. Required
  // so the demo reviewer's Supabase UUID can be located in the RC dashboard
  // when granting Promotional Entitlements.
  useEffect(() => {
    if (!isConfigured) return
    let cancelled = false
    ;(async () => {
      try {
        if (user?.id) {
          await identifyUser(user.id)
        } else {
          await resetUser()
        }
        if (cancelled) return
        const info = await Purchases.getCustomerInfo()
        if (!cancelled) {
          setCustomerInfo(info)
        }
      } catch (err) {
        const e = err as { name?: string; code?: string | number; message?: string }
        __DEV__ && console.warn('[RC] identity sync failed:', e?.message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, isConfigured])

  const restorePurchases = useCallback(async (): Promise<CustomerInfo | null> => {
    if (!isConfigured) {
      __DEV__ && console.warn('[RC] restorePurchases called in degraded mode; no-op.')
      return null
    }
    try {
      const info = await Purchases.restorePurchases()
      setCustomerInfo(info)
      return info
    } catch (err) {
      const e = err as { name?: string; code?: string | number; message?: string }
      __DEV__ && console.warn('[RC] Restore error:', e?.message)
      return null
    }
  }, [isConfigured])

  const refreshCustomerInfo = useCallback(async () => {
    if (!isConfigured) return
    try {
      const info = await Purchases.getCustomerInfo()
      setCustomerInfo(info)
    } catch (err) {
      const e = err as { name?: string; code?: string | number; message?: string }
      __DEV__ && console.warn('[RC] Error refreshing customer info:', e?.message)
    }
  }, [isConfigured])

  const value: RevenueCatContextType = {
    customerInfo,
    currentOffering,
    isPro,
    isLoading,
    isConfigured,
    purchasesAvailable,
    error,
    restorePurchases,
    refreshCustomerInfo,
  }

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>
}
