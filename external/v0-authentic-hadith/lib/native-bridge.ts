/**
 * Native app bridge utilities.
 * When the Next.js app runs inside the Expo WebView wrapper,
 * these functions communicate with the native RevenueCat SDK
 * via postMessage / CustomEvent.
 */

declare global {
  interface Window {
    __IS_NATIVE_APP__?: boolean;
    __NATIVE_SUBSCRIPTION_STATUS__?: { isPro: boolean };
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

/** Check if we are running inside the native app WebView */
export function isNativeApp(): boolean {
  return typeof window !== "undefined" && window.__IS_NATIVE_APP__ === true;
}

/** Trigger the native RevenueCat paywall (no-op on web) */
export function showNativePaywall(): Promise<boolean> {
  if (!isNativeApp() || !window.ReactNativeWebView) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      window.removeEventListener("nativePaywallResult", handler);
      resolve(detail?.success === true);
    };
    window.addEventListener("nativePaywallResult", handler);
    window.ReactNativeWebView!.postMessage(
      JSON.stringify({ type: "SHOW_PAYWALL" })
    );

    // Timeout after 2 minutes (user might be on paywall for a while)
    setTimeout(() => {
      window.removeEventListener("nativePaywallResult", handler);
      resolve(false);
    }, 120000);
  });
}

/** Trigger native restore purchases (no-op on web) */
export function restoreNativePurchases(): Promise<boolean> {
  if (!isNativeApp() || !window.ReactNativeWebView) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      window.removeEventListener("nativeRestoreResult", handler);
      resolve(detail?.success === true);
    };
    window.addEventListener("nativeRestoreResult", handler);
    window.ReactNativeWebView!.postMessage(
      JSON.stringify({ type: "RESTORE_PURCHASES" })
    );

    setTimeout(() => {
      window.removeEventListener("nativeRestoreResult", handler);
      resolve(false);
    }, 30000);
  });
}

/** Get current native subscription status */
export function getNativeSubscriptionStatus(): { isPro: boolean } | null {
  if (!isNativeApp()) return null;
  return window.__NATIVE_SUBSCRIPTION_STATUS__ ?? null;
}

/** Sync Supabase user ID to RevenueCat (call after login) */
export function syncNativeUser(userId: string): void {
  if (!isNativeApp() || !window.ReactNativeWebView) return;
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ type: "USER_LOGIN", userId })
  );
}

/** Clear RevenueCat user (call after logout) */
export function clearNativeUser(): void {
  if (!isNativeApp() || !window.ReactNativeWebView) return;
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ type: "USER_LOGOUT" })
  );
}
