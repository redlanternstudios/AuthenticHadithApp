/**
 * TopBar — shared top navigation bar
 *
 * Web parity: mobile-top-bar.tsx:89-131
 * - Sticky/fixed top bar
 * - Back chevron (hidden on root/tab screens, visible when navigating deep)
 * - Centered screen title in Cinzel
 * - Gold home icon button (right side)
 * - Card background + bottom border (matching web's card surface bar)
 *
 * Usage:
 *   <TopBar title="Collections" showBack />
 *   <TopBar title="Home" />   ← no back, no home btn on root
 */

import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors'
import { FONT_FAMILY } from '@/constants/theme'
import { useTheme } from '@/lib/theme/ThemeProvider'

interface TopBarProps {
  /** Screen title — displayed centered. */
  title: string
  /**
   * Show a back chevron on the left. Set true for non-root screens.
   * Tab root screens (Home, Search, etc.) should leave this false.
   */
  showBack?: boolean
  /**
   * Show the gold home icon on the right. Auto-hidden when showBack is false
   * (i.e. we are already at home-level). Pass `forceHomeBtn` to override.
   */
  showHomeBtn?: boolean
}

export function TopBar({ title, showBack = false, showHomeBtn }: TopBarProps) {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const router = useRouter()

  // Default: show home button only on non-root screens (mirrors web bar behaviour)
  const displayHomeBtn = showHomeBtn !== undefined ? showHomeBtn : showBack

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.inner}>
        {/* Left — back chevron or spacer */}
        <View style={styles.side}>
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.goldMid} />
            </Pressable>
          ) : null}
        </View>

        {/* Center — title */}
        <Text
          style={[styles.title, { color: colors.bronzeText }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {title}
        </Text>

        {/* Right — gold home icon */}
        <View style={[styles.side, styles.sideRight]}>
          {displayHomeBtn ? (
            <Pressable
              onPress={() => router.push('/(tabs)')}
              hitSlop={8}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Go to Home"
            >
              <Ionicons name="home" size={20} color={colors.goldMid} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    // Subtle elevation to lift bar off content (mirrors web sticky bar shadow)
    shadowColor: '#2c2416',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: SPACING.md,
  },
  // Each side panel is a fixed width so the center title stays truly centered
  side: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontFamily: FONT_FAMILY.headingMedium, // Cinzel 600 — matches web bar typography
    fontSize: FONT_SIZES.md,               // 16pt — readable but not oversized
    textAlign: 'center',
    letterSpacing: 0.3,
  },
})
