import { Dimensions, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BREAKPOINTS, LAYOUT } from '@/lib/styles/colors'

const { width: INITIAL_WIDTH } = Dimensions.get('window')

/**
 * Centralised layout hook — use this in every screen instead of
 * hard-coding safe-area padding or rolling your own tablet detection.
 *
 * Returns stable values per render; Dimensions changes (orientation flip)
 * are captured by re-render because `useSafeAreaInsets` triggers it.
 */
export function useDeviceLayout() {
  const insets = useSafeAreaInsets()
  const { width, height } = Dimensions.get('window')

  const isTablet = width >= BREAKPOINTS.tablet
  const isLargePhone = width >= BREAKPOINTS.phoneMax
  const isIOS = Platform.OS === 'ios'

  // Canonical page padding — wider on tablet for breathing room
  const pagePadding = isTablet ? 32 : LAYOUT.pagePadding

  // Top inset for screen content (below status bar / notch)
  // +8 gives a small visual gap beneath the status bar area
  const contentTop = insets.top + (isTablet ? 12 : 8)

  // Bottom inset for scrollable content (above home indicator + tab bar)
  const contentBottom = insets.bottom + 24

  return {
    width,
    height,
    insets,
    isTablet,
    isLargePhone,
    isIOS,
    pagePadding,
    contentTop,
    contentBottom,
    // Convenience: content max-width centred on iPad
    maxContentWidth: isTablet ? LAYOUT.maxContentWidth : undefined,
  }
}
