import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from '@/lib/styles/colors';

interface Collection {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string;
  description_ar: string;
  total_hadiths: number;
  total_books: number;
  scholar: string;
  scholar_dates: string;
  is_featured: boolean;
  grade_distribution: Record<string, number> | null;
}

interface Book {
  id: string;
  collection_id: string;
  number: number;
  name_en: string;
  name_ar: string;
  total_hadiths: number;
  total_chapters: number;
  sort_order: number;
}

const GRADE_COLORS: Record<string, string> = {
  sahih: COLORS.sahih,
  hasan: COLORS.hasan,
  daif: COLORS.daif,
};

function GradeBar({ distribution }: { distribution: Record<string, number> }) {
  const total = Object.values(distribution).reduce((sum, v) => sum + v, 0);
  if (total === 0) return null;

  const segments = Object.entries(distribution)
    .filter(([, count]) => count > 0)
    .map(([grade, count]) => ({
      grade,
      count,
      percent: (count / total) * 100,
      color: GRADE_COLORS[grade] || COLORS.mutedText,
    }));

  return (
    <View style={gradeStyles.container}>
      <View style={gradeStyles.bar}>
        {segments.map((seg) => (
          <View
            key={seg.grade}
            style={[
              gradeStyles.segment,
              { width: `${seg.percent}%` as any, backgroundColor: seg.color },
            ]}
          />
        ))}
      </View>
      <View style={gradeStyles.legend}>
        {segments.map((seg) => (
          <View key={seg.grade} style={gradeStyles.legendItem}>
            <View
              style={[gradeStyles.legendDot, { backgroundColor: seg.color }]}
            />
            <Text style={gradeStyles.legendText}>
              {seg.grade.charAt(0).toUpperCase() + seg.grade.slice(1)}{' '}
              {seg.count.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function CollectionDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  // Fetch collection metadata
  const {
    data: collection,
    isLoading: collectionLoading,
    error: collectionError,
  } = useQuery({
    queryKey: ['collection-detail', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as Collection;
    },
    enabled: !!slug,
  });

  // Fetch books for this collection
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ['collection-books', collection?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('collection_id', collection!.id)
        .order('sort_order')
        .order('number');

      if (error) throw error;
      return data as Book[];
    },
    enabled: !!collection?.id,
  });

  if (collectionLoading || booksLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Collection', headerShown: true }} />
        <LoadingSpinner />
      </>
    );
  }

  if (collectionError || !collection) {
    return (
      <>
        <Stack.Screen options={{ title: 'Collection', headerShown: true }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Collection not found.</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const renderBookCard = ({ item }: { item: Book }) => (
    <Pressable onPress={() => router.push(`/book/${item.id}`)}>
      <Card style={styles.bookCard}>
        <View style={styles.bookRow}>
          <View style={styles.bookNumberBadge}>
            <Text style={styles.bookNumberText}>{item.number}</Text>
          </View>
          <View style={styles.bookInfo}>
            <Text style={styles.bookName}>{item.name_en}</Text>
            {item.name_ar ? (
              <Text style={styles.bookNameAr}>{item.name_ar}</Text>
            ) : null}
            <Text style={styles.bookMeta}>
              {item.total_hadiths} hadiths
              {item.total_chapters > 0
                ? ` · ${item.total_chapters} chapters`
                : ''}
            </Text>
          </View>
          <Text style={styles.bookChevron}>{'›'}</Text>
        </View>
      </Card>
    </Pressable>
  );

  const ListHeader = () => (
    <View style={styles.headerSection}>
      {/* Collection name */}
      <Text style={styles.title}>{collection.name_en}</Text>
      {collection.name_ar ? (
        <Text style={styles.titleAr}>{collection.name_ar}</Text>
      ) : null}

      {/* Scholar info */}
      {collection.scholar ? (
        <Text style={styles.scholar}>
          {collection.scholar}
          {collection.scholar_dates ? ` (${collection.scholar_dates})` : ''}
        </Text>
      ) : null}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {collection.total_hadiths?.toLocaleString() || '0'}
          </Text>
          <Text style={styles.statLabel}>Hadiths</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {collection.total_books?.toLocaleString() || '0'}
          </Text>
          <Text style={styles.statLabel}>Books</Text>
        </View>
      </View>

      {/* Grade distribution bar */}
      {collection.grade_distribution &&
      Object.keys(collection.grade_distribution).length > 0 ? (
        <GradeBar distribution={collection.grade_distribution} />
      ) : null}

      {/* Description */}
      {collection.description_en ? (
        <Text style={styles.description}>{collection.description_en}</Text>
      ) : null}

      {/* Section label */}
      <Text style={styles.sectionLabel}>
        Books ({books.length})
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: collection.name_en,
          headerShown: true,
        }}
      />
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={renderBookCard}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No books found in this collection.</Text>
          </View>
        }
      />
    </View>
  );
}

const gradeStyles = StyleSheet.create({
  container: {
    marginTop: SPACING.md,
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedText,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  headerSection: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.bronzeText,
  },
  titleAr: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.mutedText,
    textAlign: 'right',
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  scholar: {
    fontSize: FONT_SIZES.base,
    color: COLORS.emeraldMid,
    marginTop: SPACING.sm,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.bronzeText,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  description: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    lineHeight: 20,
    marginTop: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.bronzeText,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  bookCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bookNumberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.emeraldMid + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookNumberText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.emeraldMid,
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.bronzeText,
  },
  bookNameAr: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    textAlign: 'right',
    marginTop: 2,
  },
  bookMeta: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedText,
    marginTop: SPACING.xs,
  },
  bookChevron: {
    fontSize: 24,
    color: COLORS.mutedText,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.mutedText,
    marginBottom: SPACING.md,
  },
  backLink: {
    fontSize: FONT_SIZES.md,
    color: COLORS.emeraldMid,
    fontWeight: '600',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    textAlign: 'center',
  },
});
