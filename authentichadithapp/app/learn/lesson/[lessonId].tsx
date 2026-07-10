import React from 'react';
import { StyleSheet, View, Text, ScrollView , View as RNView, Text as RNText } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Markdown from 'react-native-markdown-display';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LessonQuiz } from '@/components/learn/LessonQuiz';
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Lesson } from '@/types/hadith';
import { useCompletionStatus } from '@/hooks/useProgress';
import { usePathLessons, getLessonNeighbors } from '@/hooks/useLearning';
import { useAuth } from '@/lib/auth/AuthProvider';
import { trackActivity } from '@/lib/gamification/track-activity';
import { supabase } from '@/lib/supabase/client';
import { scheduleLessonReminder, getLessonReminderEnabled } from '@/lib/notifications';
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner';

export default function LessonDetailScreen() {
  const params = useLocalSearchParams<{ lessonId: string; pathId?: string }>();
  // Normalize string | string[] so the query guard and progress hook never see junk.
  const lessonId = typeof params.lessonId === 'string' && params.lessonId.length > 0 ? params.lessonId : undefined;
  // pathId arrives as a query param from the path screen; it gives this lesson
  // its sequence context for Prev/Next. Absent on a bare deep-link — handled.
  const pathId = typeof params.pathId === 'string' && params.pathId.length > 0 ? params.pathId : undefined;
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const completion = useCompletionStatus('lesson', lessonId ?? null);

  // Shared ordered sequence (reuses the path screen's cached query). Neighbors
  // resolve to all-null when there's no path context, so nav degrades cleanly.
  const { data: pathLessons } = usePathLessons(pathId);
  const neighbors = getLessonNeighbors(pathLessons, lessonId);
  const goToLesson = (id: string) => router.replace(`/learn/lesson/${id}?pathId=${pathId}`);

  // V2: lesson content from Supabase `learning_lessons`.
  const { data: lesson, isLoading, isError, refetch } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async (): Promise<Lesson | null> => {
      if (!lessonId) return null;
      const { data, error } = await supabase
        .from('learning_lessons')
        .select('id, title, description, content_markdown, estimated_minutes, sort_order, has_quiz')
        .eq('id', lessonId)
        .single();
      if (error) {
        __DEV__ && console.error('[Lesson] query failed:', error);
        throw error;
      }
      if (!data) return null;
      return {
        id: data.id,
        title: data.title,
        description: data.description ?? '',
        content: data.content_markdown ?? undefined,
        order_index: data.sort_order ?? 0,
        estimated_minutes: data.estimated_minutes ?? 0,
        created_at: '',
        has_quiz: data.has_quiz ?? false,
      };
    },
    enabled: !!lessonId,
  });

  // Premium fallback for lessons whose description/content arrive null or blank
  // from the DB — the card must never render bare (Rule 028 / no soft-empty UI).
  const LESSON_PLACEHOLDER =
    'Detailed notes for this lesson are being prepared. Keep moving through the path — your progress is still saved.';

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Lesson' }} />
        <LoadingSpinner />
      </>
    );
  }

  if (isError) {
    return (
      <View style={[styles.notFoundContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Lesson' }} />
        <QueryErrorBanner onRetry={refetch} />
      </View>
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
          {neighbors.index !== -1 && (
            <Text style={[styles.position, { color: colors.emeraldMid }]}>
              Lesson {neighbors.index + 1} of {neighbors.total}
            </Text>
          )}
          <Text style={[styles.title, { color: colors.bronzeText }]}>{lesson.title}</Text>
          <Text style={[styles.duration, { color: colors.mutedText }]}>⏱️ {lesson.estimated_minutes} minutes</Text>
          {lesson.description?.trim() ? (
            <Text style={[styles.description, { color: colors.bronzeText }]}>{lesson.description}</Text>
          ) : null}

          {lesson.content?.trim() ? (
            <View
              style={[
                styles.contentSection,
                {
                  backgroundColor: isDark ? colors.cardElevated : colors.marbleBase,
                  borderColor: isDark ? colors.emeraldHighlight + '55' : colors.borderSubtle,
                },
              ]}
            >
              <Markdown style={createMarkdownStyles(colors, isDark)}>{lesson.content}</Markdown>
            </View>
          ) : !lesson.description?.trim() ? (
            // Neither description nor content present — render a single premium
            // placeholder so the card never looks empty/broken.
            <View
              style={[
                styles.contentSection,
                {
                  backgroundColor: isDark ? colors.cardElevated : colors.marbleBase,
                  borderColor: isDark ? colors.emeraldHighlight + '55' : colors.borderSubtle,
                },
              ]}
            >
              <Text style={[styles.contentText, { color: colors.mutedText }]}>{LESSON_PLACEHOLDER}</Text>
            </View>
          ) : null}
        </Card>

        {/* In-lesson quiz (v2) — only when the lesson has questions. */}
        {lesson.has_quiz ? (
          <LessonQuiz
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            lessonContent={`${lesson.description ?? ''}\n${lesson.content ?? ''}`}
          />
        ) : null}

        {completion.isComplete ? (
          <RNView style={[styles.completedBadge, { backgroundColor: colors.emeraldMid + '15', borderColor: colors.emeraldMid + '30' }]}>
            <RNText style={[styles.completedText, { color: colors.emeraldMid }]}>✅ Lesson Completed</RNText>
          </RNView>
        ) : (
          <Button
            title={
              completion.isMarking
                ? 'Marking…'
                : neighbors.next
                  ? 'Complete & Continue →'
                  : neighbors.isLast
                    ? 'Complete & Finish Path'
                    : 'Mark as Complete'
            }
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
              // FIX-137: Wire lesson reminder. scheduleLessonReminder() schedules
              // a one-time notification 24h from now as a nudge to continue learning.
              // Only fires when the user has enabled lesson reminders in Settings.
              // Non-fatal: notification failure never blocks lesson completion flow.
              try {
                const lessonReminderEnabled = await getLessonReminderEnabled();
                if (lessonReminderEnabled) {
                  await scheduleLessonReminder(lesson.title);
                }
              } catch (err) {
                __DEV__ && console.warn('[Lesson] scheduleLessonReminder failed (non-fatal):', err);
              }
              // Decision: completing advances. Brief delay so the optimistic
              // "Completed" state is visible, then continue to the next lesson —
              // or, on the last lesson, return to the path overview.
              setTimeout(() => {
                if (neighbors.next) goToLesson(neighbors.next.id);
                else router.back();
              }, 600);
            }}
            variant="primary"
          />
        )}

        {/* Free-navigation Prev/Next pair — only when this lesson sits in a known
            path sequence. Each control disables at the ends of the path. */}
        {neighbors.index !== -1 && neighbors.total > 1 && (
          <View style={styles.navBar}>
            <Button
              title="← Previous"
              variant="outline"
              disabled={!neighbors.prev}
              onPress={() => neighbors.prev && goToLesson(neighbors.prev.id)}
              style={styles.navButton}
            />
            <Button
              title="Next →"
              variant="outline"
              disabled={!neighbors.next}
              onPress={() => neighbors.next && goToLesson(neighbors.next.id)}
              style={styles.navButton}
            />
          </View>
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
  position: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  title: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  duration: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.md,
  },
  description: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  contentSection: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  contentText: {
    fontFamily: FONT_FAMILY.body,
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
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  navBar: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  navButton: {
    flex: 1,
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
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  notFoundText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
});

function createMarkdownStyles(colors: ReturnType<typeof getColors>, isDark: boolean) {
  const bodyColor = isDark ? colors.marbleBase : colors.bronzeText;
  const mutedColor = isDark ? colors.mutedText : colors.mutedText;
  const headingColor = isDark ? colors.goldHighlight : colors.emeraldShadow;

  return {
    body: {
      color: bodyColor,
      fontFamily: FONT_FAMILY.body,
      fontSize: FONT_SIZES.base,
      lineHeight: 24,
    },
    heading1: {
      color: headingColor,
      fontFamily: FONT_FAMILY.heading,
      fontSize: FONT_SIZES.xl,
      lineHeight: 28,
      marginTop: 0,
      marginBottom: SPACING.sm,
    },
    heading2: {
      color: headingColor,
      fontFamily: FONT_FAMILY.heading,
      fontSize: FONT_SIZES.lg,
      lineHeight: 26,
      marginTop: SPACING.md,
      marginBottom: SPACING.xs,
    },
    heading3: {
      color: headingColor,
      fontFamily: FONT_FAMILY.heading,
      fontSize: FONT_SIZES.md,
      lineHeight: 24,
      marginTop: SPACING.md,
      marginBottom: SPACING.xs,
    },
    paragraph: {
      color: bodyColor,
      marginTop: SPACING.xs,
      marginBottom: SPACING.md,
    },
    strong: {
      color: headingColor,
      fontWeight: '700' as const,
    },
    bullet_list: {
      marginBottom: SPACING.md,
    },
    ordered_list: {
      marginBottom: SPACING.md,
    },
    list_item: {
      color: bodyColor,
      marginBottom: SPACING.xs,
    },
    fence: {
      backgroundColor: isDark ? colors.emeraldShadow : colors.card,
      color: bodyColor,
      borderColor: isDark ? colors.emeraldHighlight : colors.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 8,
      padding: SPACING.sm,
    },
    code_inline: {
      backgroundColor: isDark ? colors.emeraldShadow : colors.card,
      color: bodyColor,
      borderRadius: 4,
      paddingHorizontal: SPACING.xs,
    },
    blockquote: {
      backgroundColor: 'transparent',
      borderLeftColor: colors.goldMid,
      borderLeftWidth: 3,
      paddingLeft: SPACING.sm,
      color: mutedColor,
    },
  };
}
