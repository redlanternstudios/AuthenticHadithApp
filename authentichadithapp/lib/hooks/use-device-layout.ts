import { Dimensions, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BREAKPOINTS, LAYOUT } from '@/lib/styles/colors'

Dimensions.get('window') // pre-warm the measurement cache for layout hooks below

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

  const globalNavReserve = 64
  const tabBarReserve = 96

  // Top inset for screen content. Signed-in pages have floating Back and Home
  // controls, so every scroll screen needs enough room before its first title.
  const contentTop = insets.top + globalNavReserve

  // Bottom inset for scrollable content above the tab bar and home indicator.
  const contentBottom = insets.bottom + tabBarReserve

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
    globalNavReserve,
    tabBarReserve,
    // Convenience: content max-width centred on iPad
    maxContentWidth: isTablet ? LAYOUT.maxContentWidth : undefined,
  }
}
