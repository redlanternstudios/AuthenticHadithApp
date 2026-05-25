import React from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'

type MoreItem = {
  icon: string
  title: string
  description: string
  route: string
  accessibilityLabel: string
}

const SECTIONS: { title: string; items: MoreItem[] }[] = [
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
        icon: '✨',
        title: 'Assistant',
        description: 'AI assistant for questions about hadith',
        route: '/(tabs)/assistant',
        accessibilityLabel: 'Open AI Assistant',
      },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      {
        icon: '👤',
        title: 'Profile',
        description: 'Settings, subscription, bookmarks, account',
        route: '/(tabs)/profile',
        accessibilityLabel: 'Open Profile',
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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + SPACING.md,
          paddingBottom: insets.bottom + SPACING.xxl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.bronzeText }]}>More</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Everything else in Authentic Hadith
        </Text>
      </View>

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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
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
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  rowDescription: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
})
