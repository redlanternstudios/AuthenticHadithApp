/**
 * Stories List — Companions/Prophets tabs, Continue Reading filtering,
 * display_order sort, per-companion progress bars and bookmark indicators.
 *
 * Mirrors web `stories/page.tsx` (SSOT).
 *
 * B#7: tabs (Companions / Prophets), Continue-Reading section filtered by
 * per-part progress, display_order sort (ascending).
 *
 * Forbidden layers untouched: bookmark-service.ts, use-hadith.ts, auth/*,
 * purchases/*, hadiths/saved_hadiths schema.
 */

import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getStoryPartProgress, StoryPartProgress } from '@/lib/progress/progressService'
import { FONT_FAMILY } from '@/constants/theme'

// ─── Types ──────────────────────────────────────────────────────────

interface SahabiRow {
  id: string
  slug: string
  name_en: string
  name_ar: string | null
  title_en: string
  icon: string | null
  theme_primary: string
  theme_secondary: string | null
  notable_for: string[] | null
  total_parts: number
  estimated_read_time_minutes: number | null
  display_order: number | null
}

interface ProphetRow {
  id: string
  slug: string
  name_en: string
  name_ar: string | null
  title_en: string | null
  era: string | null
  quran_mentions: number | null
  total_parts: number
  estimated_read_time_minutes: number | null
  theme_primary: string
  display_order: number | null
}

type ActiveTab = 'companions' | 'prophets'

// ─── Screen ──────────────────────────────────────────────────────────

