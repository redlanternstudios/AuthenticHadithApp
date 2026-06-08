import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors'
import { Card } from '@/components/ui/Card'

// Curated daily content. Keep in sync with app/(tabs)/today.tsx until a future
// content pass consolidates both lists into a single source. Duplication is
// intentional during the tab restructure to keep this component independent
// of the standalone Today screen.
const DAILY_ACTIONS = [
  { action: 'Say Bismillah before eating', reference: 'Sahih al-Bukhari 5376' },
  { action: "Pray two rak'ahs of Duha", reference: 'Sahih Muslim 748' },
  { action: 'Read Surah al-Mulk before sleeping', reference: 'Jami at-Tirmidhi 2891' },
  { action: 'Make dhikr after Fajr until sunrise', reference: 'Sahih Muslim 2137' },
  { action: 'Smile at your brother/sister', reference: 'Jami at-Tirmidhi 1956' },
  { action: 'Use the miswak', reference: 'Sahih al-Bukhari 887' },
  { action: 'Drink water in three sips', reference: 'Sahih Muslim 2028' },
  { action: 'Say the morning and evening adhkar', reference: 'Sunan Abu Dawud 5068' },
  { action: 'Give charity, even if small', reference: 'Sahih al-Bukhari 1417' },
  { action: 'Visit a sick person', reference: 'Sahih al-Bukhari 5649' },
  { action: 'Make istighfar 100 times', reference: 'Sahih Muslim 2702' },
  { action: 'Pray Witr before sleeping', reference: 'Sahih al-Bukhari 998' },
  { action: 'Eat dates in odd numbers', reference: 'Sahih al-Bukhari 5445' },
  { action: 'Send salawat upon the Prophet ﷺ', reference: 'Sahih Muslim 408' },
]

const REFLECTION_PROMPTS = [
  'How can I apply this hadith in my daily life?',
  'What lesson does this hadith teach about character?',
  'How does this hadith relate to my current situation?',
  'What would the Prophet ﷺ advise in my circumstances?',
]

function getDailyIndex(date: Date, max: number): number {
  const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % max
}

export function TodayFeaturedSection() {
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const today = new Date()
  const todayAction = DAILY_ACTIONS[getDailyIndex(today, DAILY_ACTIONS.length)]
  const todayReflection = REFLECTION_PROMPTS[getDailyIndex(today, REFLECTION_PROMPTS.length)]

  const dateLabel = today
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase()

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.eyebrow, { color: colors.goldMid }]}>TODAY · {dateLabel}</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/today')}
          hitSlop={12}
          accessibilityRole="link"
          accessibilityLabel="Open the full Today screen"
        >
          <Text style={[styles.openLink, { color: colors.emeraldMid }]}>Open Today →</Text>
        </Pressable>
      </View>

      <Card
        variant="elevated"
        style={[styles.sunnahCard, { borderLeftColor: colors.goldMid }]}
      >
        <Text style={[styles.cardEyebrow, { color: colors.goldMid }]}>{"☀️ TODAY'S SUNNAH"}</Text>
        <Text style={[styles.sunnahAction, { color: colors.bronzeText }]}>
          {todayAction.action}
        </Text>
        <Text style={[styles.sunnahReference, { color: colors.mutedText }]}>
          {todayAction.reference}
        </Text>
      </Card>

      <Card variant="elevated" style={styles.reflectionCard}>
        <Text style={[styles.cardEyebrow, { color: colors.emeraldMid }]}>💭 REFLECTION</Text>
        <Text style={[styles.reflectionText, { color: colors.mutedText }]}>
          {todayReflection}
        </Text>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  openLink: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  sunnahCard: {
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    gap: SPACING.xs,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  sunnahAction: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 2,
  },
  sunnahReference: {
    fontSize: FONT_SIZES.sm,
  },
  reflectionCard: {
    gap: SPACING.xs,
  },
  reflectionText: {
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
    fontStyle: 'italic',
    marginTop: 2,
  },
})
