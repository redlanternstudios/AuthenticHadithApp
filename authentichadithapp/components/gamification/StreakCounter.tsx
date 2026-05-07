import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Card } from '@/components/ui/Card'
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors'

interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
}

export function StreakCounter({ currentStreak, longestStreak }: StreakCounterProps) {
  const isOnFire = currentStreak >= 3

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.streakSection}>
          <Text style={[styles.flame, isOnFire && styles.flameActive]}>
            {isOnFire ? '🔥' : '🕯️'}
          </Text>
          <View>
            <Text style={[styles.count, isOnFire && styles.countActive]}>
              {currentStreak}
            </Text>
            <Text style={styles.label}>Day Streak</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.bestSection}>
          <Text style={styles.bestCount}>{longestStreak}</Text>
          <Text style={styles.label}>Best Streak</Text>
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  flame: {
    fontSize: 32,
  },
  flameActive: {
    fontSize: 36,
  },
  count: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.bronzeText,
  },
  countActive: {
    color: '#E87040',
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedText,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  bestSection: {
    alignItems: 'center',
  },
  bestCount: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.goldMid,
  },
})
