import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import Purchases, { CustomerInfo, PurchasesOffering, LOG_LEVEL } from 'react-native-purchases'
import { ENTITLEMENT_ID, REVENUECAT_API_KEY } from './config'

interface RevenueCatContextType {
  customerInfo: CustomerInfo | null
  currentOffering: PurchasesOffering | null
  isPro: boolean
  isLoading: boolean
  restorePurchases: () => Promise<CustomerInfo>
  refreshCustomerInfo: () => Promise<void>
}

const RevenueCatContext = createContext<RevenueCatContextType>({
  customerInfo: null,
  currentOffering: null,
  isPro: false,
  isLoading: true,
  restorePurchases: async () => {
    throw new Error('RevenueCatProvider not mounted')
  },
  refreshCustomerInfo: async () => {},
})

export const useRevenueCat = () => useContext(RevenueCatContext)

interface RevenueCatProviderProps {
  children: React.ReactNode
}

// Module-level guard so React StrictMode / fast refresh / re-mounts cannot
// call Purchases.configure twice (which RC silently ignores but logs warnings for).
let sdkConfigured = false

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const listenerRef = useRef<{ remove: () => void } | null>(null)

  const isPro = customerInfo?.entitlements.active[ENTITLEMENT_ID]?.isActive === true

  useEffect(() => {
    async function init() {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG)
        }

        // Single source of truth for SDK initialization.
        if (!sdkConfigured) {
          Purchases.configure({ apiKey: REVENUECAT_API_KEY })
          sdkConfigured = true
        }

        // Initial fetches.
        const info = await Purchases.getCustomerInfo()
        setCustomerInfo(info)

        const offerings = await Purchases.getOfferings()
        if (offerings.current) {
          setCurrentOffering(offerings.current)
        }
      } catch (error) {
        console.error('[RevenueCat] initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    init()

    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info)
    })
    listenerRef.current = listener

    return () => {
      listenerRef.current?.remove()
      listenerRef.current = null
    }
  }, [])

  const restorePurchases = useCallback(async () => {
    const info = await Purchases.restorePurchases()
    setCustomerInfo(info)
    return info
  }, [])

  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo()
      setCustomerInfo(info)
    } catch (error) {
      console.error('[RevenueCat] refresh error:', error)
    }
  }, [])

  const value = {
    customerInfo,
    currentOffering,
    isPro,
    isLoading,
    restorePurchases,
    refreshCustomerInfo,
  }

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>
}
