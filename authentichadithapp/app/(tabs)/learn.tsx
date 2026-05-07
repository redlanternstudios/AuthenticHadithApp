import React from 'react';
import { StyleSheet, View, FlatList, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PremiumGate } from '@/components/premium/PremiumGate';
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { LearningPath } from '@/types/hadith';

export default function LearnScreen() {
  const router = useRouter();

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎓 Learning Paths</Text>
        <Text style={styles.subtitle}>
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
                <Text style={styles.pathName}>{item.title}</Text>
                <Text style={styles.difficultyBadge}>{item.level}</Text>
              </View>
              <Text style={styles.pathDescription}>{item.description}</Text>
              <Text style={styles.pathDuration}>
                📅 {item.estimated_hours} hours
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
                      <Text style={styles.pathName}>{item.title} 🔒</Text>
                      <Text style={styles.difficultyBadge}>{item.level}</Text>
                    </View>
                    <Text style={styles.pathDescription}>{item.description}</Text>
                    <Text style={styles.pathDuration}>
                      📅 {item.estimated_hours} hours
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
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.bronzeText,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
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
    color: COLORS.bronzeText,
    flex: 1,
  },
  difficultyBadge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.emeraldMid,
    backgroundColor: COLORS.emeraldHighlight + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  pathDescription: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    marginBottom: SPACING.sm,
  },
  pathDuration: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedText,
  },
});
