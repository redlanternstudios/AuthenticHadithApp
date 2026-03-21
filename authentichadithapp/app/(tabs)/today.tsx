import React, { useCallback } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Pressable,
  Share,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { HadithCard } from '@/components/hadith/HadithCard'
import { StreakCounter } from '@/components/gamification/StreakCounter'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { useDeviceLayout } from '@/lib/hooks/use-device-layout'
import { trackActivity } from '@/lib/gamification/track-activity'
import { Hadith } from '@/types/hadith'

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

export default function TodayScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const { contentTop, contentBottom, pagePadding, maxContentWidth } = useDeviceLayout()
  const today = new Date()
  const todayAction = DAILY_ACTIONS[getDailyIndex(today, DAILY_ACTIONS.length)]
  const todayReflection = REFLECTION_PROMPTS[getDailyIndex(today, REFLECTION_PROMPTS.length)]

  const { data: dailyHadith, isLoading, refetch } = useQuery({
    queryKey: ['daily-hadith', today.toDateString()],
    queryFn: async () => {
      const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
      let hash = 0
      for (let i = 0; i < dateStr.length; i++) {
        hash = (hash << 5) - hash + dateStr.charCodeAt(i)
        hash |= 0
      }
      const seed = Math.abs(hash)

      const { count } = await supabase
        .from('hadiths')
        .select('id', { count: 'exact', head: true })
        .eq('grade', 'sahih')
      if (!count) return null

      const offset = seed % count
      const { data } = await supabase
        .from('hadiths')
        .select('*')
        .eq('grade', 'sahih')
        .range(offset, offset)
        .single()
      return data as Hadith | null
    },
  })

  const { data: streakData } = useQuery({
    queryKey: ['user-streak', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single()
      return data
    },
    enabled: !!user,
  })

  const handleShare = useCallback(async () => {
    if (!dailyHadith) return
    try {
      const text = dailyHadith.english_text || dailyHadith.arabic_text
      await Share.share({
        message: `Daily Hadith:\n\n${text}\n\n— ${dailyHadith.collection_slug} ${dailyHadith.hadith_number}\n\nShared from Authentic Hadith`,
      })
      if (user) trackActivity(user.id, 'share')
    } catch {}
  }, [dailyHadith, user])

  const handleSave = useCallback(async () => {
    if (!dailyHadith || !user) return
    await supabase.from('saved_hadiths').upsert({
      user_id: user.id,
      hadith_id: dailyHadith.id,
    })
    trackActivity(user.id, 'bookmark')
  }, [dailyHadith, user])

  if (isLoading) return <LoadingSpinner />

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: contentTop,
          paddingBottom: contentBottom,
          paddingHorizontal: pagePadding,
          alignSelf: 'center',
          width: '100%',
          maxWidth: maxContentWidth,
        },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => refetch()}
          tintColor={colors.emeraldMid}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.dateText, { color: colors.goldMid }]}>
          {today.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={[styles.title, { color: colors.bronzeText }]}>Today</Text>
      </View>

      {/* Streak */}
      {streakData && (
        <StreakCounter
          currentStreak={streakData.current_streak || 0}
          longestStreak={streakData.longest_streak || 0}
        />
      )}

      {/* Daily Hadith */}
      {dailyHadith && (
        <>
          <HadithCard
            hadith={dailyHadith}
            onPress={() => router.push(`/hadith/${dailyHadith.id}`)}
          />
          {/* Action pill row */}
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionPill,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleSave}
            >
              <Text style={styles.actionIcon}>🔖</Text>
              <Text style={[styles.actionLabel, { color: colors.bronzeText }]}>Save</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionPill,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleShare}
            >
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={[styles.actionLabel, { color: colors.bronzeText }]}>Share</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Reflection */}
      <Card variant="elevated" style={styles.reflectionCard}>
        <Text style={[styles.cardEyebrow, { color: colors.emeraldMid }]}>💭 REFLECTION</Text>
        <Text style={[styles.reflectionText, { color: colors.mutedText }]}>{todayReflection}</Text>
        <Button
          title="Write a Reflection"
          variant="outline"
          size="small"
          onPress={() => router.push('/reflections')}
        />
      </Card>

      {/* Sunnah action */}
      <Card
        variant="elevated"
        style={[styles.sunnahCard, { borderLeftColor: colors.goldMid }]}
      >
        <Text style={[styles.cardEyebrow, { color: colors.goldMid }]}>☀️ TODAY'S SUNNAH</Text>
        <Text style={[styles.sunnahAction, { color: colors.bronzeText }]}>
          {todayAction.action}
        </Text>
        <Text style={[styles.sunnahReference, { color: colors.mutedText }]}>
          {todayAction.reference}
        </Text>
      </Card>

      {/* Quick links */}
      <View style={styles.quickLinks}>
        {[
          { icon: '🕌', label: 'All Sunnah', route: '/sunnah' },
          { icon: '📖', label: 'Stories', route: '/stories' },
          { icon: '🧠', label: 'Quiz', route: '/quiz' },
        ].map(item => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [
              styles.quickLink,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.quickLinkIcon}>{item.icon}</Text>
            <Text style={[styles.quickLinkText, { color: colors.bronzeText }]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 0,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.lg,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  reflectionCard: {
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  reflectionText: {
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  sunnahCard: {
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    gap: SPACING.xs,
  },
  sunnahAction: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    lineHeight: 24,
    marginTop: 2,
  },
  sunnahReference: {
    fontSize: FONT_SIZES.sm,
  },
  quickLinks: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  quickLink: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 72,
    justifyContent: 'center',
  },
  quickLinkIcon: {
    fontSize: 24,
  },
  quickLinkText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
})
