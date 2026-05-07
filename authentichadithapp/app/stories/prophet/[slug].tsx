import React from 'react'
import { StyleSheet, View, ScrollView, Text } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { trackActivity } from '@/lib/gamification/track-activity'

export default function ProphetStoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { user } = useAuth()

  const { data: prophet, isLoading } = useQuery({
    queryKey: ['prophet', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('prophets')
        .select('*')
        .eq('slug', slug)
        .single()
      return data
    },
    enabled: !!slug,
  })

  const { data: progress } = useQuery({
    queryKey: ['prophet-progress', slug, user?.id],
    queryFn: async () => {
      if (!user || !prophet) return null
      const { data } = await supabase
        .from('sahaba_reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('story_id', prophet.id)
        .eq('story_type', 'prophet')
        .single()
      return data
    },
    enabled: !!user && !!prophet,
  })

  const handleMarkComplete = async () => {
    if (!user || !prophet) return
    const contentParts = prophet.content_parts || []
    const allParts = contentParts.map((_: any, i: number) => i)

    await supabase.from('sahaba_reading_progress').upsert({
      user_id: user.id,
      story_id: prophet.id,
      story_type: 'prophet',
      parts_completed: allParts,
      status: 'completed',
      updated_at: new Date().toISOString(),
    })

    trackActivity(user.id, 'complete_story')
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!prophet) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Not Found', headerShown: true }} />
        <Text style={styles.emptyText}>Story not found.</Text>
      </View>
    )
  }

  const contentParts: string[] = prophet.content_parts || []
  const isComplete = progress?.status === 'completed'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: prophet.name_en, headerShown: true }} />

      {/* Hero Header */}
      <View style={[styles.hero, { backgroundColor: prophet.theme_primary || COLORS.emeraldMid + '15' }]}>
        <Text style={styles.heroName}>{prophet.name_en}</Text>
        {prophet.name_ar && (
          <Text style={styles.heroArabic}>{prophet.name_ar}</Text>
        )}
        <View style={styles.metaRow}>
          {prophet.era && (
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>{prophet.era}</Text>
            </View>
          )}
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>
              {prophet.quran_mentions || 0} Quran mentions
            </Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>
              {prophet.estimated_read_time_minutes || 5} min read
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{prophet.description}</Text>

      {/* Content Parts */}
      {contentParts.map((part: string, index: number) => (
        <Card key={index} variant="elevated" style={styles.partCard}>
          <Text style={styles.partTitle}>Part {index + 1}</Text>
          <Text style={styles.partContent}>{part}</Text>
        </Card>
      ))}

      {/* Mark Complete */}
      {user && !isComplete && contentParts.length > 0 && (
        <Button
          title="Mark as Complete"
          variant="primary"
          size="large"
          onPress={handleMarkComplete}
          style={styles.completeButton}
        />
      )}
      {isComplete && (
        <View style={styles.completeBadge}>
          <Text style={styles.completeText}>✅ Completed</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: FONT_SIZES.base, color: COLORS.mutedText },
  hero: {
    padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm,
  },
  heroName: { fontSize: FONT_SIZES.xxxl, fontWeight: '700', color: COLORS.bronzeText },
  heroArabic: { fontSize: FONT_SIZES.xl, color: COLORS.goldMid },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  metaBadge: {
    backgroundColor: COLORS.card, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
  },
  metaBadgeText: { fontSize: FONT_SIZES.sm, color: COLORS.mutedText },
  description: {
    fontSize: FONT_SIZES.md, color: COLORS.bronzeText, lineHeight: 26,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  partCard: { marginHorizontal: SPACING.md, marginBottom: SPACING.md },
  partTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.goldMid, marginBottom: SPACING.sm },
  partContent: { fontSize: FONT_SIZES.base, color: COLORS.bronzeText, lineHeight: 24 },
  completeButton: { marginHorizontal: SPACING.md, marginTop: SPACING.md },
  completeBadge: { alignItems: 'center', padding: SPACING.lg },
  completeText: { fontSize: FONT_SIZES.md, color: COLORS.emeraldMid, fontWeight: '600' },
})
