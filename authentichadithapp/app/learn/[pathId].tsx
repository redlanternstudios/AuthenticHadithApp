import React from 'react';
import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Lesson } from '@/types/hadith';
import { getStaticLessonsForPath } from '@/lib/learning/staticLearningContent';

export default function LearningPathDetailScreen() {
  const { pathId } = useLocalSearchParams<{ pathId: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['path-lessons', pathId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          path_lessons!inner(learning_path_id)
        `)
        .eq('path_lessons.learning_path_id', pathId)
        .order('order_index');

      if (error) {
        if (__DEV__) {
          console.error('[Learn:pathId] lessons embed fetch failed:', { // __DEV__
            pathId,
            code: (error as any).code,
            message: error.message,
            details: (error as any).details,
            hint: (error as any).hint,
          });
        }
        return getStaticLessonsForPath(pathId);
      }
      return (data?.length ? data : getStaticLessonsForPath(pathId)) as Lesson[];
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Button
          title="← Back"
          onPress={() => router.back()}
          variant="ghost"
        />
        <Text style={[styles.title, { color: colors.bronzeText }]}>Lessons</Text>
      </View>

      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => router.push(`/learn/lesson/${item.id}`)}>
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
  header: {
    padding: SPACING.md,
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginTop: SPACING.sm,
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
