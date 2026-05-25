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
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getSearchTerms } from '@/lib/search/topics';
import {
  getColors,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Hadith } from '@/types/hadith';
import { useRouter } from 'expo-router';
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner';

const GRADE_OPTIONS = ['All', 'Sahih', 'Hasan', "Da'if"] as const;

export default function SearchScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
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
      return data as { name_en: string; slug: string }[];
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

      const orFilter = terms
        .flatMap((term) => [
          `english_text.ilike.%${term}%`,
          `narrator.ilike.%${term}%`,
          `arabic_text.ilike.%${term}%`,
        ])
        .join(',');

      let query = supabase
        .from('hadiths')
        .select('*')
        .or(orFilter);

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
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.bronzeText }]}>Search Hadiths</Text>
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.emeraldMid }]}>
              <Text style={[styles.filterBadgeText, { color: colors.white }]}>{activeFilterCount}</Text>
            </View>
          )}
        </View>
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
    padding: SPACING.md,
    paddingTop: SPACING.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  title: {
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
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  subtitle: {
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
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
});
