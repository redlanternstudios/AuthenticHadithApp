import React from 'react';
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

export default function LearnScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const { data: paths, isLoading } = useQuery({
    queryKey: ['learning-paths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data as LearningPath[];
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const freePaths = (paths?.filter(p => !p.is_premium) || []) as LearningPath[];
  const premiumPaths = (paths?.filter(p => p.is_premium) || []) as LearningPath[];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
});
