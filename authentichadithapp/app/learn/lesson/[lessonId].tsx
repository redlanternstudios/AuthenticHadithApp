import React from 'react';
import { StyleSheet, View, Text, ScrollView , View as RNView, Text as RNText } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Lesson } from '@/types/hadith';
import { useCompletionStatus } from '@/hooks/useProgress';
import { useAuth } from '@/lib/auth/AuthProvider';
import { trackActivity } from '@/lib/gamification/track-activity';
import { getStaticLesson } from '@/lib/learning/staticLearningContent';

export default function LessonDetailScreen() {
  const params = useLocalSearchParams<{ lessonId: string }>();
  // Normalize string | string[] so the query guard and progress hook never see junk.
  const lessonId = typeof params.lessonId === 'string' && params.lessonId.length > 0 ? params.lessonId : undefined;
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const completion = useCompletionStatus('lesson', lessonId ?? null);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      // maybeSingle() — a stale lessonId in a deep-link must NOT throw
      // PGRST116 (Rule 028). We surface a clear empty state instead.
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .maybeSingle();

      if (error) {
        __DEV__ && console.warn('[Lesson] lookup failed (non-fatal):', error.message);
        return getStaticLesson(lessonId);
      }
      return (data || getStaticLesson(lessonId)) as Lesson | null;
    },
    enabled: !!lessonId,
  });

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Lesson' }} />
        <LoadingSpinner />
      </>
    );
  }

  if (!lesson) {
    // Intentional empty state — replaces silent `return null` (Rule 005).
    return (
      <View style={[styles.notFoundContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Lesson' }} />
        <Text style={styles.notFoundEmoji}>🔍</Text>
        <Text style={[styles.notFoundTitle, { color: colors.bronzeText }]}>Lesson not found</Text>
        <Text style={[styles.notFoundText, { color: colors.mutedText }]}>
          This lesson is no longer available. It may have been moved or removed.
        </Text>
        <Button
          title="Back to Lessons"
          onPress={() => router.back()}
          variant="primary"
        />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Native header owns title + back; binding lesson.title keeps the route
          literal "[lessonId]" from leaking. No redundant in-content back button. */}
      <Stack.Screen options={{ title: lesson.title }} />
      <View style={styles.content}>
        <Card style={styles.lessonCard}>
          <Text style={[styles.title, { color: colors.bronzeText }]}>{lesson.title}</Text>
          <Text style={[styles.duration, { color: colors.mutedText }]}>⏱️ {lesson.estimated_minutes} minutes</Text>
          <Text style={[styles.description, { color: colors.bronzeText }]}>{lesson.description}</Text>

          {lesson.content && (
            <View style={[styles.contentSection, { backgroundColor: colors.marbleBase }]}>
              <Text style={[styles.contentText, { color: colors.bronzeText }]}>{lesson.content}</Text>
            </View>
          )}
        </Card>

        {completion.isComplete ? (
          <RNView style={[styles.completedBadge, { backgroundColor: colors.emeraldMid + '15', borderColor: colors.emeraldMid + '30' }]}>
            <RNText style={[styles.completedText, { color: colors.emeraldMid }]}>✅ Lesson Completed</RNText>
          </RNView>
        ) : (
          <Button
            title={completion.isMarking ? 'Marking…' : 'Mark as Complete'}
            isLoading={completion.isMarking}
            onPress={async () => {
              await completion.markComplete({
                title: lesson.title,
                lessonId: lesson.id,
              });
              if (user) {
                try {
                  await trackActivity(user.id, 'complete_lesson');
                } catch (err) {
                  __DEV__ && console.warn('[Lesson] trackActivity failed (non-fatal):', err);
                }
              }
              // Brief delay so the "Completed" state is visible before nav.
              setTimeout(() => router.back(), 600);
            }}
            variant="primary"
          />
        )}
      </View>
    </ScrollView>
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
    marginVertical: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  duration: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.base,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  contentSection: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 8,
  },
  contentText: {
    fontSize: FONT_SIZES.base,
    lineHeight: 24,
  },
  completedBadge: {
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  completedText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  notFoundEmoji: { fontSize: 48 },
  notFoundTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  notFoundText: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
});
