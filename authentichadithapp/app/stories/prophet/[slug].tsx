/**
 * Prophet Story Reader — multi-part, per-part progress, references,
 * share-to-social.
 *
 * Mirrors web `stories/prophets/[slug]/page.tsx` (SSOT).
 * Prophet stories use `prophet_stories` table (not `story_parts`).
 * References schema: quran_references[] / hadith_references[] (array
 * of {collection, reference, text} objects vs the sahaba's JSONB shape).
 *
 * Forbidden layers untouched: bookmark-service.ts, use-hadith.ts, auth/*,
 * purchases/*, hadiths/saved_hadiths schema.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Pressable,
  Share,
  ActivityIndicator,
} from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { FONT_FAMILY } from '@/constants/theme'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { trackActivity } from '@/lib/gamification/track-activity'
import {
  advanceStoryPart,
  toggleStoryBookmark,
  getStoryPartProgress,
  StoryPartProgress,
  markComplete as svcMarkComplete,
} from '@/lib/progress/progressService'

// ─── Types ──────────────────────────────────────────────────────────

interface Prophet {
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
  theme_secondary: string | null
}

interface QuranRef {
  surah: string
  ayah: string
  text?: string
}

interface HadithRef {
  collection: string
  reference: string
  text?: string
}

interface ProphetStoryPart {
  id: string
  part_number: number
  title_en: string
  title_ar: string | null
  content_en: string
  opening_hook: string | null
  key_lesson: string | null
  historical_context: string | null
  quran_references: QuranRef[] | null
  hadith_references: HadithRef[] | null
  estimated_read_minutes: number | null
}

// ─── Content renderer ─────────────────────────────────────────────

function renderContentParagraphs(
  content: string,
  themeColor: string,
  mutedText: string,
  bronzeText: string,
  goldMid: string
): React.ReactElement[] {
  return content.split('\n\n').map((p, i) => {
    const isQuranQuote =
      (/Quran \d+:\d+/.test(p) || /Surah/.test(p)) &&
      (p.includes('"') || p.includes("'"))
    const isHadithQuote =
      p.includes('Prophet') &&
      (p.includes('said:') || p.includes('peace be upon him'))

    if (isQuranQuote) {
      return (
        <View
          key={i}
          style={[
            styles.quoteBlock,
            { borderLeftColor: themeColor, backgroundColor: themeColor + '14' },
          ]}
        >
          <Text style={[styles.quoteText, { color: bronzeText, fontStyle: 'italic' }]}>
            {p}
          </Text>
        </View>
      )
    }
    if (isHadithQuote) {
      return (
        <View
          key={i}
          style={[
            styles.quoteBlock,
            { borderLeftColor: goldMid, backgroundColor: goldMid + '0d' },
          ]}
        >
          <Text style={[styles.quoteText, { color: bronzeText }]}>{p}</Text>
        </View>
      )
    }
    return (
      <Text key={i} style={[styles.bodyParagraph, { color: mutedText }]}>
        {p}
      </Text>
    )
  })
}

// ─── Screen ──────────────────────────────────────────────────────────

export default function ProphetStoryScreen() {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const router = useRouter()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { user } = useAuth()
  const scrollRef = useRef<ScrollView>(null)

  // ── local state ──────────────────────────────────────────────────
  const [currentPart, setCurrentPart] = useState(1)
  const [partProgress, setPartProgress] = useState<StoryPartProgress | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [progressLoaded, setProgressLoaded] = useState(false)

  // ── data fetching ────────────────────────────────────────────────
  const { data: prophet, isLoading } = useQuery({
    queryKey: ['prophet', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prophets')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      if (error) {
        __DEV__ && console.warn('[ProphetStory] prophets query failed (non-fatal):', error.message)
        return null
      }
      return data as Prophet | null
    },
    enabled: !!slug,
  })

  const { data: storyParts } = useQuery({
    queryKey: ['prophet-parts', prophet?.id],
    queryFn: async () => {
      if (!prophet?.id) return []
      const { data, error } = await supabase
        .from('prophet_stories')
        .select('*')
        .eq('prophet_id', prophet.id)
        .eq('is_published', true)
        .order('part_number')
      if (error) {
        __DEV__ && console.warn('[ProphetStory] prophet_stories query failed:', error.message)
        return []
      }
      return (data || []) as ProphetStoryPart[]
    },
    enabled: !!prophet?.id,
  })

  // ── load local per-part progress once prophet is resolved ────────
  useEffect(() => {
    if (!prophet?.id) return
    getStoryPartProgress('prophet', prophet.id).then((p) => {
      if (p) {
        setPartProgress(p)
        setCurrentPart(p.currentPart)
        setIsBookmarked(p.isBookmarked)
      }
      setProgressLoaded(true)
    })
  }, [prophet?.id])

  // ── derived ──────────────────────────────────────────────────────
  const parts = storyParts || []
  const totalParts = prophet?.total_parts ?? parts.length
  const themeColor = prophet?.theme_primary ?? colors.emeraldMid
  const progressPercent = totalParts > 0 ? (currentPart / totalParts) * 100 : 0
  const partsCompleted = partProgress?.partsCompleted ?? []
  const isCurrentPartCompleted = partsCompleted.includes(currentPart)
  const part = parts[currentPart - 1] as ProphetStoryPart | undefined

  // ── navigation handlers ──────────────────────────────────────────
  const handleNext = useCallback(async () => {
    if (!prophet || isAdvancing) return
    setIsAdvancing(true)
    try {
      const next = currentPart + 1
      const updated = await advanceStoryPart({
        entityKind: 'prophet',
        entityId: prophet.id,
        totalParts,
        nextPart: next,
        completedPart: currentPart,
        isBookmarked,
      })
      setPartProgress(updated)
      setCurrentPart(next)
      scrollRef.current?.scrollTo({ y: 0, animated: true })
    } finally {
      setIsAdvancing(false)
    }
  }, [prophet, currentPart, isAdvancing, isBookmarked, totalParts])

  const handlePrev = useCallback(() => {
    if (currentPart <= 1) return
    setCurrentPart(currentPart - 1)
    scrollRef.current?.scrollTo({ y: 0, animated: true })
  }, [currentPart])

  const handleDone = useCallback(async () => {
    if (!prophet || isAdvancing) return
    setIsAdvancing(true)
    try {
      const updated = await advanceStoryPart({
        entityKind: 'prophet',
        entityId: prophet.id,
        totalParts,
        nextPart: currentPart,
        completedPart: currentPart,
        isBookmarked,
      })
      setPartProgress(updated)
      await svcMarkComplete('story', slug ?? prophet.slug, {
        entityKind: 'prophet',
        entityId: prophet.id,
      })
      if (user) {
        try { await trackActivity(user.id, 'complete_story') } catch { /* non-fatal */ }
      }
      router.push('/stories')
    } finally {
      setIsAdvancing(false)
    }
  }, [prophet, currentPart, isAdvancing, isBookmarked, totalParts, slug, user, router])

  const handleShare = useCallback(async () => {
    const text = `Read the story of Prophet ${prophet?.name_en} on Authentic Hadith`
    try {
      await Share.share({
        title: prophet?.name_en ?? 'Story',
        message: text,
      })
    } catch (err) {
      __DEV__ && console.warn('[ProphetStory] Share failed (non-fatal):', err)
    }
  }, [prophet])

  const handleBookmark = useCallback(async () => {
    if (!prophet) return
    const newVal = await toggleStoryBookmark('prophet', prophet.id)
    setIsBookmarked(newVal)
  }, [prophet])

  // ── loading / not found guards ───────────────────────────────────
  if (isLoading || !progressLoaded) {
    return <LoadingSpinner />
  }

  if (!prophet) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Not Found', headerShown: true }} />
        <Text style={[styles.emptyText, { color: colors.mutedText }]}>Story not found.</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Sticky header ─────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.push('/stories')}
            style={[styles.iconBtn, { backgroundColor: colors.background }]}
            accessibilityRole="button"
            accessibilityLabel="Back to stories"
          >
            <Text style={[styles.chevronLeft, { color: colors.bronzeText }]}>‹</Text>
          </Pressable>
          <View style={styles.headerMid}>
            <Text style={[styles.headerTitle, { color: colors.bronzeText }]} numberOfLines={1}>
              Prophet {prophet.name_en}
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedText }]}>
              Part {currentPart} of {totalParts}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/(tabs)')}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Go to Home"
            >
              <Ionicons name="home" size={18} color={colors.goldMid} />
            </Pressable>
            {/* Bookmark */}
            <Pressable
              onPress={handleBookmark}
              style={[
                styles.iconBtn,
                isBookmarked && { backgroundColor: themeColor + '1a' },
              ]}
              accessibilityRole="button"
              accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
            >
              <Text style={{ fontFamily: FONT_FAMILY.body, fontSize: 18, color: isBookmarked ? themeColor : colors.mutedText }}>
                {isBookmarked ? '★' : '☆'}
              </Text>
            </Pressable>
            {/* Share */}
            <Pressable
              onPress={handleShare}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Share story"
            >
              <Text style={{ fontFamily: FONT_FAMILY.body, fontSize: 16, color: colors.mutedText }}>{'↑'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%` as any, backgroundColor: themeColor },
            ]}
          />
        </View>
      </View>

      {/* ── Scrollable content ────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {part ? (
          <>
            {/* Part header */}
            <View style={styles.partHeader}>
              <View style={styles.partLabelRow}>
                <Text style={[styles.partLabel, { color: themeColor }]}>
                  PART {part.part_number}
                </Text>
                {prophet.name_ar ? (
                  <Text style={[styles.partLabelAr, { color: colors.mutedText }]}>
                    {prophet.name_ar}
                  </Text>
                ) : null}
                {isCurrentPartCompleted && (
                  <Text style={[styles.checkmark, { color: colors.success }]}>✓</Text>
                )}
              </View>
              <Text style={[styles.partTitle, { color: colors.bronzeText }]}>
                {part.title_en}
              </Text>
              {part.title_ar ? (
                <Text style={[styles.partTitleAr, { color: colors.mutedText }]}>
                  {part.title_ar}
                </Text>
              ) : null}
              <View style={styles.metaRow}>
                {part.estimated_read_minutes != null && (
                  <Text style={[styles.metaBadge, { color: colors.mutedText }]}>
                    {part.estimated_read_minutes} min
                  </Text>
                )}
                {prophet.era ? (
                  <Text style={[styles.metaBadge, { color: colors.mutedText }]}>
                    {prophet.era}
                  </Text>
                ) : null}
                {(prophet.quran_mentions ?? 0) > 0 && (
                  <Text style={[styles.metaBadge, { color: colors.mutedText }]}>
                    {prophet.quran_mentions} Quran mentions
                  </Text>
                )}
              </View>
            </View>

            {/* Opening hook */}
            {part.opening_hook ? (
              <View
                style={[
                  styles.openingHook,
                  { borderLeftColor: themeColor, backgroundColor: themeColor + '14' },
                ]}
              >
                <Text style={[styles.openingHookText, { color: colors.bronzeText }]}>
                  {part.opening_hook}
                </Text>
              </View>
            ) : null}

            {/* Historical context */}
            {part.historical_context ? (
              <View style={[styles.historyBox, { backgroundColor: colors.border + '44' }]}>
                <Text style={[styles.historyLabel, { color: colors.mutedText }]}>
                  HISTORICAL CONTEXT
                </Text>
                <Text style={[styles.historyText, { color: colors.bronzeText + 'cc' }]}>
                  {part.historical_context}
                </Text>
              </View>
            ) : null}

            {/* Main content */}
            <View style={styles.articleBody}>
              {renderContentParagraphs(
                part.content_en ?? '',
                themeColor,
                colors.mutedText,
                colors.bronzeText,
                colors.goldMid
              )}
            </View>

            {/* Key Lesson */}
            {part.key_lesson ? (
              <View
                style={[
                  styles.lessonBox,
                  {
                    backgroundColor: colors.emeraldMid + '0d',
                    borderColor: colors.emeraldMid + '1a',
                  },
                ]}
              >
                <Text style={[styles.lessonLabel, { color: colors.emeraldMid }]}>
                  KEY LESSON
                </Text>
                <Text style={[styles.lessonText, { color: colors.bronzeText }]}>
                  {part.key_lesson}
                </Text>
              </View>
            ) : null}

            {/* B#3 — Quran References */}
            {part.quran_references && part.quran_references.length > 0 ? (
              <View style={styles.refSection}>
                <Text style={[styles.refSectionLabel, { color: colors.mutedText }]}>
                  QURAN REFERENCES
                </Text>
                {part.quran_references.map((ref, i) => (
                  <View key={i} style={styles.refRow}>
                    <Text style={[styles.refIcon, { color: themeColor }]}>{'◆'}</Text>
                    <Text style={[styles.refText, { color: colors.mutedText }]}>
                      Surah {ref.surah}:{ref.ayah}
                      {ref.text ? ` — ${ref.text}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* B#3 — Hadith References */}
            {part.hadith_references && part.hadith_references.length > 0 ? (
              <View style={styles.refSection}>
                <Text style={[styles.refSectionLabel, { color: colors.mutedText }]}>
                  HADITH REFERENCES
                </Text>
                <View style={styles.tagsRow}>
                  {part.hadith_references.map((ref, i) => (
                    <View
                      key={i}
                      style={[
                        styles.refTag,
                        { backgroundColor: colors.goldMid + '1a' },
                      ]}
                    >
                      <Text style={[styles.refTagText, { color: colors.goldShadow }]}>
                        {ref.collection} {ref.reference}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.emptyPart}>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>
              This part is not available yet.
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Fixed bottom navigation ───────────────────────────────── */}
      <View
        style={[
          styles.bottomNav,
          { backgroundColor: colors.card, borderTopColor: colors.border },
        ]}
      >
        {/* Previous */}
        <Pressable
          onPress={handlePrev}
          disabled={currentPart <= 1}
          style={[styles.navBtn, currentPart <= 1 && styles.navBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Previous part"
        >
          <Text
            style={[
              styles.navBtnText,
              { color: currentPart <= 1 ? colors.mutedText + '60' : colors.bronzeText },
            ]}
          >
            ‹ Previous
          </Text>
        </Pressable>

        {/* Part dots */}
        <View style={styles.dots}>
          {Array.from({ length: totalParts }, (_, i) => i + 1).map((num) => {
            const active = num === currentPart
            const done = partsCompleted.includes(num)
            return (
              <Pressable
                key={num}
                onPress={() => {
                  setCurrentPart(num)
                  scrollRef.current?.scrollTo({ y: 0, animated: true })
                }}
                accessibilityRole="button"
                accessibilityLabel={`Go to part ${num}`}
                style={[
                  styles.dot,
                  active && [styles.dotActive, { backgroundColor: themeColor }],
                  !active && done && { backgroundColor: colors.success + '66' },
                  !active && !done && { backgroundColor: colors.border },
                ]}
              />
            )
          })}
        </View>

        {/* Next / Done */}
        {currentPart >= totalParts ? (
          <Pressable
            onPress={handleDone}
            disabled={isAdvancing}
            style={[styles.navBtnPrimary, { backgroundColor: themeColor }]}
            accessibilityRole="button"
            accessibilityLabel="Complete story"
          >
            {isAdvancing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.navBtnPrimaryText}>Done ✓</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={handleNext}
            disabled={isAdvancing}
            style={[styles.navBtnPrimary, { backgroundColor: themeColor }]}
            accessibilityRole="button"
            accessibilityLabel="Next part"
          >
            {isAdvancing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.navBtnPrimaryText}>Next ›</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { borderBottomWidth: 1, paddingTop: SPACING.xl + SPACING.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  headerMid: { flex: 1 },
  headerTitle: { fontFamily: FONT_FAMILY.heading, fontSize: FONT_SIZES.sm, fontWeight: '700' },
  headerSub: { fontFamily: FONT_FAMILY.body, fontSize: FONT_SIZES.xs },
  headerActions: { flexDirection: 'row', gap: SPACING.xs },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronLeft: { fontSize: 26, lineHeight: 32 },
  progressTrack: { height: 3 },
  progressFill: { height: 3 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },

  partHeader: { marginBottom: SPACING.lg },
  partLabelRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs, flexWrap: 'wrap' },
  partLabel: { fontFamily: FONT_FAMILY.heading, fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 1.2 },
  partLabelAr: { fontSize: FONT_SIZES.xs, fontFamily: FONT_FAMILY.arabic },
  checkmark: { fontFamily: FONT_FAMILY.body, fontSize: FONT_SIZES.sm, fontWeight: '700' },
  partTitle: { fontFamily: FONT_FAMILY.heading, fontSize: FONT_SIZES.xxl, fontWeight: '700', lineHeight: 32, marginBottom: SPACING.xs },
  partTitleAr: { fontSize: FONT_SIZES.lg, fontFamily: FONT_FAMILY.arabic, textAlign: 'right', marginBottom: SPACING.xs },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs },
  metaBadge: { fontFamily: FONT_FAMILY.body, fontSize: FONT_SIZES.xs },

  openingHook: {
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  openingHookText: { fontFamily: FONT_FAMILY.body, fontSize: FONT_SIZES.md, fontStyle: 'italic', lineHeight: 26 },

  historyBox: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  historyLabel: { fontFamily: FONT_FAMILY.heading, fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 1.2, marginBottom: SPACING.xs },
  historyText: { fontFamily: FONT_FAMILY.body, fontSize: FONT_SIZES.sm, lineHeight: 20 },

  articleBody: { marginBottom: SPACING.md },
  bodyParagraph: { fontFamily: FONT_FAMILY.body, fontSize: FONT_SIZES.base, lineHeight: 26, marginBottom: SPACING.md },
  quoteBlock: {
    borderLeftWidth: 4,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginVertical: SPACING.md,
  },
  quoteText: { fontFamily: FONT_FAMILY.body, fontSize: FONT_SIZES.base, lineHeight: 24 },

  lessonBox: {
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  lessonLabel: { fontFamily: FONT_FAMILY.heading, fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 1.2, marginBottom: SPACING.xs },
  lessonText: { fontFamily: FONT_FAMILY.body, fontSize: FONT_SIZES.base, fontWeight: '500', lineHeight: 24 },

  refSection: { marginTop: SPACING.md, marginBottom: SPACING.sm },
  refSectionLabel: { fontFamily: FONT_FAMILY.heading, fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 1.2, marginBottom: SPACING.sm },
  refRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.xs },
  refIcon: { fontFamily: FONT_FAMILY.body, fontSize: FONT_SIZES.xs, marginTop: 3 },
  refText: { fontFamily: FONT_FAMILY.body, flex: 1, fontSize: FONT_SIZES.sm, lineHeight: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  refTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  refTagText: { fontFamily: FONT_FAMILY.body, fontSize: FONT_SIZES.xs, fontWeight: '500' },

  emptyPart: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyText: { fontFamily: FONT_FAMILY.body, fontSize: FONT_SIZES.base },

  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  navBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { fontFamily: FONT_FAMILY.body, fontSize: FONT_SIZES.sm, fontWeight: '500' },
  navBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  navBtnPrimaryText: { fontFamily: FONT_FAMILY.body, fontSize: FONT_SIZES.sm, fontWeight: '600', color: '#ffffff' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 20, height: 8, borderRadius: 4 },
})