export default function StoriesScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const [tab, setTab] = useState<ActiveTab>('companions')
  const [companionProgress, setCompanionProgress] = useState<Record<string, StoryPartProgress>>({})
  const [progressLoading, setProgressLoading] = useState(true)

  // ── data fetching (display_order sort — B#7) ─────────────────────
  const { data: prophets, isLoading: prophetsLoading } = useQuery({
    queryKey: ['prophets-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('prophets')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true })
      return (data || []) as ProphetRow[]
    },
  })

  const { data: companions, isLoading: companionsLoading } = useQuery({
    queryKey: ['sahaba-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sahaba')
        .select('*')
        .order('display_order', { ascending: true })
      return (data || []) as SahabiRow[]
    },
  })

  // ── load per-companion progress for Continue Reading ─────────────
  useEffect(() => {
    if (!companions || companions.length === 0) return
    let cancelled = false

    async function loadProgress() {
      const map: Record<string, StoryPartProgress> = {}
      await Promise.all(
        (companions ?? []).map(async (c) => {
          const p = await getStoryPartProgress('sahaba', c.id)
          if (p) map[c.id] = p
        })
      )
      if (!cancelled) {
        setCompanionProgress(map)
        setProgressLoading(false)
      }
    }

    loadProgress()
    return () => { cancelled = true }
  }, [companions])

  const isLoading = prophetsLoading || companionsLoading || progressLoading

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Stories', headerShown: true }} />
        <ActivityIndicator color={colors.goldMid} />
      </View>
    )
  }

  // ── Continue Reading filter (B#7) ─────────────────────────────────
  const companionList = companions ?? []
  const continueReading = companionList.filter((c) => {
    const p = companionProgress[c.id]
    return p && !p.isCompleted && p.partsCompleted.length > 0
  })
  const notStarted = companionList.filter((c) => {
    const p = companionProgress[c.id]
    return !p || p.partsCompleted.length === 0
  })
  const completed = companionList.filter((c) => companionProgress[c.id]?.isCompleted)

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ title: 'Stories', headerShown: true }} />

      {/* Page title */}
      <Text style={[styles.title, { color: colors.bronzeText }]}>Stories</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        {companionList.length} companions · {(prophets ?? []).length} prophets
      </Text>

      {/* ── Tabs (B#7) ─────────────────────────────────────────────── */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => setTab('companions')}
          style={[
            styles.tabItem,
            tab === 'companions' && [styles.tabItemActive, { borderBottomColor: colors.goldMid }],
          ]}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: tab === 'companions' ? colors.goldMid : colors.mutedText },
            ]}
          >
            Companions ({companionList.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('prophets')}
          style={[
            styles.tabItem,
            tab === 'prophets' && [styles.tabItemActive, { borderBottomColor: colors.emeraldMid }],
          ]}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: tab === 'prophets' ? colors.emeraldMid : colors.mutedText },
            ]}
          >
            Prophets ({(prophets ?? []).length})
          </Text>
        </Pressable>
      </View>

      {/* ── Companions tab ─────────────────────────────────────────── */}
      {tab === 'companions' && (
        <>
          <Text style={[styles.description, { color: colors.mutedText }]}>
            The Companions (Sahaba) were the people who lived alongside the Prophet Muhammad
            (peace be upon him). Read their full stories with authentic references.
          </Text>

          {/* Continue Reading */}
          {continueReading.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.emeraldMid }]}>
                CONTINUE READING
              </Text>
              {continueReading.map((c) => (
                <CompanionCard
                  key={c.id}
                  companion={c}
                  progress={companionProgress[c.id]}
                  colors={colors}
                  onPress={() => router.push(`/stories/companion/${c.slug}`)}
                  featured
                />
              ))}
            </View>
          )}

          {/* Not started / all */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
              {continueReading.length > 0 ? 'NOT YET STARTED' : 'ALL COMPANIONS'}
            </Text>
            {(continueReading.length > 0 ? notStarted : companionList).map((c) => (
              <CompanionCard
                key={c.id}
                companion={c}
                progress={companionProgress[c.id]}
                colors={colors}
                onPress={() => router.push(`/stories/companion/${c.slug}`)}
              />
            ))}
          </View>

          {/* Completed */}
          {completed.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.goldMid }]}>
                COMPLETED
              </Text>
              {completed.map((c) => (
                <CompanionCard
                  key={c.id}
                  companion={c}
                  progress={companionProgress[c.id]}
                  colors={colors}
                  onPress={() => router.push(`/stories/companion/${c.slug}`)}
                  isComplete
                />
              ))}
            </View>
          )}
        </>
      )}

      {/* ── Prophets tab ───────────────────────────────────────────── */}
      {tab === 'prophets' && (
        <>
          <Text style={[styles.description, { color: colors.mutedText }]}>
            The 25 prophets mentioned in the Quran, from Adam (peace be upon him) to Muhammad
            (peace be upon him). Multi-part narratives with Quranic references.
          </Text>
          <View style={styles.section}>
            {(prophets ?? []).map((prophet, idx) => (
              <ProphetCard
                key={prophet.id}
                prophet={prophet}
                index={idx}
                colors={colors}
                onPress={() => router.push(`/stories/prophet/${prophet.slug}`)}
              />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  )
}

// ─── Companion card ───────────────────────────────────────────────────

function CompanionCard({
  companion,
  progress,
  colors,
  onPress,
  featured,
  isComplete,
}: {
  companion: SahabiRow
  progress?: StoryPartProgress
  colors: ReturnType<typeof getColors>
  onPress: () => void
  featured?: boolean
  isComplete?: boolean
}) {
  const themeColor = companion.theme_primary || colors.goldMid
  const themeSecondary = companion.theme_secondary || themeColor
  const partsCompleted = progress?.partsCompleted?.length ?? 0
  const progressPercent =
    companion.total_parts > 0 ? (partsCompleted / companion.total_parts) * 100 : 0

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.companionCard,
        {
          backgroundColor: colors.card,
          borderColor: featured
            ? themeColor + '55'
            : isComplete
            ? colors.emeraldMid + '33'
            : colors.border,
          opacity: isComplete ? 0.85 : 1,
        },
      ]}
    >
      {/* Progress strip */}
      {partsCompleted > 0 && !isComplete && (
        <View style={[styles.progressStrip, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressStripFill,
              { width: `${progressPercent}%` as any, backgroundColor: themeColor },
            ]}
          />
        </View>
      )}

      <View style={styles.companionRow}>
        {/* Avatar */}
        <View style={[styles.companionAvatar, { backgroundColor: themeColor + '22' }]}>
          <Text style={[styles.companionAvatarText, { color: themeColor }]}>
            {companion.name_en?.charAt(0) ?? 'C'}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.companionInfo}>
          <View style={styles.companionNameRow}>
            <Text style={[styles.companionName, { color: colors.bronzeText }]}>
              {companion.name_en}
            </Text>
            {isComplete && (
              <Text style={[styles.statusIcon, { color: colors.success }]}>✓</Text>
            )}
            {progress?.isBookmarked && (
              <Text style={[styles.statusIcon, { color: colors.goldMid }]}>★</Text>
            )}
          </View>
          {companion.name_ar ? (
            <Text style={[styles.companionArabic, { color: colors.goldMid }]}>
              {companion.name_ar}
            </Text>
          ) : null}
          <Text style={[styles.companionTitle, { color: themeColor }]} numberOfLines={1}>
            {companion.title_en}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.mutedText }]}>
              {companion.total_parts} parts
            </Text>
            {companion.estimated_read_time_minutes != null && (
              <Text style={[styles.metaText, { color: colors.mutedText }]}>
                · {companion.estimated_read_time_minutes} min
              </Text>
            )}
            {partsCompleted > 0 && !isComplete && (
              <Text style={[styles.metaText, { color: themeColor, fontWeight: '600' }]}>
                · {partsCompleted}/{companion.total_parts} read
              </Text>
            )}
          </View>
          {companion.notable_for && companion.notable_for.length > 0 && (
            <View style={styles.tagsRow}>
              {companion.notable_for.slice(0, 2).map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: colors.mutedText + '18' }]}
                >
                  <Text style={[styles.tagText, { color: colors.mutedText }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={[styles.chevron, { color: colors.mutedText }]}>›</Text>
      </View>
    </Pressable>
  )
}

