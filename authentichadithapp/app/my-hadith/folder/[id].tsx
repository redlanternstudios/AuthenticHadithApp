import React, { useState } from 'react'
import { StyleSheet, View, Text, FlatList, Pressable, Share, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useFolderHadiths } from '@/hooks/useMyHadith'
import { useQuery } from '@tanstack/react-query'
import { generateShareToken } from '@/lib/api/my-hadith'
import { supabase } from '@/lib/supabase/client'
import { HadithCard } from '@/components/hadith/HadithCard'
import { Button } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'
import type { HadithFolder } from '@/types/my-hadith'

export default function FolderDetailScreen() {
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: hadiths, isLoading } = useFolderHadiths(id)
  const [isGeneratingToken, setIsGeneratingToken] = useState(false)

  // Fetch folder details to get share token
  const { data: folder } = useQuery({
    queryKey: ['folder', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hadith_folders')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as HadithFolder
    },
    enabled: !!id
  })

  const handleShare = async () => {
    try {
      setIsGeneratingToken(true)
      let shareToken = folder?.share_token
      
      // Generate token if it doesn't exist
      if (!shareToken) {
        shareToken = await generateShareToken(id, 'unlisted')
      }
      
      await Share.share({
        message: `Check out my hadith collection on Authentic Hadith App`,
        url: `https://authentichadith.app/shared/${shareToken}`
      })
    } catch (error) {
      __DEV__ && console.error('Failed to share folder:', error)
      Alert.alert('Error', 'Failed to share folder. Please try again.')
    } finally {
      setIsGeneratingToken(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={folder?.name ?? 'Folder'}
        showBack
        right={
          <Button
            title="Share"
            onPress={handleShare}
            variant="outline"
            size="small"
            disabled={isGeneratingToken}
          />
        }
      />

      <FlatList
        data={hadiths}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => item.hadith && router.push(`/hadith/${item.hadith_id}`)}
          >
            {item.hadith ? (
              <>
                <HadithCard hadith={item.hadith} />
                {item.notes && (
                  <View style={[styles.notes, { backgroundColor: colors.card, borderLeftColor: colors.emeraldMid }]}>
                    <Text style={[styles.notesLabel, { color: colors.emeraldMid }]}>My Notes:</Text>
                    <Text style={[styles.notesText, { color: colors.bronzeText }]}>{item.notes}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.notes, { backgroundColor: colors.card, borderLeftColor: colors.emeraldMid }]}>
                <Text style={[styles.notesText, { color: colors.bronzeText }]}>Hadith not found</Text>
              </View>
            )}
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>No hadiths in this folder yet</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notes: {
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  notesLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  notesText: {
    fontSize: FONT_SIZES.base,
    lineHeight: 20,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
  },
})
