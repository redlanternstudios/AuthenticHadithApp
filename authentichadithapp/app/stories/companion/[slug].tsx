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
import { useCompletionStatus } from '@/hooks/useProgress'

export default function CompanionStoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { user } = useAuth()
  const completion = useCompletionStatus('story', slug ?? null)

  // Use maybeSingle() — a deep-link with a stale or invalid slug must NOT
  // throw PGRST116 and crash the screen (Rule 028).
  const { data: companion, isLoading } = useQuery({
    queryKey: ['companion', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sahaba')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      if (error) {
        __DEV__ && console.warn('[CompanionStory] sahaba query failed (non-fatal):', error.message)
        return null
      }
      return data
    },
    enabled: !!slug,
  })

  const { data: storyParts } = useQuery({
    queryKey: ['companion-parts', companion?.id],
    queryFn: async () => {
      if (!companion?.id) return []
      const { data, error } = await supabase
        .from('story_parts')
        .select('*')
        .eq('sahabi_id', companion.id)
        .order('part_number')
      if (error) {
        __DEV__ && console.warn('[CompanionStory] story_parts query failed (non-fatal):', error.message)
        return []
      }
      return data || []
    },
    enabled: !!companion?.id,
  })

  const handleMarkComplete = async () => {
    if (!slug) return
    await completion.markComplete({
      entityKind: 'sahaba',
      entityId: companion?.id,
      slug,
      title: companion?.name_en,
    })
    if (user) {
      try {
        await trackActivity(user.id, 'complete_story')
      } catch (err) {
        __DEV__ && console.warn('[CompanionStory] trackActivity failed (non-fatal):', err)
      }
    }
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

  const parts = storyParts || []
  const isComplete = completion.isComplete

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
      {companion.title_en && (
        <Text style={styles.description}>{companion.title_en}</Text>
      )}

      {/* Content Parts */}
      {parts.map((part: any) => (
        <Card key={part.id} variant="elevated" style={styles.partCard}>
          <Text style={styles.partTitle}>{part.title_en || `Part ${part.part_number}`}</Text>
          {part.opening_hook && (
            <Text style={styles.partHook}>{part.opening_hook}</Text>
          )}
          <Text style={styles.partContent}>{part.content_en}</Text>
          {part.key_lesson && (
            <View style={styles.lessonBox}>
              <Text style={styles.lessonLabel}>Key Lesson</Text>
              <Text style={styles.lessonText}>{part.key_lesson}</Text>
            </View>
          )}
        </Card>
      ))}

      {/* Mark Complete — available to all users (local-first persistence). */}
      {!isComplete && parts.length > 0 && (
        <Button
          title={completion.isMarking ? 'Marking…' : 'Mark as Complete'}
          variant="primary"
          size="large"
          onPress={handleMarkComplete}
          isLoading={completion.isMarking}
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
  partHook: { fontSize: FONT_SIZES.base, color: COLORS.goldMid, fontStyle: 'italic', marginBottom: SPACING.sm, lineHeight: 22 },
  partContent: { fontSize: FONT_SIZES.base, color: COLORS.bronzeText, lineHeight: 24 },
  lessonBox: { marginTop: SPACING.md, padding: SPACING.sm, backgroundColor: COLORS.emeraldMid + '10', borderRadius: BORDER_RADIUS.md, borderLeftWidth: 3, borderLeftColor: COLORS.emeraldMid },
  lessonLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.emeraldMid, marginBottom: 4, textTransform: 'uppercase' },
  lessonText: { fontSize: FONT_SIZES.sm, color: COLORS.bronzeText, lineHeight: 20 },
  completeButton: { marginHorizontal: SPACING.md, marginTop: SPACING.md },
  completeBadge: { alignItems: 'center', padding: SPACING.lg },
  completeText: { fontSize: FONT_SIZES.md, color: COLORS.emeraldMid, fontWeight: '600' },
})
