import { useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RevenueCatProvider } from "../providers/RevenueCatProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const onLayoutReady = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    onLayoutReady();
  }, [onLayoutReady]);

  return (
    <SafeAreaProvider>
      <RevenueCatProvider>
        <StatusBar style="light" backgroundColor="#1B5E43" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
          }}
        />
      </RevenueCatProvider>
    </SafeAreaProvider>
  );
}
