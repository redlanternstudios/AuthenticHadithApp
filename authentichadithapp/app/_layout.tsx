import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { resolveOnboardingState } from '@/lib/onboarding/onboarding-state';
import { getColors } from '@/lib/styles/colors';

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
      // FIX-115 B1: use .upsert() not .update() — .update() silently affects
      // 0 rows if the profiles row doesn't exist yet (race condition on first
      // login). upsert with onConflict:'user_id' handles both create and update.
      await supabase
        .from('profiles')
        .upsert({ user_id: user.id, expo_push_token: token }, { onConflict: 'user_id' })
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

function GlobalNavControls() {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const router = useRouter()
  const pathname = usePathname()
  const segments = useSegments()

  const firstSegment = segments[0]
  const hiddenRoutes = firstSegment === 'auth' || firstSegment === 'onboarding' || firstSegment === 'paywall'
  const isHome = pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/'

  if (hiddenRoutes || isHome) return null

  return (
    <View pointerEvents="box-none" style={styles.globalNavWrap}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={[
          styles.globalNavButton,
          { backgroundColor: colors.card + 'F2', borderColor: colors.border },
        ]}
      >
        <Ionicons name="chevron-back" size={20} color={colors.goldMid} />
      </Pressable>
      <Pressable
        onPress={() => router.replace('/(tabs)')}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Go to Home"
        style={[
          styles.globalNavButton,
          { backgroundColor: colors.card + 'F2', borderColor: colors.border },
        ]}
      >
        <Ionicons name="home" size={18} color={colors.goldMid} />
      </Pressable>
    </View>
  )
}

// Pure side-effect component — renders nothing, only redirects.
// Enforces auth → onboarding on every launch. Subscription remains optional.
function NavigationGate() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const segments = useSegments()
  const [onboarded, setOnboarded] = useState<boolean | null>(null)

  // Resolve onboarding from local cache first, then Supabase for signed in users.
  useEffect(() => {
    let cancelled = false

    setOnboarded(null)

    resolveOnboardingState({
      userId: user?.id,
      getLocalFlag: () => AsyncStorage.getItem('onboarded'),
      setLocalFlag: (value) => AsyncStorage.setItem('onboarded', value),
      fetchRemoteFlag: async (userId) => {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('onboarded')
          .eq('user_id', userId)
          .maybeSingle()

        if (error) {
          __DEV__ && console.warn('[NavigationGate] Onboarding lookup failed:', error.message)
          return null
        }

        return data?.onboarded === true
      },
    })
      .then((value) => {
        if (!cancelled) setOnboarded(value)
      })
      .catch((err) => {
        __DEV__ && console.warn('[NavigationGate] Onboarding resolution failed:', err)
        if (!cancelled) setOnboarded(false)
      })

    return () => {
      cancelled = true
    }
  }, [segments, user?.id])

  useEffect(() => {
    // Wait until auth and AsyncStorage have both resolved.
    if (authLoading || onboarded === null) return

    const inAuth = segments[0] === 'auth'
    const inShared = segments[0] === 'shared'
    const inOnboarding = segments[0] === 'onboarding'

    // FIX-115 B4: SCREENSHOT-BYPASS reverted — all three gates restored for
    // production. These were commented out temporarily during App Store screenshot
    // capture and MUST be active before submission (per approval-gates.md).
    if (!user) {
      // No session — send to signup
      if (!inAuth && !inShared) router.replace('/auth/signup')
      return
    }

    if (!onboarded) {
      // Logged in but hasn't completed onboarding
      if (!inOnboarding) router.replace('/onboarding')
      return
    }

    // All required gates passed. Stay on the current app route.
  }, [authLoading, onboarded, user, segments, router])

  return null
}

function AppContent() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const router = useRouter();

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.goldMid,
          headerTitleStyle: {
            color: colors.bronzeText,
            fontFamily: 'Cinzel_600SemiBold',
          },
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/(tabs)')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go to Home"
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="home" size={20} color={colors.goldMid} />
            </Pressable>
          ),
        }}
      >
        {/* title here is the BACK label on every screen pushed from the tabs —
            without it iOS renders the route-group literal "(tabs)". */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="hadith/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="collection/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="collections/index" options={{ headerShown: false }} />
        <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="chapter/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="topics/index" options={{ headerShown: false }} />
        <Stack.Screen name="topics/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="topics/tag/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="bookmarks/index" options={{ headerShown: false }} />
        <Stack.Screen name="learn/[pathId]" options={{ headerShown: false }} />
        <Stack.Screen name="learn/lesson/[lessonId]" options={{ headerShown: false }} />
        <Stack.Screen name="my-hadith" options={{ headerShown: false }} />
        <Stack.Screen name="settings/index" options={{ headerShown: false }} />
        <Stack.Screen name="settings/about" options={{ headerShown: false }} />
        <Stack.Screen name="settings/appearance" options={{ headerShown: false }} />
        <Stack.Screen name="settings/credits" options={{ headerShown: false }} />
        <Stack.Screen name="settings/delete-account" options={{ headerShown: false }} />
        <Stack.Screen name="settings/language" options={{ headerShown: false }} />
        <Stack.Screen name="settings/notifications" options={{ headerShown: false }} />
        <Stack.Screen name="settings/privacy" options={{ headerShown: false }} />
        <Stack.Screen name="settings/subscription" options={{ headerShown: false }} />
        <Stack.Screen name="settings/sync" options={{ headerShown: false }} />
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
      <GlobalNavControls />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationGate />
      <PushTokenSync />
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({
  globalNavWrap: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    paddingTop: 58,
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
  },
  globalNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

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
