import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Card } from '@/components/ui/Card'
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors'

interface StatCardProps {
  icon: string
  value: number | string
  label: string
}

export function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    padding: SPACING.md,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.goldMid + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  icon: {
    fontSize: 20,
  },
  value: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.bronzeText,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedText,
    textAlign: 'center',
    marginTop: 2,
  },
})
