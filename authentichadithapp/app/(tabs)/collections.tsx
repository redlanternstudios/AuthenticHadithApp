import React from 'react';
import { StyleSheet, View, FlatList, Text, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TopBar } from '@/components/layout/TopBar';
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors';
import { FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Collection } from '@/types/hadith';
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner';
import { filterVisibleCollections, VISIBLE_COLLECTION_COUNT } from '@/lib/hadith/visibleCollections';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Per-collection visual identity — each of the two Sahihayn gets a unique look.
// Kept in sync with HIDDEN_COLLECTION_SLUGS: only Bukhari and Muslim are visible.
const COLLECTION_IDENTITY: Record<string, { initial: string; accentColor: string; label: string }> = {
  'sahih-al-bukhari': { initial: 'B', accentColor: '#1b5e43', label: 'Sahih al-Bukhari' },
  'sahih-muslim':     { initial: 'M', accentColor: '#8B6914', label: 'Sahih Muslim' },
};

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

  // Compute item size for equal-height squares.
  // 2 columns with SPACING.sm (8px) margin on each side of each item + container padding.
  const COLUMN_MARGIN = SPACING.sm * 2; // left + right margin per item
  const CONTAINER_PADDING = SPACING.sm * 2; // left + right grid padding
  const ITEM_SIZE = (SCREEN_WIDTH - CONTAINER_PADDING - COLUMN_MARGIN * 2) / 2;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Collections" />
      {isError && <QueryErrorBanner onRetry={refetch} />}
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          {VISIBLE_COLLECTION_COUNT} major authentic collections
        </Text>
      </View>

      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => {
          const identity = COLLECTION_IDENTITY[item.slug ?? ''] ?? {
            initial: (item.name_en ?? '?').charAt(0).toUpperCase(),
            accentColor: colors.emeraldMid,
            label: item.name_en,
          };
          const accent = identity.accentColor;

          return (
            <Pressable
              style={({ pressed }) => [
                styles.collectionItem,
                {
                  width: ITEM_SIZE,
                  height: ITEM_SIZE,
                  backgroundColor: colors.card,
                  borderColor: pressed ? accent : colors.border,
                  borderLeftColor: accent,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={() => router.push(`/collection/${item.slug}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.name_en} collection`}
            >
              {/* Unique avatar */}
              <View style={[styles.avatar, { backgroundColor: accent + '22' }]}>
                <Text style={[styles.avatarText, { color: accent }]}>{identity.initial}</Text>
              </View>

              <Text
                style={[styles.collectionName, { color: colors.bronzeText }]}
                numberOfLines={2}
              >
                {item.name_en}
              </Text>

              <Text style={[styles.collectionCount, { color: colors.mutedText }]}>
                {item.total_hadiths != null
                  ? `${item.total_hadiths.toLocaleString()} hadiths`
                  : 'hadiths'}
              </Text>
            </Pressable>
          );
        }}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
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
  },
  grid: {
    padding: SPACING.sm,
  },
  row: {
    justifyContent: 'space-between',
  },
  collectionItem: {
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: SPACING.md,
    margin: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: FONT_FAMILY.heading,
  },
  collectionName: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  collectionCount: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
});
