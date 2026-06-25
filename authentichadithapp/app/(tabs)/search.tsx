import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { HadithList } from '@/components/hadith/HadithList';
import { TopBar } from '@/components/layout/TopBar';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getSearchTerms } from '@/lib/search/topics';
import {
  getColors,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '@/lib/styles/colors';
import { FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Hadith } from '@/types/hadith';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { filterVisibleCollections, HIDDEN_COLLECTION_FILTER } from '@/lib/hadith/visibleCollections';
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner';

const GRADE_OPTIONS = ['All', 'Sahih', 'Hasan', "Da'if"] as const;

export default function SearchScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(searchQuery, 500);

  const { data: collections = [] } = useQuery({
    queryKey: ['search-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('name_en, slug')
        .order('name_en');

      if (error) throw error;
      return filterVisibleCollections(data as { name_en: string; slug: string }[]);
    },
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (gradeFilter !== 'All') count++;
    if (collectionFilter) count++;
    return count;
  }, [gradeFilter, collectionFilter]);

  const { data: hadiths = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['search-hadiths', debouncedQuery, gradeFilter, collectionFilter],
    queryFn: async () => {
      if (!debouncedQuery) return [];

      const sanitized = debouncedQuery.replace(/[%_]/g, '\\$&').trim();
      const terms = getSearchTerms(sanitized);
      const numericQuery = sanitized.match(/^\d+$/) ? Number(sanitized) : null;

      const orFilter = terms
        .flatMap((term) => [
          `english_text.ilike.%${term}%`,
          `narrator.ilike.%${term}%`,
          `arabic_text.ilike.%${term}%`,
          `reference.ilike.%${term}%`,
        ])
        .concat(Number.isFinite(numericQuery) ? [`hadith_number.eq.${numericQuery}`] : [])
        .join(',');

      let query = supabase
        .from('hadiths')
        .select('*')
        .or(orFilter);

      // Exclude release-hidden collections so the default "All Collections"
      // search never surfaces a thin-collection hadith (which would deep-link
      // into a hidden collection via /hadith/[id]).
      if (HIDDEN_COLLECTION_FILTER) {
        query = query.not('collection_slug', 'in', HIDDEN_COLLECTION_FILTER);
      }

      if (gradeFilter !== 'All') {
        const gradeValue = gradeFilter === "Da'if" ? 'daif' : gradeFilter.toLowerCase();
        query = query.eq('grade', gradeValue);
      }

      if (collectionFilter) {
        query = query.eq('collection_slug', collectionFilter);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data as Hadith[];
    },
    enabled: debouncedQuery.length > 2,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* A#6: TopBar — web parity top navigation */}
      <TopBar title="Search" />
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Search in English, Arabic, or transliteration
        </Text>

        <Input
          placeholder="e.g. patience, sabr, prayer, salah..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.chipRow}>
          {GRADE_OPTIONS.map((grade) => {
            const isActive = gradeFilter === grade;
            return (
              <Pressable
                key={grade}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isActive && { backgroundColor: colors.emeraldMid, borderColor: colors.emeraldMid },
                ]}
                onPress={() => setGradeFilter(grade)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${grade}`}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: colors.bronzeText },
                    isActive && { color: colors.white },
                  ]}
                >
                  {grade}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {collections.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.collectionChipRow}
          >
            <Pressable
              style={[
                styles.chip,
                { backgroundColor: colors.card, borderColor: colors.border },
                !collectionFilter && { backgroundColor: colors.emeraldMid, borderColor: colors.emeraldMid },
              ]}
              onPress={() => setCollectionFilter(null)}
              accessibilityRole="button"
              accessibilityLabel="Show all collections"
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.bronzeText },
                  !collectionFilter && { color: colors.white },
                ]}
              >
                All Collections
              </Text>
            </Pressable>
            {collections.map((col) => {
              const isActive = collectionFilter === col.slug;
              return (
                <Pressable
                  key={col.slug}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isActive && { backgroundColor: colors.emeraldMid, borderColor: colors.emeraldMid },
                  ]}
                  onPress={() =>
                    setCollectionFilter(isActive ? null : col.slug)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${col.name_en}`}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: colors.bronzeText },
                      isActive && { color: colors.white },
                    ]}
                  >
                    {col.name_en}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {isError && <QueryErrorBanner onRetry={refetch} />}

      {debouncedQuery.length > 2 ? (
        <HadithList
          hadiths={hadiths}
          isLoading={isLoading}
          onHadithPress={(hadith) => router.push(`/hadith/${hadith.id}`)}
          emptyMessage="No hadiths found. Try a different keyword or adjust your filters."
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.mutedText }]}>
            Enter at least 3 characters to search
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  title: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
  },
  filterBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  collectionChipRow: {
    gap: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
});
