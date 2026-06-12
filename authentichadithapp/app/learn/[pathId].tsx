import React from 'react';
import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { usePathLessons } from '@/hooks/useLearning';
import { STATIC_LEARNING_PATHS } from '@/lib/learning/staticLearningContent';

export default function LearningPathDetailScreen() {
  const params = useLocalSearchParams<{ pathId: string }>();
  // Expo Router can hand back string | string[]; normalize so queries never fire with junk.
  const pathId = typeof params.pathId === 'string' && params.pathId.length > 0 ? params.pathId : undefined;
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  // V1 LOCK: path title resolved from static content — no Supabase round-trip.
  // Supabase learning_paths rows use UUIDs; static paths use slugs, so a DB
  // lookup would always return null and fall back to 'Lessons' anyway.
  const staticPath = STATIC_LEARNING_PATHS.find(p => p.id === pathId);
  const pathTitle = staticPath?.title ?? 'Lessons';

  // Shared hook — same ordered sequence the lesson screen reads for Prev/Next.
  const { data: lessons, isLoading } = usePathLessons(pathId);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: pathTitle }} />
        <LoadingSpinner />
      </>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Native header owns the title + back affordance; binding pathTitle here
          keeps the route literal "[pathId]" from leaking. No custom in-screen
          header — that was a redundant second back button + title. */}
      <Stack.Screen options={{ title: pathTitle }} />

      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => router.push(`/learn/lesson/${item.id}?pathId=${pathId}`)}>
            <Card variant="elevated" style={styles.lessonCard}>
              <View style={styles.lessonHeader}>
                <Text style={[styles.lessonNumber, { color: colors.emeraldMid }]}>Lesson {index + 1}</Text>
                <Text style={[styles.duration, { color: colors.mutedText }]}>{item.estimated_minutes} min</Text>
              </View>
              <Text style={[styles.lessonTitle, { color: colors.bronzeText }]}>{item.title}</Text>
              <Text style={[styles.lessonDescription, { color: colors.mutedText }]}>{item.description}</Text>
            </Card>
          </Pressable>
        )}
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  lessonCard: {
    marginBottom: SPACING.md,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  lessonNumber: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  duration: {
    fontSize: FONT_SIZES.sm,
  },
  lessonTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  lessonDescription: {
    fontSize: FONT_SIZES.base,
  },
});
