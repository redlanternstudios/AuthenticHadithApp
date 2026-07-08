import React from 'react';
import { StyleSheet, StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Defs, Path, Pattern, Polygon, Rect } from 'react-native-svg';
import { getColors } from '@/lib/styles/colors';

interface IslamicPatternBackgroundProps {
  children: React.ReactNode;
  isDark: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IslamicPatternBackground({
  children,
  isDark,
  style,
}: IslamicPatternBackgroundProps) {
  const colors = getColors(isDark);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      {isDark ? <IslamicPatternOverlay /> : null}
      {children}
    </View>
  );
}

export function IslamicPatternOverlay() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <Pattern id="diamondGrid" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
            <Path d="M22 0L44 22L22 44L0 22Z" fill="#c5a059" opacity="0.035" />
            <Path d="M22 10L34 22L22 34L10 22Z" fill="#4a9973" opacity="0.045" />
          </Pattern>
        </Defs>
        <Rect width="400" height="900" fill="#0a2a1f" />
        <Rect width="400" height="900" fill="url(#diamondGrid)" />
        <Path d="M0 0L120 64L240 0V120L180 180L120 120L60 180L0 120V0Z" fill="#4a9973" opacity="0.04" />
        <Path d="M400 0L280 64L160 0V120L220 180L280 120L340 180L400 120V0Z" fill="#e8c77d" opacity="0.035" />
        <Polygon
          points="200,150 238,258 352,258 260,326 294,438 200,370 106,438 140,326 48,258 162,258"
          fill="#4a9973"
          opacity="0.018"
        />
        <Path d="M32 160V720" stroke="#e8c77d" strokeWidth="1" opacity="0.08" />
        <Path d="M368 160V720" stroke="#e8c77d" strokeWidth="1" opacity="0.08" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
