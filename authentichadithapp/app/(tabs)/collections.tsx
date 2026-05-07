import React from 'react';
import { StyleSheet, View, FlatList, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { Collection } from '@/types/hadith';

export default function CollectionsScreen() {
  const router = useRouter();

  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('name_en');

      if (error) throw error;
      return data as Collection[];
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📚 Hadith Collections</Text>
        <Text style={styles.subtitle}>
          Browse hadiths from 8 major authentic collections
        </Text>
      </View>

      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <Pressable
            style={styles.collectionItem}
            onPress={() => router.push(`/collection/${item.slug}`)}
          >
            <Card variant="elevated">
              <Text style={styles.collectionEmoji}>📖</Text>
              <Text style={styles.collectionName}>{item.name_en}</Text>
              <Text style={styles.collectionCount}>
                {item.total_hadiths} hadiths
              </Text>
            </Card>
          </Pressable>
        )}
        contentContainerStyle={styles.grid}
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
  },
  grid: {
    padding: SPACING.sm,
  },
  collectionItem: {
    flex: 1,
    margin: SPACING.sm,
    minWidth: 150,
  },
  collectionEmoji: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  collectionName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.bronzeText,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  collectionCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedText,
    textAlign: 'center',
  },
});
