import React from 'react';
import { StyleSheet, View, Text, SectionList, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { supabase } from '@/lib/supabase/client';

type LessonRow = {
  id: string;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  globalIndex: number;
};
type ModuleSection = { title: string; moduleId: string; data: LessonRow[] };

export default function LearningPathDetailScreen() {
  const params = useLocalSearchParams<{ pathId: string }>();
  // Expo Router can hand back string | string[]; normalize so queries never fire with junk.
  const pathId = typeof params.pathId === 'string' && params.pathId.length > 0 ? params.pathId : undefined;
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  // V2: title + module/lesson tree come from Supabase. Modules are the new layer
  // (learning_modules) that groups the lessons (learning_lessons).
  const { data, isLoading } = useQuery({
    queryKey: ['path-detail', pathId],
    queryFn: async () => {
      if (!pathId) return null;

      const [{ data: path }, { data: modules, error: modErr }] = await Promise.all([
        supabase.from('learning_paths').select('title').eq('id', pathId).single(),
        supabase
          .from('learning_modules')
          .select('id, title, sort_order')
          .eq('path_id', pathId)
          .order('sort_order', { ascending: true }),
      ]);
      if (modErr) {
        __DEV__ && console.error('[PathDetail] modules query failed:', modErr);
        throw modErr;
      }

      const mods = modules ?? [];
      let lessons: { id: string; module_id: string; title: string; description: string | null; estimated_minutes: number | null; sort_order: number | null }[] = [];
      if (mods.length) {
        const { data: rows, error: lesErr } = await supabase
          .from('learning_lessons')
          .select('id, module_id, title, description, estimated_minutes, sort_order')
          .in('module_id', mods.map((m) => m.id))
          .order('sort_order', { ascending: true });
        if (lesErr) {
          __DEV__ && console.error('[PathDetail] lessons query failed:', lesErr);
          throw lesErr;
        }
        lessons = rows ?? [];
      }

      // Build module sections + a running global lesson index that matches the
      // flat Prev/Next sequence on the lesson screen.
      let running = 0;
      const sections: ModuleSection[] = mods.map((m) => {
        const data: LessonRow[] = lessons
          .filter((l) => l.module_id === m.id)
          .map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            estimated_minutes: l.estimated_minutes,
            globalIndex: running++,
          }));
        return { title: m.title, moduleId: m.id, data };
      }).filter((s) => s.data.length > 0);

      return { title: path?.title ?? 'Lessons', sections };
    },
    enabled: !!pathId,
  });

  const pathTitle = data?.title ?? 'Lessons';

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: pathTitle }} />
        <LoadingSpinner />
      </>
    );
  }

  // H-2: Not-found guard — fires when pathId is missing OR when the query resolves
  // to null (invalid pathId, DB error that returned null, or no sections found).
  if (!data || !data.sections || data.sections.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.mutedText }]}>
            Learning path not found.
          </Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Go back to learning paths"
            accessibilityRole="button"
            style={[styles.backButton, { borderColor: colors.emeraldMid }]}
          >
            <Text style={[styles.backButtonText, { color: colors.emeraldMid }]}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: pathTitle }} />

      <SectionList
        sections={data.sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.moduleHeader, { color: colors.emeraldMid, backgroundColor: colors.background }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/learn/lesson/${item.id}?pathId=${pathId}`)}
            accessibilityLabel={`Start lesson ${item.globalIndex + 1}: ${item.title}`}
            accessibilityRole="button"
          >
            <Card variant="elevated" style={styles.lessonCard}>
              <View style={styles.lessonHeader}>
                <Text style={[styles.lessonNumber, { color: colors.emeraldMid }]}>Lesson {item.globalIndex + 1}</Text>
                <Text style={[styles.duration, { color: colors.mutedText }]}>{item.estimated_minutes ?? 0} min</Text>
              </View>
              <Text style={[styles.lessonTitle, { color: colors.bronzeText }]}>{item.title}</Text>
              {item.description?.trim() ? (
                <Text style={[styles.lessonDescription, { color: colors.mutedText }]}>{item.description}</Text>
              ) : null}
            </Card>
          </Pressable>
        )}
        stickySectionHeadersEnabled={false}
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
  moduleHeader: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
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
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  notFoundText: {
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  backButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
});
