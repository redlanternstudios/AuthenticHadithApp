import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Card } from '@/components/ui/Card'
import { SPACING, FONT_SIZES, getColors } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { FONT_FAMILY } from '@/constants/theme'

interface StatCardProps {
  icon: string
  value: number | string
  label: string
}

function makeStyles(colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    card: {
      alignItems: 'center',
      padding: SPACING.md,
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.goldMid + '20',
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
      fontFamily: FONT_FAMILY.heading,
      color: colors.bronzeText,
    },
    label: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONT_FAMILY.body,
      color: colors.mutedText,
      textAlign: 'center',
      marginTop: 2,
    },
  })
}

export function StatCard({ icon, value, label }: StatCardProps) {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const styles = makeStyles(colors)

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
