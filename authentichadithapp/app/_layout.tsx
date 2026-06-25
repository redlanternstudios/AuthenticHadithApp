import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import {
  Cinzel_400Regular,
  Cinzel_500Medium,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
} from '@expo-google-fonts/cinzel';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
} from '@expo-google-fonts/geist';

import { ReactQueryProvider } from '@/lib/providers/react-query-provider';
import { AuthProvider, useAuth } from '@/lib/auth/AuthProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemeProvider, useTheme } from '@/lib/theme/ThemeProvider';
import { LanguageProvider } from '@/lib/i18n/LanguageProvider';
import { RevenueCatProvider, useRevenueCat } from '@/lib/revenuecat/RevenueCatProvider'
import { registerForPushNotifications, markAppOpened, cancelAllNotifications } from '@/lib/notifications'
import { supabase } from '@/lib/supabase/client';

// FIX-071: preventAutoHideAsync at module level ensures the splash is held
// from the very first JS frame — must remain unconditional and at top-level.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

// Signals the root layout that Supabase auth has hydrated so the splash can
// safely drop. Must be placed inside AuthProvider in the render tree.
function AppReadySignal({ onReady }: { onReady: () => void }) {
  const { isLoading: authLoading } = useAuth()
  const firedRef = useRef(false)
  useEffect(() => {
    if (!authLoading && !firedRef.current) {
      firedRef.current = true
      onReady()
    }
  }, [authLoading, onReady])
  return null
}

// Registers the Expo push token with Supabase profiles whenever auth resolves
// with a real user. Clears token and local notifications on logout.
// Placed inside AuthProvider so useAuth() is available.
function PushTokenSync() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) return

    registerForPushNotifications().then(async (token) => {
      if (!token) return
      // Upsert the token — intentionally fire-and-forget. A failure here is
      // non-fatal: the user still has full local notification support.
      await supabase
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) {
            __DEV__ && console.warn('[PushTokenSync] Failed to upsert token:', error.message)
          }
        })
    }).catch((err) => {
      __DEV__ && console.warn('[PushTokenSync] registerForPushNotifications error:', err)
    })

    // markAppOpened: records today's date and cancels today's already-fired
    // streak reminder so the next occurrence resets to tomorrow.
    markAppOpened().catch((err) => {
      __DEV__ && console.warn('[PushTokenSync] markAppOpened error:', err)
    })
  }, [user?.id])

  // On logout (user becomes null), clear push token from Supabase and cancel
  // all local notifications so no reminders fire for the previous account.
  const prevUserIdRef = useRef<string | null>(null)
  useEffect(() => {
    const prevId = prevUserIdRef.current
    prevUserIdRef.current = user?.id ?? null

    if (prevId && !user?.id) {
      // User just logged out
      cancelAllNotifications().catch(() => {})
      supabase
        .from('profiles')
        .update({ expo_push_token: null })
        .eq('user_id', prevId)
        .then(() => {})
    }
  }, [user?.id])

  return null
}

// Pure side-effect component — renders nothing, only redirects.
// Enforces auth → onboarding → subscription gate on every launch.
function NavigationGate() {
  const { user, isLoading: authLoading } = useAuth()
  const { isPro, isLoading: rcLoading } = useRevenueCat()
  const router = useRouter()
  const segments = useSegments()
  const [onboarded, setOnboarded] = useState<boolean | null>(null)

  // Read onboarding flag from AsyncStorage on mount and on every route change
  useEffect(() => {
    AsyncStorage.getItem('onboarded').then((value) => {
      setOnboarded(value === 'true')
    })
  }, [segments])

  useEffect(() => {
    // Wait until auth, RevenueCat, and AsyncStorage have all resolved
    if (authLoading || rcLoading || onboarded === null) return

    const inAuth = segments[0] === 'auth'
    const inShared = segments[0] === 'shared'
    const inOnboarding = segments[0] === 'onboarding'
    const inPaywall = segments[0] === 'paywall'

    // SCREENSHOT-BYPASS (TEMP — REVERT BEFORE COMMIT): auth + onboarding redirects
    // disabled so public content screens can be captured on the simulator.
    // if (!user) {
    //   // No session — send to signup
    //   if (!inAuth && !inShared) router.replace('/auth/signup')
    //   return
    // }

    // if (!onboarded) {
    //   // Logged in but hasn't completed onboarding
    //   if (!inOnboarding) router.replace('/onboarding')
    //   return
    // }

    // SCREENSHOT-BYPASS (TEMP — REVERT BEFORE COMMIT): paywall redirect disabled so
    // App Store screenshots can be captured on the simulator where RevenueCat cannot
    // resolve entitlements. Restore with: git checkout app/_layout.tsx
    // if (!isPro) {
    //   // Onboarded but no active subscription
    //   if (!inPaywall) router.replace('/paywall')
    //   return
    // }

    // All gates passed — stay on (tabs), no redirect needed
  }, [authLoading, rcLoading, onboarded, user, isPro, segments, router])

  return null
}

