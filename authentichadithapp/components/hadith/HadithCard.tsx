import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { Card } from '../ui/Card'
import { GradeBadge } from './GradeBadge'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { Hadith } from '@/types/hadith'
import { sendChatMessage } from '@/lib/api/groq'
import {
  formatHadithReference,
  useCollectionDisplayNames,
} from '@/lib/hadith/collectionDisplayName'

interface HadithCardProps {
  hadith: Hadith
  onPress?: () => void
  compact?: boolean
  /**
   * Show an inline "AI Summary" action below the hadith. Used on the home
   * "Hadith of the Moment" card so users can summarize without drilling
   * into the detail screen. Default false — the detail screen has its own
   * full implementation; we don't want this duplicated everywhere.
   */
  showSummarize?: boolean
}

const SUMMARY_UNAVAILABLE = 'Summary is temporarily unavailable. Please try again later.'

export function HadithCard({ hadith, onPress, compact = false, showSummarize = false }: HadithCardProps) {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const { data: collectionNames } = useCollectionDisplayNames()

  const [summary, setSummary] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  // UX hardening (FIX-038): treat empty-string english/arabic the same as missing.
  // Many production hadith rows are skeleton rows (text fields empty). The app must
  // not render blank cards or send empty prompts to Groq. This is a UI guard only;
  // the actual content backfill is a separate ops task.
  const hasEnglish = typeof hadith.english_text === 'string' && hadith.english_text.trim().length > 0
  const hasArabic = typeof hadith.arabic_text === 'string' && hadith.arabic_text.trim().length > 0
  const hasAnyText = hasEnglish || hasArabic

  const canSummarize = showSummarize && !compact && hasEnglish

  const handleSummarize = async () => {
    if (!canSummarize) return
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
      // Defensive: if backend returned empty or non-string, surface the friendly fallback
      // rather than rendering "undefined".
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

  const content = (
    <Card variant="elevated" style={styles.card}>
      {/* Header row: grade badge + reference */}
      <View style={styles.header}>
        {hadith.grade ? (
          <GradeBadge grade={hadith.grade} size={compact ? 'small' : 'medium'} />
        ) : (
          <View />
        )}
        <Text style={[styles.reference, { color: colors.mutedText }]}>
          {formatHadithReference(hadith, collectionNames)}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

      {/* Arabic text — right-aligned, generous line height for legibility */}
      {hasArabic ? (
        <Text
          style={[styles.arabicText, { color: colors.bronzeText }]}
          numberOfLines={compact ? 4 : undefined}
          ellipsizeMode="tail"
        >
          {hadith.arabic_text}
        </Text>
      ) : null}

      {/* English translation */}
      {hasEnglish ? (
        <Text
          style={[styles.englishText, { color: colors.bronzeText }]}
          numberOfLines={compact ? 3 : undefined}
          ellipsizeMode="tail"
        >
          {hadith.english_text}
        </Text>
      ) : null}

      {/* Empty-row fallback (FIX-038) — render an honest placeholder rather than
          a blank card when both Arabic and English are missing in the DB. */}
      {!hasAnyText ? (
        <Text style={[styles.englishText, { color: colors.mutedText, fontStyle: 'italic' }]}>
          Hadith text is currently unavailable for this record.
        </Text>
      ) : null}

      {/* Narrator */}
      {hadith.narrator && hadith.narrator.trim().length > 0 ? (
        <Text style={[styles.narrator, { color: colors.mutedText }]}>
          Narrated by {hadith.narrator}
        </Text>
      ) : null}

      {/* Read more hint on compact cards */}
      {compact && onPress && (
        <Text style={[styles.readMore, { color: colors.emeraldMid }]}>Read more →</Text>
      )}

      {/* Optional inline AI Summary (home card parity with hadith detail screen) */}
      {canSummarize && (
        <View style={styles.summaryBlock}>
          <Pressable
            onPress={handleSummarize}
            disabled={isSummarizing}
            style={({ pressed }) => [
              styles.summarizeBtn,
              {
                borderColor: colors.goldMid,
                opacity: pressed || isSummarizing ? 0.75 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Generate AI summary of this hadith"
          >
            {isSummarizing ? (
              <ActivityIndicator size="small" color={colors.goldMid} />
            ) : (
              <Text style={[styles.summarizeBtnText, { color: colors.goldMid }]}>
                {summary || summaryError ? 'Regenerate Summary' : 'AI Summary'}
              </Text>
            )}
          </Pressable>

          {summary ? (
            <View style={[styles.summaryBox, { backgroundColor: colors.emeraldMid + '12', borderLeftColor: colors.emeraldMid }]}>
              <Text style={[styles.summaryLabel, { color: colors.emeraldMid }]}>AI Summary</Text>
              <Text style={[styles.summaryText, { color: colors.bronzeText }]}>{summary}</Text>
              <Text style={[styles.summaryDisclaimer, { color: colors.mutedText }]}>
                AI-generated. Not a religious ruling.
              </Text>
            </View>
          ) : null}

          {summaryError ? (
            <View style={[styles.summaryBox, { backgroundColor: colors.mutedText + '10', borderLeftColor: colors.mutedText }]}>
              <Text style={[styles.summaryText, { color: colors.mutedText }]}>{summaryError}</Text>
            </View>
          ) : null}
        </View>
      )}
    </Card>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    )
  }
  return content
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: SPACING.md,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.995 }],
  },
  card: {
    // Card handles its own marginBottom only when used without Pressable wrapper
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reference: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginBottom: SPACING.md,
    marginHorizontal: -20,  // bleed to card edges (matches card padding = 20px)
  },
  arabicText: {
    fontSize: FONT_SIZES.xl,
    lineHeight: 38,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: SPACING.md,
    // Arabic glyphs render better with slightly elevated font weight
    fontWeight: '400',
  },
  englishText: {
    fontSize: FONT_SIZES.base,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  narrator: {
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
    marginTop: 2,
  },
  readMore: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  summaryBlock: {
    marginTop: SPACING.md,
  },
  summarizeBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  summarizeBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  summaryBox: {
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderRadius: BORDER_RADIUS.md,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
  },
  summaryDisclaimer: {
    fontSize: FONT_SIZES.xs,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
})
