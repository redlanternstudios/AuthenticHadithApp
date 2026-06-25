import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getColors, SPACING, FONT_SIZES } from '../../lib/styles/colors'
import { useTheme } from '../../lib/theme/ThemeProvider'
import { FONT_FAMILY } from '../../constants/theme'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  /** Show an iOS-style back chevron that pops the stack. */
  showBack?: boolean
  /** Optional trailing element (e.g. an action button) pinned to the right. */
  right?: React.ReactNode
}

/**
 * Canonical screen header for screens that render their own chrome (no native
 * Stack header). Single source of truth for the status-bar / Dynamic Island
 * safe-area inset + theme-aware title styling, replacing the duplicated manual
 * headers across tab and detail screens. Mirrors the Home/Collections/More
 * title treatment so every custom-header screen reads identically.
 */
export function ScreenHeader({ title, subtitle, showBack = false, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const router = useRouter()

  return (
    <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
      {showBack && (
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={colors.emeraldMid} />
        </Pressable>
      )}
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.bronzeText }]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    // 44pt Apple-minimum tap target; negative margin keeps the glyph optically
    // aligned to the screen edge without shrinking the touch zone.
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginLeft: -SPACING.xs,
    marginBottom: SPACING.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
  },
  right: {
    marginLeft: SPACING.sm,
  },
})