function AppContent() {
  const { isDark } = useTheme();

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* title here is the BACK label on every screen pushed from the tabs —
            without it iOS renders the route-group literal "(tabs)". */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="hadith" options={{ headerShown: false }} />
        <Stack.Screen name="collection" options={{ headerShown: false }} />
        <Stack.Screen name="collections" options={{ headerShown: false }} />
        <Stack.Screen name="book" options={{ headerShown: false }} />
        <Stack.Screen name="chapter" options={{ headerShown: false }} />
        <Stack.Screen name="topics" options={{ headerShown: false }} />
        <Stack.Screen name="bookmarks" options={{ headerShown: false }} />
        <Stack.Screen name="learn" options={{ headerShown: false }} />
        <Stack.Screen name="my-hadith" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="progress" options={{ headerShown: false }} />
        <Stack.Screen name="achievements" options={{ headerShown: false }} />
        <Stack.Screen name="quiz" options={{ headerShown: false }} />
        <Stack.Screen name="stories" options={{ headerShown: false }} />
        <Stack.Screen name="sunnah" options={{ headerShown: false }} />
        <Stack.Screen name="reflections" options={{ headerShown: false }} />
        <Stack.Screen name="shared/[token]" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationGate />
      <PushTokenSync />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    Cinzel_400Regular,
    Cinzel_500Medium,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
  });
  const [authReady, setAuthReady] = useState(false)
  const handleAuthReady = useCallback(() => setAuthReady(true), [])
  // FIX-107: Match native splash background so there is zero visible gap if
  // preventAutoHideAsync races and the JS layer surfaces before fonts settle.
  const colorScheme = useColorScheme()

  // FIX-071: Hide splash only after BOTH fonts have settled AND Supabase auth
  // has hydrated. Prevents FOUC and asymmetric layout shifts on cold boot.
  useEffect(() => {
    if ((fontsLoaded || fontError) && authReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authReady]);

  // FIX C: Safety net — if Supabase hangs and authReady never fires, force-hide
  // the splash after 8 seconds so the user is never stuck on a frozen screen.
  useEffect(() => {
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 8000);
    return () => clearTimeout(timeout);
  }, []);

  // Providers mount unconditionally — AppReadySignal (inside AuthProvider) must
  // be live immediately so auth hydration can resolve in parallel with font
  // loading rather than waiting for the font gate to pass first.
  return (
    <ErrorBoundary>
      {/* Explicit SafeAreaProvider — Expo Router auto-mounts one, but pinning it
          here guarantees useSafeAreaInsets() never reads zeros under any entry
          path (headless, deep link, test harness). */}
      <SafeAreaProvider>
        <ReactQueryProvider>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <RevenueCatProvider>
                  {/* Fires handleAuthReady once Supabase session resolves */}
                  <AppReadySignal onReady={handleAuthReady} />
                  {(!fontsLoaded && !fontError) ? (
                    // FIX-107: No spinner — the native splash covers this window.
                    // Plain background matching the splash prevents the "black
                    // circle with line" artifact that appears when
                    // preventAutoHideAsync races on cold launch.
                    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000000' : '#1b5e43' }} />
                  ) : (
                    <AppContent />
                  )}
                </RevenueCatProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
