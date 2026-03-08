import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-native-reanimated';
import Purchases from 'react-native-purchases';

import { ReactQueryProvider } from '@/lib/providers/react-query-provider';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemeProvider, useTheme } from '@/lib/theme/ThemeProvider';
import { LanguageProvider } from '@/lib/i18n/LanguageProvider';
import { RevenueCatProvider } from '@/lib/revenuecat/RevenueCatProvider';

export const unstable_settings = {
  anchor: '(tabs)',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppContent() {
  const { isDark } = useTheme();

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="hadith" options={{ headerShown: false }} />
        <Stack.Screen name="collection" options={{ headerShown: false }} />
        <Stack.Screen name="learn" options={{ headerShown: false }} />
        <Stack.Screen name="redeem" options={{ headerShown: false }} />
        <Stack.Screen name="my-hadith" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="progress" options={{ headerShown: false }} />
        <Stack.Screen name="achievements" options={{ headerShown: false }} />
        <Stack.Screen name="quiz" options={{ headerShown: false }} />
        <Stack.Screen name="stories" options={{ headerShown: false }} />
        <Stack.Screen name="sunnah" options={{ headerShown: false }} />
        <Stack.Screen name="reflections" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    Purchases.configure({
      apiKey: 'test_gngYicqPNakjsEBKvUwfIlFHrUg',
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <RevenueCatProvider>
                <ReactQueryProvider>
                  <AppContent />
                </ReactQueryProvider>
              </RevenueCatProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
