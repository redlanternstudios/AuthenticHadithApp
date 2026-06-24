/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Re-export typography tokens from the canonical source so that components
// can import FONT_SIZES, LINE_HEIGHTS, and FONT_FAMILY from a single path.
export { FONT_SIZES, LINE_HEIGHTS } from '@/lib/styles/colors';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// ─── Font Families ───────────────────────────────────────────────────────────
// Cinzel = ALL text (web: globals.css:105 --font-sans:"Cinzel" — Cinzel is the
//          default font for EVERYTHING on the web, not just headings).
//          KP decision 2026-06-24: match web exactly; Cinzel everywhere.
// Arabic = kept as-is; not Cinzel or Geist
export const FONT_FAMILY = {
  heading: 'Cinzel_700Bold',           // H1, hero titles, screen headers
  headingMedium: 'Cinzel_600SemiBold', // H2, card titles
  headingLight: 'Cinzel_400Regular',   // H3, eyebrows in Cinzel
  body: 'Cinzel_400Regular',           // default body text — web parity (globals.css:105)
  bodyMedium: 'Cinzel_500Medium',      // body emphasis — web parity
  bodySemiBold: 'Cinzel_600SemiBold',  // body strong, labels — web parity
  arabic: undefined,                    // falls back to system serif (Amiri not required for demo)
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
