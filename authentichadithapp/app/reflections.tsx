import React, { useState } from 'react'
import { StyleSheet, View, ScrollView, Text, TextInput, Alert } from 'react-native'
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
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner'

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
      const { data } = await supabase
        .from('saved_hadiths')
        .select('id, notes, created_at, hadith:hadiths(id, english_text, collection_slug, hadith_number)')
        .eq('user_id', user.id)
        .not('notes', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50)
      return data || []
    },
    enabled: !!user,
  })

  const addNote = useMutation({
    mutationFn: async () => {
      if (!user || !newReflection.trim()) return
      // Get today's daily hadith to attach the reflection
      const today = new Date()
      const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
      let hash = 0
      for (let i = 0; i < dateStr.length; i++) {
        hash = (hash << 5) - hash + dateStr.charCodeAt(i)
        hash |= 0
      }
      const seed = Math.abs(hash)

      const { count } = await supabase
        .from('hadiths')
        .select('id', { count: 'exact', head: true })
        .eq('grade', 'sahih')

      if (!count) return

      const offset = seed % count
      const { data: hadith } = await supabase
        .from('hadiths')
        .select('id')
        .eq('grade', 'sahih')
        .range(offset, offset)
        .single()

      if (!hadith) return

      await supabase.from('saved_hadiths').upsert({
        user_id: user.id,
        hadith_id: hadith.id,
        notes: newReflection.trim(),
      })

      trackActivity(user.id, 'note')
    },
    onSuccess: () => {
      setNewReflection('')
      queryClient.invalidateQueries({ queryKey: ['reflections'] })
    },
    onError: () => {
      Alert.alert('Error', 'Could not save reflection.')
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Reflections', headerShown: true }} />
      {isError && <QueryErrorBanner onRetry={refetch} />}

      <Text style={[styles.title, { color: colors.bronzeText }]}>My Reflections</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        Personal notes and thoughts on the hadiths you've read
      </Text>

      {/* Write New Reflection */}
      <Card variant="elevated" style={styles.writeCard}>
        <Text style={[styles.writeLabel, { color: colors.bronzeText }]}>Write a reflection on today's hadith</Text>
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
                On: "{(r.hadith.english_text || '').slice(0, 80)}..."
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
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FONT_SIZES.xxxl, fontWeight: '700', paddingTop: SPACING.md },
  subtitle: { fontSize: FONT_SIZES.base, marginBottom: SPACING.lg },
  writeCard: { marginBottom: SPACING.lg, gap: SPACING.sm },
  writeLabel: { fontSize: FONT_SIZES.base, fontWeight: '600' },
  textArea: {
    height: 100, borderRadius: 8,
    borderWidth: 1, padding: SPACING.md,
    fontSize: FONT_SIZES.base,
  },
  reflectionCard: { marginBottom: SPACING.sm },
  reflectionNote: { fontSize: FONT_SIZES.base, lineHeight: 22, marginBottom: SPACING.sm },
  reflectionRef: { fontSize: FONT_SIZES.sm, fontStyle: 'italic', marginBottom: SPACING.xs },
  reflectionDate: { fontSize: FONT_SIZES.xs },
  emptyState: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.sm },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: FONT_SIZES.md },
  emptyHint: { fontSize: FONT_SIZES.sm, textAlign: 'center' },
})
