import React from 'react'
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'

export default function StoriesScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getColors(isDark)

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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Stories', headerShown: true }} />

      <View style={styles.backRow}>
        <Button title="← Back" onPress={() => router.back()} variant="ghost" />
      </View>

      <Text style={[styles.title, { color: colors.bronzeText }]}>Stories</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        Learn from the lives of Prophets and Companions
      </Text>

      {/* Prophet Stories Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.bronzeText }]}>Prophets of Allah</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
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
              style={[styles.storyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/stories/prophet/${prophet.slug}`)}
            >
              <View style={[styles.storyAvatar, { backgroundColor: prophet.theme_primary || colors.emeraldMid + '20' }]}>
                <Text style={[styles.storyAvatarText, { color: colors.emeraldMid }]}>
                  {prophet.name_en?.charAt(0) || 'P'}
                </Text>
              </View>
              <Text style={[styles.storyName, { color: colors.bronzeText }]} numberOfLines={1}>{prophet.name_en}</Text>
              {prophet.name_ar && (
                <Text style={[styles.storyArabic, { color: colors.goldMid }]} numberOfLines={1}>{prophet.name_ar}</Text>
              )}
              <Text style={[styles.storyMeta, { color: colors.mutedText }]}>
                {prophet.quran_mentions || 0} Quran mentions
              </Text>
              <Text style={[styles.readTime, { color: colors.emeraldMid }]}>
                {prophet.estimated_read_time_minutes || 5} min read
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Companion Stories Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.bronzeText }]}>Companions (Sahaba)</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
          {companions?.length || 0} companions
        </Text>
        {companions?.map((companion) => (
          <Pressable
            key={companion.id}
            onPress={() => router.push(`/stories/companion/${companion.slug}`)}
          >
            <Card variant="elevated" style={styles.companionCard}>
              <View style={styles.companionRow}>
                <View style={[styles.companionAvatar, { backgroundColor: colors.goldMid + '20' }]}>
                  <Text style={[styles.companionAvatarText, { color: colors.goldMid }]}>
                    {companion.name_en?.charAt(0) || 'C'}
                  </Text>
                </View>
                <View style={styles.companionInfo}>
                  <Text style={[styles.companionName, { color: colors.bronzeText }]}>{companion.name_en}</Text>
                  {companion.name_ar && (
                    <Text style={[styles.companionArabic, { color: colors.goldMid }]}>{companion.name_ar}</Text>
                  )}
                  <Text style={[styles.companionDesc, { color: colors.mutedText }]} numberOfLines={2}>
                    {companion.title_en}
                  </Text>
                  {companion.notable_for && companion.notable_for.length > 0 && (
                    <View style={styles.tagsRow}>
                      {companion.notable_for.slice(0, 3).map((tag: string) => (
                        <View key={tag} style={[styles.tag, { backgroundColor: colors.emeraldMid + '15' }]}>
                          <Text style={[styles.tagText, { color: colors.emeraldMid }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <Text style={[styles.chevron, { color: colors.mutedText }]}>›</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  backRow: { marginBottom: SPACING.sm },
  title: { fontSize: FONT_SIZES.xxxl, fontWeight: '700', paddingTop: SPACING.md },
  subtitle: { fontSize: FONT_SIZES.base, marginBottom: SPACING.lg },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', marginBottom: SPACING.xs },
  sectionSubtitle: { fontSize: FONT_SIZES.sm, marginBottom: SPACING.md },
  horizontalList: { gap: SPACING.md, paddingRight: SPACING.md },
  storyCard: {
    width: 140, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, alignItems: 'center', borderWidth: 1,
  },
  storyAvatar: {
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  storyAvatarText: { fontSize: FONT_SIZES.xl, fontWeight: '700' },
  storyName: { fontSize: FONT_SIZES.base, fontWeight: '600', textAlign: 'center' },
  storyArabic: { fontSize: FONT_SIZES.sm, textAlign: 'center' },
  storyMeta: { fontSize: FONT_SIZES.xs, marginTop: SPACING.xs },
  readTime: { fontSize: FONT_SIZES.xs },
  companionCard: { marginBottom: SPACING.sm },
  companionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  companionAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  companionAvatarText: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  companionInfo: { flex: 1 },
  companionName: { fontSize: FONT_SIZES.md, fontWeight: '600' },
  companionArabic: { fontSize: FONT_SIZES.sm },
  companionDesc: { fontSize: FONT_SIZES.sm, marginTop: 2, lineHeight: 18 },
  tagsRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.xs, flexWrap: 'wrap' },
  tag: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  tagText: { fontSize: FONT_SIZES.xs, fontWeight: '500' },
  chevron: { fontSize: 24 },
})
