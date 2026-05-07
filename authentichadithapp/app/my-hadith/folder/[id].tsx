import React, { useState } from 'react'
import { StyleSheet, View, Text, FlatList, Pressable, Share, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useFolderHadiths, useUpdateFolder } from '@/hooks/useMyHadith'
import { useQuery } from '@tanstack/react-query'
import { generateShareToken } from '@/lib/api/my-hadith'
import { supabase } from '@/lib/supabase/client'
import { HadithCard } from '@/components/hadith/HadithCard'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors'
import type { HadithFolder } from '@/types/my-hadith'

export default function FolderDetailScreen() {
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
      console.error('Failed to share folder:', error)
      Alert.alert('Error', 'Failed to share folder. Please try again.')
    } finally {
      setIsGeneratingToken(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title="← Back"
          onPress={() => router.back()}
          variant="ghost"
        />
        <Button
          title="Share"
          onPress={handleShare}
          variant="outline"
          disabled={isGeneratingToken}
        />
      </View>

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
                  <View style={styles.notes}>
                    <Text style={styles.notesLabel}>My Notes:</Text>
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.notes}>
                <Text style={styles.notesText}>Hadith not found</Text>
              </View>
            )}
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hadiths in this folder yet</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingTop: SPACING.xl,
  },
  notes: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.emeraldMid,
  },
  notesLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.emeraldMid,
    marginBottom: SPACING.xs,
  },
  notesText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.bronzeText,
    lineHeight: 20,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.mutedText,
    textAlign: 'center',
  },
})
