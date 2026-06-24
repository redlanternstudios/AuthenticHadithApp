import { StyleSheet, Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { FONT_FAMILY, FONT_SIZES, LINE_HEIGHTS } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  /**
   * default         — Cinzel 400, 16pt body (web parity: globals.css:105 Cinzel everywhere)
   * defaultSemiBold — Cinzel 600, 16pt body strong
   * title           — Cinzel 700, 32pt display (hero headings)
   * heading         — Cinzel 700, 24pt section heading
   * headingMd       — Cinzel 600, 20pt sub-heading
   * subtitle        — Cinzel 500, 20pt body subtitle
   * label           — Cinzel 600, 12pt uppercase label / eyebrow
   * link            — Cinzel 400, 16pt link
   */
  type?: 'default' | 'defaultSemiBold' | 'title' | 'heading' | 'headingMd' | 'subtitle' | 'label' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        styles[type],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
  },
  defaultSemiBold: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
  },
  title: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.display,
    lineHeight: FONT_SIZES.display * LINE_HEIGHTS.tight,
  },
  heading: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xxl,
    lineHeight: FONT_SIZES.xxl * LINE_HEIGHTS.tight,
  },
  headingMd: {
    fontFamily: FONT_FAMILY.headingMedium,
    fontSize: FONT_SIZES.xl,
    lineHeight: FONT_SIZES.xl * LINE_HEIGHTS.tight,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.bodyMedium,
    fontSize: FONT_SIZES.xl,
    lineHeight: FONT_SIZES.xl * LINE_HEIGHTS.normal,
  },
  label: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  link: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.relaxed,
    color: '#0a7ea4',
  },
});
