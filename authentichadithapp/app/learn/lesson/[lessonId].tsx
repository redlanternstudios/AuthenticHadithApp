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

export default function LessonDetailScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) throw error;
      return data as Lesson;
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!lesson) {
    return null;
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

        <Button
          title="Mark as Complete"
          onPress={() => {
            // TODO: Implement lesson completion
            router.back();
          }}
          variant="primary"
        />
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
});
