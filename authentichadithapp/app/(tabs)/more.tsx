import React from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { TopBar } from '@/components/layout/TopBar'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { FONT_FAMILY } from '@/constants/theme'

type MoreItem = {
  icon: string
  title: string
  description: string
  route: string
  accessibilityLabel: string
}

const SECTIONS: { title: string; items: MoreItem[] }[] = [
  {
    title: 'BROWSE',
    items: [
      {
        icon: '📚',
        title: 'Collections',
        description: 'Browse all hadith collections',
        route: '/(tabs)/collections',
        accessibilityLabel: 'Open Collections',
      },
      {
        icon: '🔍',
        title: 'Search',
        description: 'Search across all 14,444 authentic hadiths',
        route: '/(tabs)/search',
        accessibilityLabel: 'Open Search',
      },
    ],
  },
  {
    title: 'DAILY',
    items: [
      {
        icon: '☀️',
        title: 'Today',
        description: "Today's hadith, sunnah, and reflection prompt",
        route: '/(tabs)/today',
        accessibilityLabel: 'Open Today screen',
      },
    ],
  },
  {
    title: 'STUDY',
    items: [
      {
        icon: '🎓',
        title: 'Learn',
        description: 'Structured lessons and learning paths',
        route: '/(tabs)/learn',
        accessibilityLabel: 'Open Learn screen',
      },
      {
        icon: '🏷️',
        title: 'Topics',
        description: 'Browse by theme and subject',
        route: '/topics',
        accessibilityLabel: 'Open Topics',
      },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      {
        icon: '👤',
        title: 'Profile',
        description: 'Subscription, bookmarks, and account details',
        route: '/(tabs)/profile',
        accessibilityLabel: 'Open Profile',
      },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      {
        icon: '⚙️',
        title: 'Settings',
        description: 'Language, appearance, notifications, and privacy',
        route: '/settings',
        accessibilityLabel: 'Open Settings',
      },
      {
        icon: '🔔',
        title: 'Notifications',
        description: 'Manage daily hadith reminders',
        route: '/settings/notifications',
        accessibilityLabel: 'Open Notification Settings',
      },
      {
        icon: '🎨',
        title: 'Appearance',
        description: 'Dark mode and display preferences',
        route: '/settings/appearance',
        accessibilityLabel: 'Open Appearance Settings',
      },
    ],
  },
]

export default function MoreScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screenWrapper, { backgroundColor: colors.background }]}>
      {/* A#6: TopBar — web parity top navigation */}
      <TopBar title="More" />
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: SPACING.md,
          paddingBottom: insets.bottom + SPACING.xxl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >

      {SECTIONS.map(section => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
            {section.title}
          </Text>
          {section.items.map(item => (
            <Pressable
              key={item.title}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              onPress={() => router.push(item.route as any)}
              accessibilityRole="button"
              accessibilityLabel={item.accessibilityLabel}
            >
              <Text style={styles.rowIcon}>{item.icon}</Text>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.bronzeText }]}>
                  {item.title}
                </Text>
                <Text style={[styles.rowDescription, { color: colors.mutedText }]}>
                  {item.description}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: colors.mutedText }]}>›</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    minHeight: 64,
  },
  rowIcon: {
    fontSize: 26,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  rowDescription: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  chevron: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 24,
    fontWeight: '300',
  },
})
