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

export default function ProphetStoryScreen() {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const router = useRouter()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { user } = useAuth()
  // Local-first completion. Authoritative for UI state. Supabase mirror happens
  // best-effort inside the progress service when the user is logged in.
  const completion = useCompletionStatus('story', slug ?? null)

  // Use maybeSingle() — a deep-link with a stale or invalid slug must NOT
  // throw PGRST116 and crash the screen (Rule 028).
  const { data: prophet, isLoading } = useQuery({
    queryKey: ['prophet', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prophets')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      if (error) {
        __DEV__ && console.warn('[ProphetStory] prophets query failed (non-fatal):', error.message)
        return null
      }
      return data
    },
    enabled: !!slug,
  })

  const { data: storyParts } = useQuery({
    queryKey: ['prophet-parts', prophet?.id],
    queryFn: async () => {
      if (!prophet?.id) return []
      const { data, error } = await supabase
        .from('prophet_stories')
        .select('*')
        .eq('prophet_id', prophet.id)
        .order('part_number')
      if (error) {
        __DEV__ && console.warn('[ProphetStory] prophet_stories query failed (non-fatal):', error.message)
        return []
      }
      return data || []
    },
    enabled: !!prophet?.id,
  })

  const handleMarkComplete = async () => {
    if (!slug) return
    // Local-first write. Updates UI immediately via the hook's subscribe path.
    // Service handles best-effort Supabase mirror when user is authenticated.
    await completion.markComplete({
      entityKind: 'prophet',
      entityId: prophet?.id,
      slug,
      title: prophet?.name_en,
    })
    // Best-effort XP/streak tracking. Wrapped in catch so a missing user_stats
    // row or missing table never throws into the void.
    if (user) {
      try {
        await trackActivity(user.id, 'complete_story')
      } catch (err) {
        __DEV__ && console.warn('[ProphetStory] trackActivity failed (non-fatal):', err)
      }
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!prophet) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Not Found', headerShown: true }} />
        <Text style={[styles.emptyText, { color: colors.mutedText }]}>Story not found.</Text>
      </View>
    )
  }

  const parts = storyParts || []
  // Local progress is the source of truth — no auth required, persists across
  // restarts, syncs to Supabase opportunistically.
  const isComplete = completion.isComplete

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: prophet.name_en, headerShown: true }} />

      <View style={styles.backRow}>
        <Button title="← Back" onPress={() => router.back()} variant="ghost" />
      </View>

      {/* Hero Header */}
      <View style={[styles.hero, { backgroundColor: prophet.theme_primary || colors.emeraldMid + '15' }]}>
        <Text style={[styles.heroName, { color: colors.bronzeText }]}>{prophet.name_en}</Text>
        {prophet.name_ar && (
          <Text style={[styles.heroArabic, { color: colors.goldMid }]}>{prophet.name_ar}</Text>
        )}
        <View style={styles.metaRow}>
          {prophet.era && (
            <View style={[styles.metaBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.metaBadgeText, { color: colors.mutedText }]}>{prophet.era}</Text>
            </View>
          )}
          <View style={[styles.metaBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metaBadgeText, { color: colors.mutedText }]}>
              {prophet.quran_mentions || 0} Quran mentions
            </Text>
          </View>
          <View style={[styles.metaBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metaBadgeText, { color: colors.mutedText }]}>
              {prophet.estimated_read_time_minutes || 5} min read
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      {prophet.title_en && (
        <Text style={[styles.description, { color: colors.bronzeText }]}>{prophet.title_en}</Text>
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
  heroName: { fontSize: FONT_SIZES.xxxl, fontWeight: '700' },
  heroArabic: { fontSize: FONT_SIZES.xl },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  metaBadge: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1,
  },
  metaBadgeText: { fontSize: FONT_SIZES.sm },
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
