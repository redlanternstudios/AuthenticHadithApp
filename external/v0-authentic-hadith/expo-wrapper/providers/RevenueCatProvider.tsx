import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesOffering,
} from "react-native-purchases";
import Constants from "expo-constants";

const API_KEY_APPLE =
  Constants.expoConfig?.extra?.revenueCatApiKeyApple || "";
const API_KEY_GOOGLE =
  Constants.expoConfig?.extra?.revenueCatApiKeyGoogle || "";
const ENTITLEMENT_ID =
  Constants.expoConfig?.extra?.revenueCatEntitlementId ||
  "byRed Pro";

interface RevenueCatContextType {
  isReady: boolean;
  customerInfo: CustomerInfo | null;
  isPro: boolean;
  currentOffering: PurchasesOffering | null;
  purchasePackage: (packageId: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshCustomerInfo: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType>({
  isReady: false,
  customerInfo: null,
  isPro: false,
  currentOffering: null,
  purchasePackage: async () => false,
  restorePurchases: async () => false,
  refreshCustomerInfo: async () => {},
});

export function useRevenueCat() {
  return useContext(RevenueCatContext);
}

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] =
    useState<PurchasesOffering | null>(null);

  const isPro =
    customerInfo?.entitlements.active[ENTITLEMENT_ID]?.isActive === true;

  // Initialize RevenueCat SDK
  useEffect(() => {
    async function init() {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        }

        const apiKey =
          Platform.OS === "ios" ? API_KEY_APPLE : API_KEY_GOOGLE;

        if (!apiKey) {
          console.warn(
            "[RevenueCat] No API key found for platform:",
            Platform.OS
          );
          setIsReady(true);
          return;
        }

        Purchases.configure({ apiKey });

        // Fetch initial customer info
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);

        // Fetch offerings
        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          setCurrentOffering(offerings.current);
        }

        // Listen for customer info updates (renewals, cancellations, etc.)
        Purchases.addCustomerInfoUpdateListener((updatedInfo) => {
          setCustomerInfo(updatedInfo);
        });

        setIsReady(true);
      } catch (error) {
        console.error("[RevenueCat] Init error:", error);
        setIsReady(true);
      }
    }

    init();
  }, []);

  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (error) {
      console.error("[RevenueCat] Refresh error:", error);
    }
  }, []);

  const purchasePackage = useCallback(
    async (packageId: string): Promise<boolean> => {
      try {
        if (!currentOffering) return false;

        const pkg = currentOffering.availablePackages.find(
          (p) => p.identifier === packageId
        );
        if (!pkg) {
          console.error("[RevenueCat] Package not found:", packageId);
          return false;
        }

        const { customerInfo: updatedInfo } =
          await Purchases.purchasePackage(pkg);
        setCustomerInfo(updatedInfo);

        return (
          updatedInfo.entitlements.active[ENTITLEMENT_ID]?.isActive === true
        );
      } catch (error: any) {
        if (!error.userCancelled) {
          console.error("[RevenueCat] Purchase error:", error);
        }
        return false;
      }
    },
    [currentOffering]
  );

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return info.entitlements.active[ENTITLEMENT_ID]?.isActive === true;
    } catch (error) {
      console.error("[RevenueCat] Restore error:", error);
      return false;
    }
  }, []);

  return (
    <RevenueCatContext.Provider
      value={{
        isReady,
        customerInfo,
        isPro,
        currentOffering,
        purchasePackage,
        restorePurchases,
        refreshCustomerInfo,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
}
