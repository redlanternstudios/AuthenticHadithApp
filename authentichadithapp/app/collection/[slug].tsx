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
  getColors,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '@/lib/styles/colors';
import { FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { isHiddenCollection } from '@/lib/hadith/visibleCollections';

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
  id: number;
  collection_slug: string;
  book_number: number | null;
  book_name: string | null;
  collection_name: string | null;
  hadith_count: number | null;
}

function getGradeColors(colors: ReturnType<typeof getColors>): Record<string, string> {
  return {
    sahih: colors.sahih,
    hasan: colors.hasan,
    daif: colors.daif,
  };
}

function GradeBar({ distribution, colors }: { distribution: Record<string, number>; colors: ReturnType<typeof getColors> }) {
  const gradeColors = getGradeColors(colors);
  const total = Object.values(distribution).reduce((sum, v) => sum + v, 0);
  if (total === 0) return null;

  const segments = Object.entries(distribution)
    .filter(([, count]) => count > 0)
    .map(([grade, count]) => ({
      grade,
      count,
      percent: (count / total) * 100,
      color: gradeColors[grade] || colors.mutedText,
    }));

  return (
    <View style={gradeStyles.container}>
      <View style={[gradeStyles.bar, { backgroundColor: colors.border }]}>
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
            <Text style={[gradeStyles.legendText, { color: colors.mutedText }]}>
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
  const { isDark } = useTheme();
  const colors = getColors(isDark);
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

  // Fetch books for this collection.
  // The books table has skeleton rows (book_name/book_number null). When no
  // granular book rows exist, derive the book list from distinct book_number
  // values on the hadiths table so the user can still browse by book.
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ['collection-books', slug],
    queryFn: async () => {
      // First try the books table
      const { data: bookRows } = await supabase
        .from('books')
        .select('*')
        .eq('collection_slug', slug as string)
        .not('book_number', 'is', null)
        .order('book_number');

      if (bookRows && bookRows.length > 0) {
        return bookRows as Book[];
      }

      // Fallback: derive books from hadiths table
      const { data: hadiths } = await supabase
        .from('hadiths')
        .select('book_number')
        .eq('collection_slug', slug as string)
        .not('book_number', 'is', null);

      if (!hadiths || hadiths.length === 0) return [];

      const bookMap = new Map<number, number>();
      for (const h of hadiths) {
        if (h.book_number != null) {
          bookMap.set(h.book_number, (bookMap.get(h.book_number) || 0) + 1);
        }
      }

      return Array.from(bookMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([num, count]) => ({
          id: num,
          collection_slug: slug as string,
          book_number: num,
          book_name: null,
          collection_name: null,
          hadith_count: count,
        })) as Book[];
    },
    enabled: !!slug,
  });

  if (collectionLoading || booksLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Collection', headerShown: true }} />
        <LoadingSpinner />
      </>
    );
  }

  if (collectionError || !collection || isHiddenCollection(slug)) {
    return (
      <>
        <Stack.Screen options={{ title: 'Collection', headerShown: true }} />
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: colors.mutedText }]}>Collection not found.</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.backLink, { color: colors.emeraldMid }]}>Go back</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const renderBookCard = ({ item }: { item: Book }) => {
    const displayNumber = item.book_number ?? item.id;
    const displayName = item.book_name || `Book ${displayNumber}`;
    const hadithCount = item.hadith_count ?? 0;

    return (
      <Pressable onPress={() => router.push(`/book/${item.id}?slug=${slug}&book_number=${displayNumber}`)}>
        <Card style={styles.bookCard}>
          <View style={styles.bookRow}>
            <View style={[styles.bookNumberBadge, { backgroundColor: colors.emeraldMid + '15' }]}>
              <Text style={[styles.bookNumberText, { color: colors.emeraldMid }]}>{displayNumber}</Text>
            </View>
            <View style={styles.bookInfo}>
              <Text style={[styles.bookName, { color: colors.bronzeText }]}>{displayName}</Text>
              <Text style={[styles.bookMeta, { color: colors.mutedText }]}>
                {hadithCount} hadiths
              </Text>
            </View>
            <Text style={[styles.bookChevron, { color: colors.mutedText }]}>{'›'}</Text>
          </View>
        </Card>
      </Pressable>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerSection}>
      <Text style={[styles.title, { color: colors.bronzeText }]}>{collection.name_en}</Text>
      {collection.name_ar ? (
        <Text style={[styles.titleAr, { color: colors.mutedText }]}>{collection.name_ar}</Text>
      ) : null}

      {collection.scholar ? (
        <Text style={[styles.scholar, { color: colors.emeraldMid }]}>
          {collection.scholar}
          {collection.scholar_dates ? ` (${collection.scholar_dates})` : ''}
        </Text>
      ) : null}

      <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.bronzeText }]}>
            {collection.total_hadiths?.toLocaleString() || '0'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>Hadiths</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.bronzeText }]}>
            {collection.total_books?.toLocaleString() || '0'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>Books</Text>
        </View>
      </View>

      {collection.grade_distribution &&
      Object.keys(collection.grade_distribution).length > 0 ? (
        <GradeBar distribution={collection.grade_distribution} colors={colors} />
      ) : null}

      {collection.description_en ? (
        <Text style={[styles.description, { color: colors.mutedText }]}>{collection.description_en}</Text>
      ) : null}

      <Text style={[styles.sectionLabel, { color: colors.bronzeText }]}>
        Books ({books.length})
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: collection.name_en,
          headerShown: true,
        }}
      />
      <FlatList
        data={books}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderBookCard}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>No books found in this collection.</Text>
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
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.xs,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  headerSection: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  title: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
  },
  titleAr: {
    fontSize: FONT_SIZES.xxl,
    textAlign: 'right',
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  scholar: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    marginTop: SPACING.sm,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  description: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    lineHeight: 20,
    marginTop: SPACING.md,
  },
  sectionLabel: {
    fontFamily: FONT_FAMILY.headingMedium,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookNumberText: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  bookNameAr: {
    fontSize: FONT_SIZES.base,
    textAlign: 'right',
    marginTop: 2,
  },
  bookMeta: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  bookChevron: {
    fontSize: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.md,
  },
  backLink: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
});
