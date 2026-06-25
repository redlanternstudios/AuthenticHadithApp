import React, { useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native'
import { useLocalSearchParams, Stack, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useHadith } from '@/hooks/use-hadith'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, LAYOUT } from '@/lib/styles/colors'
import { FONT_FAMILY } from '@/constants/theme'
import { useDeviceLayout } from '@/lib/hooks/use-device-layout'
import { shareHadith } from '@/components/share/ShareSheet'
import { SaveHadithModal } from '@/components/my-hadith/SaveHadithModal'
import { sendChatMessage } from '@/lib/api/groq'
import { supabase } from '@/lib/supabase/client'
import {
  formatHadithReference,
  useCollectionDisplayNames,
} from '@/lib/hadith/collectionDisplayName'
import { isHiddenCollection } from '@/lib/hadith/visibleCollections'

// Key Teaching panel gating. The `enriched_hadiths` table holds optional
// per-hadith insight rows whose authorial provenance has not been documented
// in V1_SCHEMA_ALIGNMENT_AUDIT.md. Until that's resolved we do not render the
// panel — better to hide unattributed religious content than to show it
// without a source label. Flip to true when docs/ENRICHED_HADITHS_PROVENANCE.md
// is populated and the panel has an appropriate "AI-generated insight" or
// scholar-credited label.
const ENRICHED_HADITHS_ENABLED = false

type LanguageMode = 'arabic' | 'both' | 'english'

