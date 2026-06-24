export const LIGHT_COLORS = {
  // Islamic emerald green shades
  emeraldShadow: '#0a2a1f',
  emeraldMid: '#1b5e43',
  emeraldHighlight: '#2d7a5b',

  // Gold accents
  goldShadow: '#8a6e3a',
  goldMid: '#c5a059',
  goldHighlight: '#e8c77d',

  // Marble base colors
  marbleBase: '#f8f6f2',

  // Text colors
  bronzeText: '#2c2416',
  mutedText: '#6b5d4d',

  // Hadith grades
  sahih: '#1b5e43',
  hasan: '#c5a059',
  daif: '#b91c1c',

  // UI colors
  background: '#f8f6f2',
  card: '#fffefb',
  cardElevated: '#ffffff',
  border: '#d4cfc7',
  borderSubtle: '#ebe7e0',
  white: '#ffffff',
  black: '#000000',

  // Status colors
  success: '#1b5e43',
  warning: '#c5a059',
  error: '#b91c1c',
  info: '#2d7a5b',

  // Destructive (irreversible actions — delete account, etc.)
  destructive: '#dc2626',
  destructiveText: '#ffffff',

  // Chat colors
  chatUserBubble: '#c5a059',
  chatAiBubble: '#1b5e43',

  // Tab bar
  tabBar: '#fffefb',
  tabBarBorder: '#d4cfc7',
  tabBarInactive: '#a39d94',
} as const

export const DARK_COLORS = {
  // Islamic emerald green shades (slightly brighter for dark mode)
  emeraldShadow: '#2d7a5b',
  emeraldMid: '#3a9270',
  emeraldHighlight: '#4caf84',

  // Gold accents (slightly brighter for dark mode)
  goldShadow: '#c5a059',
  goldMid: '#d4b76e',
  goldHighlight: '#e8c77d',

  // Dark marble base
  marbleBase: '#1a1a1a',

  // Text colors for dark mode
  bronzeText: '#e8e6e3',
  mutedText: '#a39d94',

  // Hadith grades (adjusted for dark mode)
  sahih: '#3a9270',
  hasan: '#d4b76e',
  daif: '#ef4444',

  // UI colors for dark mode
  background: '#0f0f0f',
  card: '#1c1c1e',
  cardElevated: '#242424',
  border: '#2c2c2e',
  borderSubtle: '#242424',
  white: '#ffffff',
  black: '#000000',

  // Status colors (adjusted for dark mode)
  success: '#3a9270',
  warning: '#d4b76e',
  error: '#ef4444',
  info: '#4caf84',

  // Destructive (irreversible actions — brighter red for dark backgrounds)
  destructive: '#ef4444',
  destructiveText: '#ffffff',

  // Chat colors
  chatUserBubble: '#D4A574',
  chatAiBubble: '#50C878',

  // Tab bar
  tabBar: '#1c1c1e',
  tabBarBorder: '#2c2c2e',
  tabBarInactive: '#636366',
} as const

// Default to light colors for backward compatibility
export const COLORS = LIGHT_COLORS

/**
 * Get colors based on theme mode
 */
export function getColors(isDark: boolean) {
  return isDark ? DARK_COLORS : LIGHT_COLORS
}

// ─── Spacing ─────────────────────────────────────────────────────────────────
// 4-point grid. Use multiples of 4 for pixel-perfect alignment on all screens.
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 28, // canonical vertical section gap
} as const

// ─── Typography ──────────────────────────────────────────────────────────────
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 32,
} as const

export const LINE_HEIGHTS = {
  tight: 1.2,   // headings
  normal: 1.5,  // body text
  relaxed: 1.7, // Arabic / long-form content
} as const

// ─── Border Radius ───────────────────────────────────────────────────────────
// Aligned with iOS Human Interface Guidelines for a premium native feel.
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 14,    // buttons, inputs, small cards
  xl: 20,    // primary cards — premium iOS standard
  xxl: 28,   // large hero cards / sheet corners
  full: 9999,
} as const

// ─── Shadows ─────────────────────────────────────────────────────────────────
// Warm-toned shadows match the bronze/marble brand palette.
// Keep opacity low — premium UI uses restraint.
export const SHADOWS = {
  none: {},
  subtle: {
    shadowColor: '#2c2416',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#2c2416',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
  },
  cardDark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  lifted: {
    shadowColor: '#2c2416',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
} as const

// ─── Layout ──────────────────────────────────────────────────────────────────
export const LAYOUT = {
  // Max content width keeps iPad readable — never stretched edge-to-edge
  maxContentWidth: 680,
  // Horizontal page gutter
  pagePadding: 20,
  // Standard touch target (Apple HIG minimum = 44pt)
  touchTarget: 48,
  // Standard button heights
  buttonHeightSm: 36,
  buttonHeightMd: 48,
  buttonHeightLg: 56,
  // Standard input height
  inputHeight: 52,
  // Tab bar icon size
  tabIconSize: 26,
  tabLabelSize: 11,
} as const

// ─── Breakpoints ─────────────────────────────────────────────────────────────
export const BREAKPOINTS = {
  phone: 0,
  phoneLarge: 390,  // iPhone 14 Pro / 15 Pro
  phoneMax: 430,    // iPhone Pro Max
  tablet: 768,      // iPad mini and up
  tabletLarge: 1024,
} as const