// ─── Prophet card ─────────────────────────────────────────────────────

function ProphetCard({
  prophet,
  index,
  colors,
  onPress,
}: {
  prophet: ProphetRow
  index: number
  colors: ReturnType<typeof getColors>
  onPress: () => void
}) {
  const themeColor = prophet.theme_primary || colors.emeraldMid

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.prophetCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.prophetNumber, { backgroundColor: themeColor + '22' }]}>
        <Text style={[styles.prophetNumberText, { color: themeColor }]}>
          {index + 1}
        </Text>
      </View>
      <View style={styles.companionInfo}>
        <View style={styles.companionNameRow}>
          <Text style={[styles.companionName, { color: colors.bronzeText }]}>
            {prophet.name_en}
          </Text>
          {prophet.name_ar ? (
            <Text style={[styles.companionArabic, { color: colors.mutedText, marginLeft: SPACING.xs }]}>
              {prophet.name_ar}
            </Text>
          ) : null}
        </View>
        {prophet.title_en ? (
          <Text style={[styles.companionTitle, { color: themeColor }]} numberOfLines={1}>
            {prophet.title_en}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: colors.mutedText }]}>
            {prophet.total_parts} parts
          </Text>
          {prophet.estimated_read_time_minutes != null && (
            <Text style={[styles.metaText, { color: colors.mutedText }]}>
              · {prophet.estimated_read_time_minutes} min
            </Text>
          )}
          {(prophet.quran_mentions ?? 0) > 0 && (
            <Text style={[styles.metaText, { color: colors.mutedText }]}>
              · {prophet.quran_mentions} Quran mentions
            </Text>
          )}
          {prophet.era ? (
            <View style={[styles.eraBadge, { backgroundColor: colors.border }]}>
              <Text style={[styles.tagText, { color: colors.mutedText }]}>{prophet.era}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={[styles.chevron, { color: colors.mutedText }]}>›</Text>
    </Pressable>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  title: { fontSize: FONT_SIZES.xxxl, fontWeight: '700', fontFamily: FONT_FAMILY.heading, paddingTop: SPACING.md, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZES.sm, fontFamily: FONT_FAMILY.body, marginBottom: SPACING.md },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomWidth: 2 },
  tabLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold },

  description: { fontSize: FONT_SIZES.sm, fontFamily: FONT_FAMILY.body, lineHeight: 20, marginBottom: SPACING.md },

  section: { marginBottom: SPACING.lg },
  sectionLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', fontFamily: FONT_FAMILY.heading, letterSpacing: 1.5, marginBottom: SPACING.sm },

  // Companion card
  companionCard: {
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  progressStrip: { height: 3 },
  progressStripFill: { height: 3 },
  companionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md },
  companionAvatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  companionAvatarText: { fontSize: FONT_SIZES.xl, fontWeight: '700', fontFamily: FONT_FAMILY.heading },
  companionInfo: { flex: 1, minWidth: 0 },
  companionNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flexWrap: 'wrap' },
  companionName: { fontSize: FONT_SIZES.sm, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold },
  statusIcon: { fontSize: FONT_SIZES.sm },
  companionArabic: { fontSize: FONT_SIZES.xs },
  companionTitle: { fontSize: FONT_SIZES.xs, fontWeight: '500', fontFamily: FONT_FAMILY.bodyMedium, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: SPACING.xs, flexWrap: 'wrap' },
  metaText: { fontSize: 10 },
  tagsRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.xs, flexWrap: 'wrap' },
  tag: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  tagText: { fontSize: 10 },
  chevron: { fontSize: 22, flexShrink: 0 },

  // Prophet card
  prophetCard: {
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    overflow: 'hidden',
  },
  prophetNumber: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  prophetNumberText: { fontSize: FONT_SIZES.lg, fontWeight: '700', fontFamily: FONT_FAMILY.heading },
  eraBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    marginLeft: SPACING.xs,
  },
})
