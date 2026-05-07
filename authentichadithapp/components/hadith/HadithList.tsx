import React from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { HadithCard } from './HadithCard'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Hadith } from '../../types/hadith'
import { COLORS, SPACING, FONT_SIZES } from '../../lib/styles/colors'

interface HadithListProps {
  hadiths: Hadith[]
  isLoading?: boolean
  onHadithPress?: (hadith: Hadith) => void
  onEndReached?: () => void
  emptyMessage?: string
}

export function HadithList({ 
  hadiths, 
  isLoading, 
  onHadithPress,
  onEndReached,
  emptyMessage = 'No hadiths found'
}: HadithListProps) {
  if (isLoading && hadiths.length === 0) {
    return <LoadingSpinner />
  }

  if (!isLoading && hadiths.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={hadiths}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <HadithCard 
          hadith={item} 
          onPress={onHadithPress ? () => onHadithPress(item) : undefined}
          compact
        />
      )}
      contentContainerStyle={styles.listContent}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={isLoading ? <LoadingSpinner /> : null}
    />
  )
}

const styles = StyleSheet.create({
  listContent: {
    padding: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.mutedText,
    textAlign: 'center',
  },
})
