import React, { useMemo } from 'react';
import { StyleSheet, View, FlatList, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PremiumGate } from '@/components/premium/PremiumGate';
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { LearningPath } from '@/types/hadith';
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner';
import { useCompletedItems } from '@/hooks/useProgress';

type PathLessonMap = { learning_path_id: string; lesson_id: string };

export default function LearnScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const { data: paths, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['learning-paths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .order('sort_order');

      if (error) {
        if (__DEV__) {
          console.error('[Learn] learning_paths fetch failed:', { // __DEV__
            code: (error as any).code,
            message: error.message,
            details: (error as any).details,
            hint: (error as any).hint,
          });
        }
        throw error;
      }
      return data as LearningPath[];
    },
    retry: 1,
  });

  // Cheap second query for "X / Y lessons" progress. Non-fatal: a failure
  // here must NOT blank the path list — return null and let progress simply
  // hide. Logs are still loud so the issue surfaces.
  const { data: pathLessons } = useQuery({
    queryKey: ['learning-paths-lesson-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('path_lessons')
        .select('learning_path_id, lesson_id');
      if (error) {
        if (__DEV__) {
          console.error('[Learn] path_lessons fetch failed (non-fatal):', { // __DEV__
            code: (error as any).code,
            message: error.message,
            details: (error as any).details,
            hint: (error as any).hint,
          });
        }
        return null;
      }
      return data as PathLessonMap[];
    },
    retry: 1,
  });

  // Subscribes to the local progress store; re-renders when a lesson is
  // marked complete from the lesson detail screen (AC #3).
  const { records: completedLessons } = useCompletedItems('lesson');

  const progressByPath = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    if (!pathLessons) return map;
    const completedIds = new Set(completedLessons.map((r) => r.id));
    for (const pl of pathLessons) {
      const bucket = map[pl.learning_path_id] || { total: 0, done: 0 };
      bucket.total += 1;
      if (completedIds.has(pl.lesson_id)) bucket.done += 1;
      map[pl.learning_path_id] = bucket;
    }
    return map;
  }, [pathLessons, completedLessons]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const freePaths = (paths?.filter(p => !p.is_premium) || []) as LearningPath[];
  const premiumPaths = (paths?.filter(p => p.is_premium) || []) as LearningPath[];

  const renderProgress = (pathId: string) => {
    const p = progressByPath[pathId];
    if (!p || p.total === 0) return null;
    const ratio = p.done / p.total;
    return (
      <View style={styles.progressRow}>
        <View style={[styles.progressTrack, { backgroundColor: colors.marbleBase }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(ratio * 100)}%`, backgroundColor: colors.emeraldMid },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.mutedText }]}>
          {p.done} / {p.total} lessons
        </Text>
      </View>
    );
  };

  // Surface the actual error to the user. The generic "Something went wrong"
  // string was the precise reason FIX-044 missed this bug — KP had no way to
  // see what was failing. Showing the code/message/hint inline makes the
  // next reproduction self-diagnosing.
  const bannerMessage = isError
    ? (() => {
        const e: any = error;
        const parts: string[] = [];
        if (e?.code) parts.push(`[${e.code}]`);
        if (e?.message) parts.push(e.message);
        else if (typeof e === 'string') parts.push(e);
        if (e?.hint) parts.push(`Hint: ${e.hint}`);
        const composed = parts.join(' ').trim();
        return composed.length > 0
          ? `Could not load learning paths. ${composed}`
          : 'Could not load learning paths. Please try again.';
      })()
    : undefined;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isError && <QueryErrorBanner message={bannerMessage} onRetry={refetch} />}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.bronzeText }]}>{'\u{1F393}'} Learning Paths</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Structured curriculum from beginner to scholar
        </Text>
      </View>

      <FlatList
        data={freePaths}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/learn/${item.id}`)}>
            <Card variant="elevated" style={styles.pathCard}>
              <View style={styles.pathHeader}>
                <Text style={[styles.pathName, { color: colors.bronzeText }]}>{item.title}</Text>
                <Text style={[styles.difficultyBadge, { color: colors.emeraldMid, backgroundColor: colors.emeraldHighlight + '20' }]}>{item.level}</Text>
              </View>
              <Text style={[styles.pathDescription, { color: colors.mutedText }]}>{item.description}</Text>
              <Text style={[styles.pathDuration, { color: colors.mutedText }]}>
                {'\u{1F4C5}'} {item.estimated_hours} hours
              </Text>
              {renderProgress(item.id)}
            </Card>
          </Pressable>
        )}
        ListFooterComponent={() => (
          premiumPaths.length > 0 ? (
            <PremiumGate
              feature="Premium Learning Paths"
              description="Unlock advanced and scholar-level paths with premium"
            >
              {premiumPaths.map((item) => (
                <Pressable key={item.id} onPress={() => router.push(`/learn/${item.id}`)}>
                  <Card variant="elevated" style={styles.pathCard}>
                    <View style={styles.pathHeader}>
                      <Text style={[styles.pathName, { color: colors.bronzeText }]}>{item.title} {'\u{1F512}'}</Text>
                      <Text style={[styles.difficultyBadge, { color: colors.emeraldMid, backgroundColor: colors.emeraldHighlight + '20' }]}>{item.level}</Text>
                    </View>
                    <Text style={[styles.pathDescription, { color: colors.mutedText }]}>{item.description}</Text>
                    <Text style={[styles.pathDuration, { color: colors.mutedText }]}>
                      {'\u{1F4C5}'} {item.estimated_hours} hours
                    </Text>
                    {renderProgress(item.id)}
                  </Card>
                </Pressable>
              ))}
            </PremiumGate>
          ) : null
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
  header: {
    padding: SPACING.md,
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.md,
  },
  content: {
    padding: SPACING.md,
  },
  pathCard: {
    marginBottom: SPACING.md,
  },
  pathHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  pathName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    flex: 1,
  },
  difficultyBadge: {
    fontSize: FONT_SIZES.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    overflow: 'hidden',
  },
  pathDescription: {
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.sm,
  },
  pathDuration: {
    fontSize: FONT_SIZES.sm,
  },
  progressRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    fontVariant: ['tabular-nums'],
  },
});
