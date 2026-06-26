import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';

export default function NotFoundScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={styles.emoji}>📖</Text>
        <Text style={[styles.title, { color: colors.bronzeText }]}>Page not found</Text>
        <Text style={[styles.message, { color: colors.mutedText }]}>
          {"The page you're looking for doesn't exist."}
        </Text>
        <Link href="/" style={[styles.link, { backgroundColor: colors.emeraldMid }]}>
          <Text style={[styles.linkText, { color: colors.white }]}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  link: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
  },
  linkText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
});
