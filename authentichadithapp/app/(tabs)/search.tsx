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
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '@/lib/styles/colors';
import { Hadith } from '@/types/hadith';
import { useRouter } from 'expo-router';

const GRADE_OPTIONS = ['All', 'Sahih', 'Hasan', "Da'if"] as const;

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(searchQuery, 500);

  // Fetch collections for filter chips
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

  // Count active filters (excluding "All" grade and no collection)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (gradeFilter !== 'All') count++;
    if (collectionFilter) count++;
    return count;
  }, [gradeFilter, collectionFilter]);

  const { data: hadiths = [], isLoading } = useQuery({
    queryKey: ['search-hadiths', debouncedQuery, gradeFilter, collectionFilter],
    queryFn: async () => {
      if (!debouncedQuery) return [];

      // Sanitize to prevent SQL injection
      const sanitized = debouncedQuery.replace(/[%_]/g, '\\$&').trim();

      // Expand to synonym terms (e.g. "sabr" -> ["sabr", "patience", "perseverance"])
      const terms = getSearchTerms(sanitized);

      // Build OR conditions across expanded terms on both text fields
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

      // Apply grade filter
      if (gradeFilter !== 'All') {
        // Map display label to DB value
        const gradeValue = gradeFilter === "Da'if" ? 'daif' : gradeFilter.toLowerCase();
        query = query.eq('grade', gradeValue);
      }

      // Apply collection filter
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Search Hadiths</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>
          Search in English, Arabic, or transliteration
        </Text>

        <Input
          placeholder="e.g. patience, sabr, prayer, salah..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Grade filter chips */}
        <View style={styles.chipRow}>
          {GRADE_OPTIONS.map((grade) => {
            const isActive = gradeFilter === grade;
            return (
              <Pressable
                key={grade}
                style={[
                  styles.chip,
                  isActive && styles.chipActive,
                ]}
                onPress={() => setGradeFilter(grade)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive && styles.chipTextActive,
                  ]}
                >
                  {grade}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Collection filter chips (horizontal scroll) */}
        {collections.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.collectionChipRow}
          >
            <Pressable
              style={[
                styles.chip,
                !collectionFilter && styles.chipActive,
              ]}
              onPress={() => setCollectionFilter(null)}
            >
              <Text
                style={[
                  styles.chipText,
                  !collectionFilter && styles.chipTextActive,
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
                    isActive && styles.chipActive,
                  ]}
                  onPress={() =>
                    setCollectionFilter(isActive ? null : col.slug)
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      isActive && styles.chipTextActive,
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

      {debouncedQuery.length > 2 ? (
        <HadithList
          hadiths={hadiths}
          isLoading={isLoading}
          onHadithPress={(hadith) => router.push(`/hadith/${hadith.id}`)}
          emptyMessage="No hadiths found. Try a different keyword or adjust your filters."
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
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
    backgroundColor: COLORS.background,
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
    color: COLORS.bronzeText,
  },
  filterBadge: {
    backgroundColor: COLORS.emeraldMid,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
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
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.emeraldMid,
    borderColor: COLORS.emeraldMid,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.bronzeText,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    textAlign: 'center',
  },
});
