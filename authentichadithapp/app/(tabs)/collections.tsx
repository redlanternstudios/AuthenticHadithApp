import React from 'react';
import { StyleSheet, View, FlatList, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TopBar } from '@/components/layout/TopBar';
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Collection } from '@/types/hadith';
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner';
import { filterVisibleCollections, VISIBLE_COLLECTION_COUNT } from '@/lib/hadith/visibleCollections';

export default function CollectionsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const { data: collections, isLoading, isError, refetch } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('name_en');

      if (error) throw error;
      return filterVisibleCollections(data as Collection[]);
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* A#6: TopBar — web parity top navigation */}
      <TopBar title="Collections" />
      {isError && <QueryErrorBanner onRetry={refetch} />}
      {/* Subtitle shown below the TopBar */}
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          {VISIBLE_COLLECTION_COUNT} major authentic collections
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
              <Text style={styles.collectionEmoji}>{'\u{1F4D6}'}</Text>
              <Text style={[styles.collectionName, { color: colors.bronzeText }]}>{item.name_en}</Text>
              <Text style={[styles.collectionCount, { color: colors.mutedText }]}>
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
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    color: '#6b5d4d',
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
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  collectionCount: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
});
