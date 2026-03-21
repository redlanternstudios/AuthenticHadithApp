import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Card } from '../ui/Card'
import { GradeBadge } from './GradeBadge'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { Hadith } from '@/types/hadith'

interface HadithCardProps {
  hadith: Hadith
  onPress?: () => void
  compact?: boolean
}

export function HadithCard({ hadith, onPress, compact = false }: HadithCardProps) {
  const { isDark } = useTheme()
  const colors = getColors(isDark)

  const content = (
    <Card variant="elevated" style={styles.card}>
      {/* Header row: grade badge + reference */}
      <View style={styles.header}>
        <GradeBadge grade={hadith.grade} size={compact ? 'small' : 'medium'} />
        <Text style={[styles.reference, { color: colors.mutedText }]}>
          {hadith.collection_slug} {hadith.hadith_number}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

      {/* Arabic text — right-aligned, generous line height for legibility */}
      {hadith.arabic_text ? (
        <Text
          style={[styles.arabicText, { color: colors.bronzeText }]}
          numberOfLines={compact ? 3 : undefined}
        >
          {hadith.arabic_text}
        </Text>
      ) : null}

      {/* English translation */}
      <Text
        style={[styles.englishText, { color: colors.bronzeText }]}
        numberOfLines={compact ? 4 : undefined}
      >
        {hadith.english_text}
      </Text>

      {/* Narrator */}
      {hadith.narrator && (
        <Text style={[styles.narrator, { color: colors.mutedText }]}>
          Narrated by {hadith.narrator}
        </Text>
      )}

      {/* Read more hint on compact cards */}
      {compact && onPress && (
        <Text style={[styles.readMore, { color: colors.emeraldMid }]}>Read more →</Text>
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
    marginHorizontal: -SPACING.md,  // bleed to card edges
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
})
