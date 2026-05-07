import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { HadithList } from '@/components/hadith/HadithList';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { Hadith } from '@/types/hadith';

export default function CollectionHadithsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const { data: hadiths = [], isLoading } = useQuery({
    queryKey: ['collection-hadiths', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hadiths')
        .select('*')
        .eq('collection_slug', slug)
        .order('hadith_number')
        .limit(50);

      if (error) throw error;
      return data as Hadith[];
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title="← Back"
          onPress={() => router.back()}
          variant="ghost"
        />
        <Text style={styles.title}>{slug}</Text>
      </View>

      <HadithList
        hadiths={hadiths}
        isLoading={isLoading}
        onHadithPress={(hadith) => router.push(`/hadith/${hadith.id}`)}
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
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.bronzeText,
    marginTop: SPACING.sm,
  },
});
