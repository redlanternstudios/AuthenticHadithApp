import React from 'react'
import { StyleSheet, View, ScrollView, Text } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { trackActivity } from '@/lib/gamification/track-activity'
import { useCompletionStatus } from '@/hooks/useProgress'

export default function CompanionStoryScreen() {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const router = useRouter()
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
        <Text style={[styles.emptyText, { color: colors.mutedText }]}>Story not found.</Text>
      </View>
    )
  }

  const parts = storyParts || []
  const isComplete = completion.isComplete

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: companion.name_en, headerShown: true }} />

      <View style={styles.backRow}>
        <Button title="← Back" onPress={() => router.back()} variant="ghost" />
      </View>

      {/* Hero Header */}
      <View style={[styles.hero, { backgroundColor: colors.goldMid + '10' }]}>
        <View style={[styles.avatar, { backgroundColor: colors.goldMid + '25' }]}>
          <Text style={[styles.avatarText, { color: colors.goldMid }]}>{companion.name_en?.charAt(0)}</Text>
        </View>
        <Text style={[styles.heroName, { color: colors.bronzeText }]}>{companion.name_en}</Text>
        {companion.name_ar && (
          <Text style={[styles.heroArabic, { color: colors.goldMid }]}>{companion.name_ar}</Text>
        )}
        {companion.notable_for && companion.notable_for.length > 0 && (
          <View style={styles.tagsRow}>
            {companion.notable_for.map((tag: string) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.emeraldMid + '15' }]}>
                <Text style={[styles.tagText, { color: colors.emeraldMid }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={[styles.readTime, { color: colors.mutedText }]}>
          {companion.estimated_read_time_minutes || 5} min read
        </Text>
      </View>

      {/* Description */}
      {companion.title_en && (
        <Text style={[styles.description, { color: colors.bronzeText }]}>{companion.title_en}</Text>
      )}

      {/* Content Parts */}
      {parts.map((part: any) => (
        <Card key={part.id} variant="elevated" style={styles.partCard}>
          <Text style={[styles.partTitle, { color: colors.goldMid }]}>{part.title_en || `Part ${part.part_number}`}</Text>
          {part.opening_hook && (
            <Text style={[styles.partHook, { color: colors.goldMid }]}>{part.opening_hook}</Text>
          )}
          <Text style={[styles.partContent, { color: colors.bronzeText }]}>{part.content_en}</Text>
          {part.key_lesson && (
            <View style={[styles.lessonBox, { backgroundColor: colors.emeraldMid + '10', borderLeftColor: colors.emeraldMid }]}>
              <Text style={[styles.lessonLabel, { color: colors.emeraldMid }]}>Key Lesson</Text>
              <Text style={[styles.lessonText, { color: colors.bronzeText }]}>{part.key_lesson}</Text>
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
          <Text style={[styles.completeText, { color: colors.emeraldMid }]}>✅ Completed</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: SPACING.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: FONT_SIZES.base },
  backRow: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  hero: {
    padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  avatarText: { fontSize: FONT_SIZES.xxxl, fontWeight: '700' },
  heroName: { fontSize: FONT_SIZES.xxxl, fontWeight: '700' },
  heroArabic: { fontSize: FONT_SIZES.xl },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.xs },
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2, borderRadius: BORDER_RADIUS.sm,
  },
  tagText: { fontSize: FONT_SIZES.xs, fontWeight: '500' },
  readTime: { fontSize: FONT_SIZES.sm },
  description: {
    fontSize: FONT_SIZES.md, lineHeight: 26,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  partCard: { marginHorizontal: SPACING.md, marginBottom: SPACING.md },
  partTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', marginBottom: SPACING.sm },
  partHook: { fontSize: FONT_SIZES.base, fontStyle: 'italic', marginBottom: SPACING.sm, lineHeight: 22 },
  partContent: { fontSize: FONT_SIZES.base, lineHeight: 24 },
  lessonBox: { marginTop: SPACING.md, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderLeftWidth: 3 },
  lessonLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  lessonText: { fontSize: FONT_SIZES.sm, lineHeight: 20 },
  completeButton: { marginHorizontal: SPACING.md, marginTop: SPACING.md },
  completeBadge: { alignItems: 'center', padding: SPACING.lg },
  completeText: { fontSize: FONT_SIZES.md, fontWeight: '600' },
})
