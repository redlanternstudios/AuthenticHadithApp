import React, { useMemo } from 'react';
import { StyleSheet, View, FlatList, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PremiumGate } from '@/components/premium/PremiumGate';
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { LearningPath } from '@/types/hadith';
import { useCompletedItems } from '@/hooks/useProgress';
import { supabase } from '@/lib/supabase/client';

type PathLessonMap = { learning_path_id: string; lesson_id: string };

export default function LearnScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();

  // V2: paths come from Supabase `learning_paths` (6 rows), ordered.
  const { data: paths, isLoading } = useQuery({
    queryKey: ['learning-paths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('id, title, description, level, estimated_hours, is_premium, sort_order')
        .order('sort_order', { ascending: true });
      if (error) {
        __DEV__ && console.error('[Learn] learning_paths query failed:', error);
        throw error;
      }
      return (data ?? []) as LearningPath[];
    },
  });

  // V2: path -> lesson map built from Supabase modules -> lessons, so per-path
  // progress counts reflect the real DB content (not the old static map).
  const { data: pathLessons } = useQuery({
    queryKey: ['learning-paths-lesson-map'],
    queryFn: async (): Promise<PathLessonMap[]> => {
      const { data: modules, error: modErr } = await supabase
        .from('learning_modules')
        .select('id, path_id');
      if (modErr) {
        __DEV__ && console.error('[Learn] modules map query failed:', modErr);
        throw modErr;
      }
      if (!modules?.length) return [];
      const pathByModule = new Map<string, string>(modules.map((m) => [m.id, m.path_id]));

      const { data: lessons, error: lesErr } = await supabase
        .from('learning_lessons')
        .select('id, module_id')
        .in('module_id', modules.map((m) => m.id));
      if (lesErr) {
        __DEV__ && console.error('[Learn] lessons map query failed:', lesErr);
        throw lesErr;
      }

      return (lessons ?? [])
        .map((l) => {
          const learning_path_id = pathByModule.get(l.module_id);
          return learning_path_id ? { learning_path_id, lesson_id: l.id } : null;
        })
        .filter((x): x is PathLessonMap => x !== null);
    },
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
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
  },
  title: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.body,
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
    fontFamily: FONT_FAMILY.headingMedium,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    flex: 1,
  },
  difficultyBadge: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    overflow: 'hidden',
  },
  pathDescription: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.sm,
  },
  pathDuration: {
    fontFamily: FONT_FAMILY.body,
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
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.xs,
    fontVariant: ['tabular-nums'],
  },
});
