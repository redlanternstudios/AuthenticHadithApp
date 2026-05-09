import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { Lesson } from '@/types/hadith';
import { useCompletionStatus } from '@/hooks/useProgress';
import { useAuth } from '@/lib/auth/AuthProvider';
import { trackActivity } from '@/lib/gamification/track-activity';
import { View as RNView, Text as RNText } from 'react-native';

export default function LessonDetailScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const { user } = useAuth();
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
        return null;
      }
      return data as Lesson | null;
    },
    enabled: !!lessonId,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!lesson) {
    // Intentional empty state — replaces silent `return null` (Rule 005).
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundEmoji}>🔍</Text>
        <Text style={styles.notFoundTitle}>Lesson not found</Text>
        <Text style={styles.notFoundText}>
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Button
          title="← Back"
          onPress={() => router.back()}
          variant="ghost"
        />

        <Card style={styles.lessonCard}>
          <Text style={styles.title}>{lesson.title}</Text>
          <Text style={styles.duration}>⏱️ {lesson.estimated_minutes} minutes</Text>
          <Text style={styles.description}>{lesson.description}</Text>
          
          {lesson.content && (
            <View style={styles.contentSection}>
              <Text style={styles.contentText}>{lesson.content}</Text>
            </View>
          )}
        </Card>

        {completion.isComplete ? (
          <RNView style={styles.completedBadge}>
            <RNText style={styles.completedText}>✅ Lesson Completed</RNText>
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
    backgroundColor: COLORS.background,
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
    color: COLORS.bronzeText,
    marginBottom: SPACING.sm,
  },
  duration: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedText,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.base,
    color: COLORS.bronzeText,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  contentSection: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.marbleBase,
    borderRadius: 8,
  },
  contentText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.bronzeText,
    lineHeight: 24,
  },
  completedBadge: {
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: 12,
    backgroundColor: COLORS.emeraldMid + '15',
    borderWidth: 1,
    borderColor: COLORS.emeraldMid + '30',
  },
  completedText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.emeraldMid,
    fontWeight: '600',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
    backgroundColor: COLORS.background,
  },
  notFoundEmoji: { fontSize: 48 },
  notFoundTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.bronzeText,
  },
  notFoundText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
});
