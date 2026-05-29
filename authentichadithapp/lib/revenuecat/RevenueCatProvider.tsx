import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import Purchases, { CustomerInfo, PurchasesOffering, LOG_LEVEL } from 'react-native-purchases'
import { ENTITLEMENT_ID } from './config'
import {
  configureRevenueCat,
  isRevenueCatConfigured,
  identifyUser,
  resetUser,
  attemptConfigureRetry,
} from '../purchases/revenuecat'
import { useAuth } from '../auth/AuthProvider'
import { rcDiag } from './diagnostics'

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

  const isPro = customerInfo?.entitlements.active[ENTITLEMENT_ID]?.isActive === true
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
      rcDiag.record('CUSTOMER_INFO_FETCH', 'ok', {
        entitlementActive: info.entitlements.active[ENTITLEMENT_ID]?.isActive === true,
        context: 'post-configure',
      })
    } catch (err) {
      const e = err as { name?: string; code?: string | number; message?: string }
      console.warn('[RC] getCustomerInfo failed (non-fatal):', e?.message)
      rcDiag.record('CUSTOMER_INFO_FETCH', 'fail', {
        name: e?.name,
        code: e?.code,
        message: e?.message,
        context: 'post-configure',
      })
    }

    try {
      const offerings = await Purchases.getOfferings()
      if (offerings.current) {
        setCurrentOffering(offerings.current)
      }
      rcDiag.record('OFFERINGS_FETCH', 'ok', {
        hasCurrent: !!offerings.current,
        packageCount: offerings.current?.availablePackages.length ?? 0,
      })
    } catch (err) {
      const e = err as { name?: string; code?: string | number; message?: string }
      console.warn('[RC] getOfferings failed (non-fatal):', e?.message)
      rcDiag.record('OFFERINGS_FETCH', 'fail', {
        name: e?.name,
        code: e?.code,
        message: e?.message,
      })
    }

    if (!listenerAttachedRef.current) {
      const listener = (newInfo: CustomerInfo) => {
        setCustomerInfo(newInfo)
        rcDiag.record('CUSTOMER_INFO_UPDATE', 'ok', {
          entitlementActive: newInfo.entitlements.active[ENTITLEMENT_ID]?.isActive === true,
          context: 'listener',
        })
      }
      Purchases.addCustomerInfoUpdateListener(listener)
      listenerRef.current = listener
      listenerAttachedRef.current = true
      rcDiag.record('LISTENER_ATTACHED', 'ok', {})
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
        // share one isConfigured truth. Helper records every lifecycle event in
        // rcDiag and returns false in degraded mode rather than throwing.
        const ok = await configureRevenueCat(user?.id)
        if (!ok || !isRevenueCatConfigured()) {
          // Degraded mode — rcDiag has already captured the failure reason.
          // The retry useEffect below may attempt one bounded recovery when
          // user?.id transitions.
          return
        }
        setIsConfigured(true)
        await runPostConfigure()
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        console.warn('[RC] Configure error:', e.message)
        rcDiag.record('CONFIGURE_FAIL', 'fail', {
          message: e.message,
          context: 'mount-init-outer-catch',
        })
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
          rcDiag.record('CUSTOMER_INFO_FETCH', 'ok', {
            entitlementActive: info.entitlements.active[ENTITLEMENT_ID]?.isActive === true,
            context: 'identity-sync',
          })
        }
      } catch (err) {
        const e = err as { name?: string; code?: string | number; message?: string }
        console.warn('[RC] identity sync failed:', e?.message)
        rcDiag.record('IDENTITY_SYNC_FAIL', 'fail', {
          name: e?.name,
          code: e?.code,
          message: e?.message,
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, isConfigured])

  const restorePurchases = useCallback(async (): Promise<CustomerInfo | null> => {
    if (!isConfigured) {
      console.warn('[RC] restorePurchases called in degraded mode; no-op.')
      rcDiag.record('RESTORE_SKIPPED', 'info', { reason: 'not-configured' })
      return null
    }
    rcDiag.record('RESTORE_ATTEMPT', 'info', {})
    try {
      const info = await Purchases.restorePurchases()
      setCustomerInfo(info)
      rcDiag.record('RESTORE_SUCCESS', 'ok', {
        entitlementActive: info.entitlements.active[ENTITLEMENT_ID]?.isActive === true,
      })
      return info
    } catch (err) {
      const e = err as { name?: string; code?: string | number; message?: string }
      console.warn('[RC] Restore error:', e?.message)
      rcDiag.record('RESTORE_FAIL', 'fail', {
        name: e?.name,
        code: e?.code,
        message: e?.message,
      })
      return null
    }
  }, [isConfigured])

  const refreshCustomerInfo = useCallback(async () => {
    if (!isConfigured) return
    try {
      const info = await Purchases.getCustomerInfo()
      setCustomerInfo(info)
      rcDiag.record('CUSTOMER_INFO_FETCH', 'ok', {
        entitlementActive: info.entitlements.active[ENTITLEMENT_ID]?.isActive === true,
        context: 'refresh',
      })
    } catch (err) {
      const e = err as { name?: string; code?: string | number; message?: string }
      console.warn('[RC] Error refreshing customer info:', e?.message)
      rcDiag.record('CUSTOMER_INFO_FETCH', 'fail', {
        name: e?.name,
        code: e?.code,
        message: e?.message,
        context: 'refresh',
      })
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
