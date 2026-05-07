import React from 'react'
import { StyleSheet, View, ScrollView, Text, Pressable, Image } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'

export default function StoriesScreen() {
  const router = useRouter()

  const { data: prophets, isLoading: prophetsLoading } = useQuery({
    queryKey: ['prophets'],
    queryFn: async () => {
      const { data } = await supabase
        .from('prophets')
        .select('*')
        .order('name_en', { ascending: true })
      return data || []
    },
  })

  const { data: companions, isLoading: companionsLoading } = useQuery({
    queryKey: ['sahaba'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sahaba')
        .select('*')
        .order('name_en', { ascending: true })
      return data || []
    },
  })

  if (prophetsLoading || companionsLoading) {
    return <LoadingSpinner />
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Stories', headerShown: true }} />

      <Text style={styles.title}>Stories</Text>
      <Text style={styles.subtitle}>
        Learn from the lives of Prophets and Companions
      </Text>

      {/* Prophet Stories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prophets of Allah</Text>
        <Text style={styles.sectionSubtitle}>
          {prophets?.length || 0} prophets mentioned in the Quran
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {prophets?.map((prophet) => (
            <Pressable
              key={prophet.id}
              style={styles.storyCard}
              onPress={() => router.push(`/stories/prophet/${prophet.slug}`)}
            >
              <View style={[styles.storyAvatar, { backgroundColor: prophet.theme_primary || COLORS.emeraldMid + '20' }]}>
                <Text style={styles.storyAvatarText}>
                  {prophet.name_en?.charAt(0) || 'P'}
                </Text>
              </View>
              <Text style={styles.storyName} numberOfLines={1}>{prophet.name_en}</Text>
              {prophet.name_ar && (
                <Text style={styles.storyArabic} numberOfLines={1}>{prophet.name_ar}</Text>
              )}
              <Text style={styles.storyMeta}>
                {prophet.quran_mentions || 0} Quran mentions
              </Text>
              <Text style={styles.readTime}>
                {prophet.estimated_read_time_minutes || 5} min read
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Companion Stories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Companions (Sahaba)</Text>
        <Text style={styles.sectionSubtitle}>
          {companions?.length || 0} companions
        </Text>
        {companions?.map((companion) => (
          <Pressable
            key={companion.id}
            onPress={() => router.push(`/stories/companion/${companion.slug}`)}
          >
            <Card variant="elevated" style={styles.companionCard}>
              <View style={styles.companionRow}>
                <View style={styles.companionAvatar}>
                  <Text style={styles.companionAvatarText}>
                    {companion.name_en?.charAt(0) || 'C'}
                  </Text>
                </View>
                <View style={styles.companionInfo}>
                  <Text style={styles.companionName}>{companion.name_en}</Text>
                  {companion.name_ar && (
                    <Text style={styles.companionArabic}>{companion.name_ar}</Text>
                  )}
                  <Text style={styles.companionDesc} numberOfLines={2}>
                    {companion.title_en}
                  </Text>
                  {companion.notable_for && companion.notable_for.length > 0 && (
                    <View style={styles.tagsRow}>
                      {companion.notable_for.slice(0, 3).map((tag: string) => (
                        <View key={tag} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZES.xxxl, fontWeight: '700', color: COLORS.bronzeText, paddingTop: SPACING.md },
  subtitle: { fontSize: FONT_SIZES.base, color: COLORS.mutedText, marginBottom: SPACING.lg },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.bronzeText, marginBottom: SPACING.xs },
  sectionSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.mutedText, marginBottom: SPACING.md },
  horizontalList: { gap: SPACING.md, paddingRight: SPACING.md },
  storyCard: {
    width: 140, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  storyAvatar: {
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  storyAvatarText: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.emeraldMid },
  storyName: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.bronzeText, textAlign: 'center' },
  storyArabic: { fontSize: FONT_SIZES.sm, color: COLORS.goldMid, textAlign: 'center' },
  storyMeta: { fontSize: FONT_SIZES.xs, color: COLORS.mutedText, marginTop: SPACING.xs },
  readTime: { fontSize: FONT_SIZES.xs, color: COLORS.emeraldMid },
  companionCard: { marginBottom: SPACING.sm },
  companionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  companionAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.goldMid + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  companionAvatarText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.goldMid },
  companionInfo: { flex: 1 },
  companionName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.bronzeText },
  companionArabic: { fontSize: FONT_SIZES.sm, color: COLORS.goldMid },
  companionDesc: { fontSize: FONT_SIZES.sm, color: COLORS.mutedText, marginTop: 2, lineHeight: 18 },
  tagsRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.xs, flexWrap: 'wrap' },
  tag: { backgroundColor: COLORS.emeraldMid + '15', paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  tagText: { fontSize: FONT_SIZES.xs, color: COLORS.emeraldMid, fontWeight: '500' },
  chevron: { fontSize: 24, color: COLORS.mutedText },
})