export default function HadithDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const { contentBottom, pagePadding, maxContentWidth } = useDeviceLayout()
  const router = useRouter()

  const { hadith, isLoading, isBookmarked, toggleBookmark, isTogglingBookmark } = useHadith(
    id,
    user?.id,
  )

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [languageMode, setLanguageMode] = useState<LanguageMode>('both')
  const { data: collectionNames } = useCollectionDisplayNames()

  const SUMMARY_UNAVAILABLE = 'Summary is temporarily unavailable. Please try again later.'

  // UX hardening (FIX-038): treat empty-string fields the same as missing.
  // Many production rows are skeleton rows with text fields empty. Render
  // honest fallbacks instead of blank section headers. UI guard only — actual
  // content backfill is a separate ops task.
  const hasEnglish =
    typeof hadith?.english_text === 'string' && hadith.english_text.trim().length > 0
  const hasArabic =
    typeof hadith?.arabic_text === 'string' && hadith.arabic_text.trim().length > 0

  // Fetch collection display name
  const { data: collectionData } = useQuery({
    queryKey: ['hadith-collection', hadith?.collection_slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('name_en')
        .eq('slug', hadith!.collection_slug)
        .single()
      if (error) return null
      return data as { name_en: string }
    },
    enabled: !!hadith?.collection_slug,
  })

  // Fetch tags for this hadith
  const { data: tags } = useQuery({
    queryKey: ['hadith-tags', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hadith_tags')
        .select('tag:tags(id, name_en, slug)')
        .eq('hadith_id', id)
      if (error) throw error
      return (data ?? [])
        .map((row: any) => row.tag)
        .filter(Boolean) as { id: string; name_en: string; slug: string }[]
    },
    enabled: !!id,
  })

  // Fetch enriched data (key teaching).
  // Provenance for `enriched_hadiths` is not yet documented; gated by
  // ENRICHED_HADITHS_ENABLED until the provenance doc lands. See top of file.
  const { data: enriched } = useQuery({
    queryKey: ['enriched-hadith', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enriched_hadiths')
        .select('key_teaching_en, summary_line')
        .eq('id', id)
        .single()
      if (error) return null
      return data as { key_teaching_en: string | null; summary_line: string | null }
    },
    enabled: ENRICHED_HADITHS_ENABLED && !!id,
  })

  // Friendly book name for the Reference table. Joins on collection_slug +
  // book_number when both are present.
  const { data: bookData } = useQuery({
    queryKey: ['hadith-book', hadith?.collection_slug, hadith?.book_number],
    queryFn: async () => {
      if (!hadith?.collection_slug || hadith?.book_number == null) return null
      const { data: collectionRow } = await supabase
        .from('collections')
        .select('id')
        .eq('slug', hadith.collection_slug)
        .maybeSingle()
      if (!collectionRow) return null
      const { data, error } = await supabase
        .from('books')
        .select('id, name')
        .eq('collection_id', (collectionRow as any).id)
        .eq('book_number', hadith.book_number)
        .maybeSingle()
      if (error) return null
      return data as { id: string; name: string } | null
    },
    enabled: !!hadith?.collection_slug && hadith?.book_number != null,
  })

  // Friendly chapter name for the Reference table.
  const { data: chapterData } = useQuery({
    queryKey: ['hadith-chapter', bookData?.id, hadith?.chapter_number],
    queryFn: async () => {
      if (!bookData?.id || hadith?.chapter_number == null) return null
      const { data, error } = await supabase
        .from('chapters')
        .select('name')
        .eq('book_id', bookData.id)
        .eq('chapter_number', hadith.chapter_number)
        .maybeSingle()
      if (error) return null
      return data as { name: string } | null
    },
    enabled: !!bookData?.id && hadith?.chapter_number != null,
  })

  const handleSummarize = async () => {
    if (!hadith) return
    // Guard (FIX-038): never send empty text to Groq. Surface friendly fallback instead.
    if (!hasEnglish) {
      setSummaryError(SUMMARY_UNAVAILABLE)
      return
    }
    setIsSummarizing(true)
    setSummary(null)
    setSummaryError(null)
    try {
      const response = await sendChatMessage([
        {
          id: Date.now().toString(),
          role: 'user',
          content: `Please provide a brief, clear summary of this hadith in 2-3 sentences. Focus on the key teaching or lesson. Do not issue any religious ruling, fatwa, or theological judgment. If the hadith requires scholarly interpretation, say so and recommend consulting a qualified scholar.\n\n${hadith.english_text}`,
          timestamp: new Date().toISOString(),
        },
      ])
      // Defensive: a missing or non-string response (e.g. backend route 404
      // returning HTML) must surface the friendly fallback rather than rendering
      // "undefined". Matches the inline-summary pattern used in HadithCard.
      if (typeof response === 'string' && response.trim().length > 0) {
        setSummary(response)
      } else {
        setSummaryError(SUMMARY_UNAVAILABLE)
      }
    } catch {
      setSummaryError(SUMMARY_UNAVAILABLE)
    } finally {
      setIsSummarizing(false)
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.emeraldMid} />
      </View>
    )
  }

  // Defense-in-depth: even if a direct /hadith/[id] is reached for a row in a
  // release-hidden collection (bypassing the filtered lists), treat it as not
  // found so no hidden-collection content ever renders.
  if (!hadith || isHiddenCollection(hadith.collection_slug)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedText }]}>Hadith not found</Text>
      </View>
    )
  }

  const collectionName =
    collectionData?.name_en || 'Unknown Collection'

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.emeraldMid,
          headerShadowVisible: false,
          // Transparent header blends with page background on iOS
          headerTransparent: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => toggleBookmark()}
              disabled={isTogglingBookmark || !user}
              style={styles.headerBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isBookmarked ? colors.emeraldMid : colors.mutedText}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: contentBottom,
            paddingHorizontal: pagePadding,
            alignSelf: 'center',
            width: '100%',
            maxWidth: maxContentWidth,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Collection + Number */}
        <View style={[styles.metaRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.collectionName, { color: colors.emeraldMid }]}>
            {collectionName}
          </Text>
          <Text style={[styles.hadithNumber, { color: colors.mutedText }]}>
            Hadith #{hadith.hadith_number}
          </Text>
        </View>

        {/* Grade badge + narrator */}
        <View style={styles.badgeRow}>
          {hadith.grade && (
            <View
              style={[
                styles.gradeBadge,
                {
                  backgroundColor:
                    hadith.grade === 'sahih'
                      ? colors.sahih + '18'
                      : hadith.grade === 'hasan'
                      ? colors.hasan + '18'
                      : colors.daif + '18',
                },
              ]}
            >
              <Text
                style={[
                  styles.gradeText,
                  {
                    color:
                      hadith.grade === 'sahih'
                        ? colors.sahih
                        : hadith.grade === 'hasan'
                        ? colors.hasan
                        : colors.daif,
                  },
                ]}
              >
                {hadith.grade.charAt(0).toUpperCase() + hadith.grade.slice(1)}
              </Text>
            </View>
          )}
          {hadith.narrator && (
            <Text style={[styles.narrator, { color: colors.mutedText }]}>
              {hadith.narrator}
            </Text>
          )}
        </View>

        {/* Topic Tags */}
        {tags && tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map(tag => (
              <Pressable
                key={tag.id}
                style={({ pressed }) => [
                  styles.tagChip,
                  {
                    backgroundColor: colors.emeraldMid + '14',
                    borderColor: colors.emeraldMid + '30',
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => router.push(`/topics/${tag.slug}`)}
                accessibilityLabel={`View ${tag.name_en} topic`}
                accessibilityRole="button"
              >
                <Text style={[styles.tagChipText, { color: colors.emeraldMid }]}>
                  {tag.name_en}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Language Toggle */}
        <View style={[styles.langToggleRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {([
            { key: 'arabic' as LanguageMode, label: 'العربية' },
            { key: 'both' as LanguageMode, label: 'Both' },
            { key: 'english' as LanguageMode, label: 'English' },
          ]).map(seg => {
            const isActive = languageMode === seg.key
            return (
              <Pressable
                key={seg.key}
                style={[
                  styles.langSegment,
                  isActive && { backgroundColor: colors.emeraldMid },
                ]}
                onPress={() => setLanguageMode(seg.key)}
                accessibilityLabel={`Show ${seg.label} text`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.langSegmentText,
                    { color: isActive ? colors.white : colors.mutedText },
                    isActive && { fontWeight: '700' },
                  ]}
                >
                  {seg.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Key Teaching Panel */}
        {enriched?.key_teaching_en ? (
          <View
            style={[
              styles.keyTeachingPanel,
              {
                backgroundColor: colors.goldMid + '12',
                borderLeftColor: colors.goldMid,
                borderColor: colors.goldMid + '30',
              },
            ]}
          >
            <Text style={[styles.keyTeachingTitle, { color: colors.goldMid }]}>Key Teaching</Text>
            <Text style={[styles.keyTeachingBody, { color: colors.bronzeText }]}>
              {enriched.key_teaching_en}
            </Text>
          </View>
        ) : null}

        {/* Arabic text */}
        {languageMode !== 'english' ? (
          <View style={[styles.textSection, { borderBottomColor: colors.borderSubtle }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>Arabic</Text>
            {hasArabic ? (
              <Text style={[styles.arabicText, { color: colors.bronzeText }]}>
                {hadith.arabic_text}
              </Text>
            ) : (
              // FIX-038 fallback: honest placeholder instead of empty body
              <Text style={[styles.englishText, { color: colors.mutedText, fontStyle: 'italic' }]}>
                Arabic text is currently unavailable for this record.
              </Text>
            )}
          </View>
        ) : null}

        {/* English */}
        {languageMode !== 'arabic' ? (
          <View style={[styles.textSection, { borderBottomColor: colors.borderSubtle }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>Translation</Text>
            {hasEnglish ? (
              <Text style={[styles.englishText, { color: colors.bronzeText }]}>
                {hadith.english_text}
              </Text>
            ) : (
              // FIX-038 fallback
              <Text style={[styles.englishText, { color: colors.mutedText, fontStyle: 'italic' }]}>
                Translation is currently unavailable for this record.
              </Text>
            )}
          </View>
        ) : null}

        {/* Reference Table */}
        <View style={[styles.referenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedText, marginBottom: SPACING.sm }]}>Reference</Text>
          <View style={styles.referenceRow}>
            <Text style={[styles.referenceLabel, { color: colors.mutedText }]}>Reference</Text>
            <Text style={[styles.referenceValue, { color: colors.bronzeText }]}>
              {formatHadithReference(hadith, collectionNames)}
            </Text>
          </View>
          {bookData?.name ? (
            <View style={styles.referenceRow}>
              <Text style={[styles.referenceLabel, { color: colors.mutedText }]}>Book</Text>
              <Text style={[styles.referenceValue, { color: colors.bronzeText }]}>
                {bookData.name}
              </Text>
            </View>
          ) : null}
          {chapterData?.name ? (
            <View style={styles.referenceRow}>
              <Text style={[styles.referenceLabel, { color: colors.mutedText }]}>Chapter</Text>
              <Text style={[styles.referenceValue, { color: colors.bronzeText }]}>
                {chapterData.name}
              </Text>
            </View>
          ) : null}
          {hadith.narrator ? (
            <View style={styles.referenceRow}>
              <Text style={[styles.referenceLabel, { color: colors.mutedText }]}>Narrator</Text>
              <Text style={[styles.referenceValue, { color: colors.bronzeText }]}>
                {hadith.narrator}
              </Text>
            </View>
          ) : null}
          {hadith.grade ? (
            <View style={styles.referenceRow}>
              <Text style={[styles.referenceLabel, { color: colors.mutedText }]}>Grade</Text>
              <View
                style={[
                  styles.gradeBadge,
                  {
                    backgroundColor:
                      hadith.grade === 'sahih'
                        ? colors.sahih + '18'
                        : hadith.grade === 'hasan'
                        ? colors.hasan + '18'
                        : colors.daif + '18',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.gradeText,
                    {
                      color:
                        hadith.grade === 'sahih'
                          ? colors.sahih
                          : hadith.grade === 'hasan'
                          ? colors.hasan
                          : colors.daif,
                    },
                  ]}
                >
                  {hadith.grade.charAt(0).toUpperCase() + hadith.grade.slice(1)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* AI summarise button. FIX-038: rendered disabled with muted styling
            and "Summary unavailable" copy when english_text is empty, so the
            user does not tap an active-looking button that only returns the
            friendly fallback. handleSummarize keeps its own short-circuit as
            defense-in-depth. */}
        <Pressable
          style={({ pressed }) => [
            styles.summarizeBtn,
            hasEnglish
              ? {
                  backgroundColor: colors.goldMid + '18',
                  borderColor: colors.goldMid + '60',
                  opacity: pressed || isSummarizing ? 0.75 : 1,
                }
              : {
                  backgroundColor: colors.mutedText + '10',
                  borderColor: colors.mutedText + '40',
                  opacity: 0.6,
                },
          ]}
          onPress={handleSummarize}
          disabled={isSummarizing || !hasEnglish}
          accessibilityLabel={isSummarizing ? 'Generating AI summary' : hasEnglish ? 'Generate AI summary' : 'AI summary unavailable'}
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasEnglish }}
        >
          {isSummarizing ? (
            <ActivityIndicator size="small" color={colors.goldMid} />
          ) : (
            <Ionicons
              name="sparkles-outline"
              size={17}
              color={hasEnglish ? colors.goldMid : colors.mutedText}
            />
          )}
          <Text
            style={[
              styles.summarizeBtnText,
              { color: hasEnglish ? colors.goldMid : colors.mutedText },
            ]}
          >
            {isSummarizing
              ? 'Summarising…'
              : hasEnglish
              ? 'AI Summary'
              : 'Summary unavailable'}
          </Text>
        </Pressable>

        {/* Summary result */}
        {summary ? (
          <View
            style={[
              styles.summaryBox,
              { backgroundColor: colors.card, borderColor: colors.border },
              isDark ? SHADOWS.cardDark : SHADOWS.subtle,
            ]}
          >
            <Text style={[styles.sectionLabel, { color: colors.emeraldMid }]}>AI Summary</Text>
            <Text style={[styles.summaryText, { color: colors.bronzeText }]}>{summary}</Text>
            <Text style={[styles.summaryDisclaimer, { color: colors.mutedText }]}>
              AI-generated. Not a religious ruling.
            </Text>
          </View>
        ) : null}

        {/* Friendly inline fallback when AI Summary is unavailable.
            Replaces the prior Alert.alert popup so a backend outage does not
            interrupt reading the hadith itself. */}
        {summaryError ? (
          <View
            style={[
              styles.summaryBox,
              { backgroundColor: colors.mutedText + '10', borderColor: colors.border },
            ]}
          >
            <Text style={[styles.summaryText, { color: colors.mutedText }]}>{summaryError}</Text>
          </View>
        ) : null}

        {/* Action buttons */}
        <View style={styles.actions}>
          {[
            {
              icon: 'folder-outline' as const,
              label: 'Save',
              onPress: () => setShowSaveModal(true),
            },
            {
              icon: 'share-outline' as const,
              label: 'Share',
              onPress: () => shareHadith(hadith),
            },
            {
              icon: 'library-outline' as const,
              label: 'Collection',
              onPress: () => router.push(`/collection/${hadith.collection_slug}`),
            },
          ].map(btn => (
            <Pressable
              key={btn.label}
              style={({ pressed }) => [
                styles.actionBtn,
                { borderColor: colors.border, backgroundColor: colors.card },
                pressed && { opacity: 0.7 },
              ]}
              onPress={btn.onPress}
              accessibilityLabel={btn.label === 'Collection' ? `View ${collectionName} collection` : `${btn.label} hadith`}
              accessibilityRole="button"
            >
              <Ionicons name={btn.icon} size={18} color={colors.emeraldMid} />
              <Text style={[styles.actionBtnText, { color: colors.emeraldMid }]}>
                {btn.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <SaveHadithModal
        visible={showSaveModal}
        hadithId={id}
        onClose={() => setShowSaveModal(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: SPACING.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.md,
  },
  headerBtn: {
    marginRight: 4,
    padding: SPACING.sm,
  },
  metaRow: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  collectionName: {
    fontFamily: FONT_FAMILY.headingMedium,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  hadithNumber: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  gradeText: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  narrator: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
    flex: 1,
  },
  textSection: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionLabel: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  arabicText: {
    fontSize: FONT_SIZES.xl,
    lineHeight: 40,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  englishText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.md,
    lineHeight: 28,
  },
  summarizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 13,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    minHeight: LAYOUT.touchTarget,
  },
  summarizeBtnText: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  summaryBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
  },
  summaryDisclaimer: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.xs,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 12,
    minHeight: LAYOUT.touchTarget,
  },
  actionBtnText: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  // Language toggle
  langToggleRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  langSegment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langSegmentText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  // Topic tag chips
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  tagChipText: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  // Key teaching panel
  keyTeachingPanel: {
    borderLeftWidth: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  keyTeachingTitle: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  keyTeachingBody: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
  },
  // Reference table
  referenceCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  referenceLabel: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  referenceValue: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '65%',
  },
})
