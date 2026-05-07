import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getColors, LAYOUT } from '@/lib/styles/colors';

export default function TabLayout() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();

  // On iOS the tab bar sits on top of the home indicator area.
  // We give it explicit bottom padding so the home indicator never
  // overlaps the labels, without over-spacing on notchless devices.
  const tabBarHeight = 56 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.emeraldMid,
        tabBarInactiveTintColor: colors.tabBarInactive,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          // iOS shadow so the bar feels elevated off the content
          ...Platform.select({
            ios: {
              shadowColor: isDark ? '#000' : '#2c2416',
              shadowOffset: { width: 0, height: -1 },
              shadowOpacity: isDark ? 0.4 : 0.06,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: LAYOUT.tabLabelSize,
          fontWeight: '500',
          letterSpacing: 0.1,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={LAYOUT.tabIconSize} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={LAYOUT.tabIconSize} name="sun.max.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'Collections',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={LAYOUT.tabIconSize} name="book.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={LAYOUT.tabIconSize} name="magnifyingglass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-hadith"
        options={{
          title: 'My Hadith',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={LAYOUT.tabIconSize} name="folder.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={LAYOUT.tabIconSize} name="graduationcap.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={LAYOUT.tabIconSize} name="sparkles" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={LAYOUT.tabIconSize} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
