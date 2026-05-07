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

export default function CompanionStoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { user } = useAuth()

  const { data: companion, isLoading } = useQuery({
    queryKey: ['companion', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('sahaba')
        .select('*')
        .eq('slug', slug)
        .single()
      return data
    },
    enabled: !!slug,
  })

  const { data: progress } = useQuery({
    queryKey: ['companion-progress', slug, user?.id],
    queryFn: async () => {
      if (!user || !companion) return null
      const { data } = await supabase
        .from('sahaba_reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('story_id', companion.id)
        .eq('story_type', 'companion')
        .single()
      return data
    },
    enabled: !!user && !!companion,
  })

  const handleMarkComplete = async () => {
    if (!user || !companion) return
    const contentParts = companion.content_parts || []
    const allParts = contentParts.map((_: any, i: number) => i)

    await supabase.from('sahaba_reading_progress').upsert({
      user_id: user.id,
      story_id: companion.id,
      story_type: 'companion',
      parts_completed: allParts,
      status: 'completed',
      updated_at: new Date().toISOString(),
    })

    trackActivity(user.id, 'complete_story')
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!companion) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Not Found', headerShown: true }} />
        <Text style={styles.emptyText}>Story not found.</Text>
      </View>
    )
  }

  const contentParts: string[] = companion.content_parts || []
  const isComplete = progress?.status === 'completed'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: companion.name_en, headerShown: true }} />

      {/* Hero Header */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{companion.name_en?.charAt(0)}</Text>
        </View>
        <Text style={styles.heroName}>{companion.name_en}</Text>
        {companion.name_ar && (
          <Text style={styles.heroArabic}>{companion.name_ar}</Text>
        )}
        {companion.notable_for && companion.notable_for.length > 0 && (
          <View style={styles.tagsRow}>
            {companion.notable_for.map((tag: string) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.readTime}>
          {companion.estimated_read_time_minutes || 5} min read
        </Text>
      </View>

      {/* Description */}
      <Text style={styles.description}>{companion.title_en}</Text>

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
    backgroundColor: COLORS.goldMid + '10',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.goldMid + '25',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  avatarText: { fontSize: FONT_SIZES.xxxl, fontWeight: '700', color: COLORS.goldMid },
  heroName: { fontSize: FONT_SIZES.xxxl, fontWeight: '700', color: COLORS.bronzeText },
  heroArabic: { fontSize: FONT_SIZES.xl, color: COLORS.goldMid },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.xs },
  tag: {
    backgroundColor: COLORS.emeraldMid + '15', paddingHorizontal: SPACING.sm,
    paddingVertical: 2, borderRadius: BORDER_RADIUS.sm,
  },
  tagText: { fontSize: FONT_SIZES.xs, color: COLORS.emeraldMid, fontWeight: '500' },
  readTime: { fontSize: FONT_SIZES.sm, color: COLORS.mutedText },
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
