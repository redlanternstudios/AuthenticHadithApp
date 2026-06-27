import React, { useState } from 'react'
import { StyleSheet, View, ScrollView, Text, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { Stack } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { trackActivity } from '@/lib/gamification/track-activity'
import { saveHadithToFolder } from '@/lib/api/my-hadith'
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner'
import { FONT_FAMILY } from '@/constants/theme'
import { getDailySeed } from '@/lib/hadith/dailySeed'
import { HIDDEN_COLLECTION_FILTER } from '@/lib/hadith/visibleCollections'

export default function ReflectionsScreen() {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [newReflection, setNewReflection] = useState('')

  const { data: reflections, isLoading, isError, refetch } = useQuery({
    queryKey: ['reflections', user?.id],
    queryFn: async () => {
      if (!user) return []
      // FIX-121: Two-query merge per Golden Rule #1 / FIX-041-FOLLOW-UP.
      // saved_hadiths.hadith_id has NO FK to hadiths.id in production, so the
      // PostgREST embed hadith:hadiths(...) returned PGRST200 and hadith data
      // was always null, leaving reflection cards showing no hadith reference.
      const { data: savedRows, error } = await supabase
        .from('saved_hadiths')
        .select('id, notes, created_at, hadith_id')
        .eq('user_id', user.id)
        .not('notes', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        __DEV__ && console.error('[Reflections] saved_hadiths fetch failed:', error)
        return []
      }

      if (!savedRows || savedRows.length === 0) return []

      const hadithIds = Array.from(
        new Set(savedRows.map(r => r.hadith_id).filter((id): id is string => !!id))
      )

      if (hadithIds.length === 0) return savedRows

      const { data: hadithRows } = await supabase
        .from('hadiths')
        .select('id, english_text, collection_slug, hadith_number')
        .in('id', hadithIds)

      const hadithById = new Map((hadithRows ?? []).map(h => [h.id, h]))
      return savedRows.map(row => ({
        ...row,
        hadith: hadithById.get(row.hadith_id) ?? null,
      }))
    },
    enabled: !!user,
  })

  const addNote = useMutation({
    mutationFn: async () => {
      if (!user || !newReflection.trim()) return
      // Bug 2 fix: use getDailySeed() (UTC-stable) and apply the SAME filters as
      // today.tsx (english_text NOT NULL/empty + hidden collection exclusions) so
      // the seed % count offset resolves to the identical hadith on both screens.
      const seed = getDailySeed()

      let countQuery = supabase
        .from('hadiths')
        .select('id', { count: 'exact', head: true })
        .eq('grade', 'sahih')
        .not('english_text', 'is', null)
        .neq('english_text', '')
      if (HIDDEN_COLLECTION_FILTER) {
        countQuery = countQuery.not('collection_slug', 'in', HIDDEN_COLLECTION_FILTER)
      }
      const { count } = await countQuery

      if (!count) return

      const offset = seed % count
      let rowQuery = supabase
        .from('hadiths')
        .select('id')
        .eq('grade', 'sahih')
        .not('english_text', 'is', null)
        .neq('english_text', '')
      if (HIDDEN_COLLECTION_FILTER) {
        rowQuery = rowQuery.not('collection_slug', 'in', HIDDEN_COLLECTION_FILTER)
      }
      // Bug 2 + Bug 1 fix: ORDER BY id for deterministic row selection.
      const { data: hadith } = await rowQuery.order('id', { ascending: true }).range(offset, offset).single()

      if (!hadith) return

      // FIX-138: route the reflection note through the canonical hardened write
      // path. The prior inline upsert had NO onConflict, so for any hadith the
      // user had already saved it hit the (user_id, hadith_id) unique constraint
      // and threw 23505 — and the error was never captured, so the mutation
      // "succeeded" while nothing was written. saveHadithToFolder upserts with
      // onConflict:'user_id,hadith_id' and now relies on the saved_hadiths UPDATE
      // RLS policy added in migration 1000.
      await saveHadithToFolder(user.id, hadith.id, undefined, newReflection.trim())

      // Activity/XP tracking is best-effort and must never fail the save.
      try {
        await trackActivity(user.id, 'note')
      } catch (e) {
        __DEV__ && console.warn('[Reflections] trackActivity failed (non-fatal):', e)
      }
    },
    onSuccess: () => {
      setNewReflection('')
      queryClient.invalidateQueries({ queryKey: ['reflections'] })
    },
    onError: (error) => {
      __DEV__ && console.error('[Reflections] save reflection failed:', error)
      Alert.alert(
        'Could not save reflection',
        error instanceof Error ? error.message : 'Please try again.'
      )
    },
  })

  if (!user) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Reflections', headerShown: true }} />
        <Text style={[styles.emptyText, { color: colors.mutedText }]}>Sign in to write reflections.</Text>
      </View>
    )
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    // FIX-134: KeyboardAvoidingView lifts the multiline TextInput above the iOS
    // keyboard — without this, tapping the reflection textarea causes the keyboard
    // to cover the input and the user cannot type.
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Reflections', headerShown: true }} />
      {isError && <QueryErrorBanner onRetry={refetch} />}

      <Text style={[styles.title, { color: colors.bronzeText }]}>My Reflections</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        {"Personal notes and thoughts on the hadiths you've read"}
      </Text>

      {/* Write New Reflection */}
      <Card variant="elevated" style={styles.writeCard}>
        <Text style={[styles.writeLabel, { color: colors.bronzeText }]}>{"Write a reflection on today's hadith"}</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.bronzeText }]}
          placeholder="What did this hadith teach you today?"
          placeholderTextColor={colors.mutedText}
          value={newReflection}
          onChangeText={setNewReflection}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Button
          title="Save Reflection"
          variant="primary"
          size="small"
          onPress={() => addNote.mutate()}
          disabled={!newReflection.trim()}
          isLoading={addNote.isPending}
        />
      </Card>

      {/* Past Reflections */}
      {reflections && reflections.length > 0 ? (
        reflections.map((r: any) => (
          <Card key={r.id} style={styles.reflectionCard}>
            <Text style={[styles.reflectionNote, { color: colors.bronzeText }]}>{r.notes}</Text>
            {r.hadith && (
              <Text style={[styles.reflectionRef, { color: colors.mutedText }]} numberOfLines={2}>
                {`On: "${(r.hadith.english_text || '').slice(0, 80)}..."`}
              </Text>
            )}
            <Text style={[styles.reflectionDate, { color: colors.mutedText }]}>
              {new Date(r.created_at).toLocaleDateString()}
            </Text>
          </Card>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={[styles.emptyText, { color: colors.mutedText }]}>No reflections yet.</Text>
          <Text style={[styles.emptyHint, { color: colors.mutedText }]}>
            Start writing your thoughts on the hadiths you read.
          </Text>
        </View>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FONT_SIZES.xxxl, fontWeight: '700', fontFamily: FONT_FAMILY.heading, paddingTop: SPACING.md },
  subtitle: { fontSize: FONT_SIZES.base, fontFamily: FONT_FAMILY.body, marginBottom: SPACING.lg },
  writeCard: { marginBottom: SPACING.lg, gap: SPACING.sm },
  writeLabel: { fontSize: FONT_SIZES.base, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold },
  textArea: {
    height: 100, borderRadius: 8,
    borderWidth: 1, padding: SPACING.md,
    fontSize: FONT_SIZES.base,
    fontFamily: FONT_FAMILY.body,
  },
  reflectionCard: { marginBottom: SPACING.sm },
  reflectionNote: { fontSize: FONT_SIZES.base, fontFamily: FONT_FAMILY.body, lineHeight: 22, marginBottom: SPACING.sm },
  reflectionRef: { fontSize: FONT_SIZES.sm, fontFamily: FONT_FAMILY.body, fontStyle: 'italic', marginBottom: SPACING.xs },
  reflectionDate: { fontSize: FONT_SIZES.xs, fontFamily: FONT_FAMILY.body },
  emptyState: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.sm },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: FONT_SIZES.md, fontFamily: FONT_FAMILY.body },
  emptyHint: { fontSize: FONT_SIZES.sm, fontFamily: FONT_FAMILY.body, textAlign: 'center' },
})
