import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import Purchases, { CustomerInfo, PurchasesOffering, LOG_LEVEL } from 'react-native-purchases'
import { ENTITLEMENT_ID } from './config'

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

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isPro = customerInfo?.entitlements.active[ENTITLEMENT_ID]?.isActive === true
  useEffect(() => {
    async function init() {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG)
        }

        // SDK is configured in _layout.tsx via Purchases.configure()
        // Here we just fetch initial data
        const info = await Purchases.getCustomerInfo()
        setCustomerInfo(info)

        // Fetch offerings
        const offerings = await Purchases.getOfferings()
        if (offerings.current) {
          setCurrentOffering(offerings.current)
        }
      } catch (error) {
        console.error('RevenueCat initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    init()

    // Listen for customer info updates
    const listener = (info: CustomerInfo) => {
      setCustomerInfo(info)
    }
    Purchases.addCustomerInfoUpdateListener(listener)

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener)
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
      console.error('Error refreshing customer info:', error)
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
