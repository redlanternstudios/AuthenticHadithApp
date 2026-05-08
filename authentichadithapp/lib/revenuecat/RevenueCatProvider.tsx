import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import Purchases, { CustomerInfo, PurchasesOffering, LOG_LEVEL } from 'react-native-purchases'
import { ENTITLEMENT_ID } from './config'
import { configureRevenueCat, isRevenueCatConfigured } from '../purchases/revenuecat'

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

  useEffect(() => {
    let listenerAttached = false

    async function init() {
      try {
        if (__DEV__) {
          // setLogLevel is safe before configure().
          Purchases.setLogLevel(LOG_LEVEL.DEBUG)
        }

        // Route through the helper so this module and lib/purchases/revenuecat.ts
        // share one isConfigured truth. Helper logs in DEV when no key is found
        // and returns false in degraded mode rather than throwing.
        const ok = await configureRevenueCat()
        if (!ok || !isRevenueCatConfigured()) {
          // Degraded mode — no API key, configure failed, or SDK missing. Treat
          // user as non-premium; do NOT call any default-instance methods.
          return
        }
        setIsConfigured(true)

        // Default-instance methods are now safe. Wrap each network call in its
        // own try/catch so a failure in one (e.g. offerings can't load on a
        // simulator without a StoreKit Config file or before Apple Developer
        // Portal IAP capability is enabled) does not poison the others or
        // surface a misleading "Initialization error" — configure already
        // succeeded.
        try {
          const info = await Purchases.getCustomerInfo()
          setCustomerInfo(info)
        } catch (err) {
          __DEV__ &&
            console.warn(
              '[RevenueCat] getCustomerInfo failed (non-fatal):',
              err instanceof Error ? err.message : String(err)
            )
        }

        try {
          const offerings = await Purchases.getOfferings()
          if (offerings.current) {
            setCurrentOffering(offerings.current)
          }
        } catch (err) {
          __DEV__ &&
            console.warn(
              '[RevenueCat] getOfferings failed (non-fatal — expected on simulator without StoreKit Config or before App Store Connect product setup):',
              err instanceof Error ? err.message : String(err)
            )
        }

        // Listener is also a default-instance method — only attach after configure.
        const listener = (newInfo: CustomerInfo) => {
          setCustomerInfo(newInfo)
        }
        Purchases.addCustomerInfoUpdateListener(listener)
        listenerAttached = true

        // Stash listener removal on a ref-like local so cleanup can find it.
        cleanupRef.current = () => {
          try {
            Purchases.removeCustomerInfoUpdateListener(listener)
          } catch {
            // No-op — provider unmount during teardown
          }
        }
      } catch (err) {
        // This path now reflects only configure-level failures, not data fetch
        // failures. Worth a real DEV log because something is genuinely wrong
        // with the SDK setup (bad key, native module missing, etc.).
        const e = err instanceof Error ? err : new Error(String(err))
        __DEV__ && console.error('[RevenueCat] Configure error:', e.message)
        setError(e)
      } finally {
        setIsLoading(false)
      }
    }

    const cleanupRef: { current: (() => void) | null } = { current: null }
    init()

    return () => {
      if (cleanupRef.current) cleanupRef.current()
      // No listener to remove if degraded mode or if attach failed.
      if (!listenerAttached) return
    }
  }, [])

  const restorePurchases = useCallback(async (): Promise<CustomerInfo | null> => {
    if (!isConfigured) {
      __DEV__ && console.warn('[RevenueCat] restorePurchases called in degraded mode; no-op.')
      return null
    }
    try {
      const info = await Purchases.restorePurchases()
      setCustomerInfo(info)
      return info
    } catch (err) {
      __DEV__ && console.error('[RevenueCat] Restore error:', err)
      return null
    }
  }, [isConfigured])

  const refreshCustomerInfo = useCallback(async () => {
    if (!isConfigured) return
    try {
      const info = await Purchases.getCustomerInfo()
      setCustomerInfo(info)
    } catch (err) {
      __DEV__ && console.error('[RevenueCat] Error refreshing customer info:', err)
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
