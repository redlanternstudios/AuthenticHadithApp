import React from 'react'
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useCollections } from '@/hooks/use-hadiths'
import { Ionicons } from '@expo/vector-icons'
import { getColors } from '@/lib/styles/colors'
import { FONT_FAMILY } from '@/constants/theme'

export default function CollectionsScreen() {
  const router = useRouter()
  const { data: collections, isLoading } = useCollections()
  const isDark = useColorScheme() === 'dark'
  const colors = getColors(isDark)

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.emeraldMid} />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Hadith Collections' }} />
      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { backgroundColor: colors.background }]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/collection/${item.slug}`)}
            accessibilityLabel={`Open ${item.name_en} collection`}
            accessibilityRole="button"
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="book" size={32} color={colors.emeraldMid} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.collectionName, { color: colors.bronzeText, fontFamily: FONT_FAMILY.headingMedium }]}>{item.name_en}</Text>
                <Text style={[styles.arabicName, { color: colors.emeraldMid }]}>{item.name_ar}</Text>
                {item.description_en && (
                  <Text style={[styles.description, { color: colors.mutedText }]} numberOfLines={2}>
                    {item.description_en}
                  </Text>
                )}
                <Text style={[styles.count, { color: colors.mutedText }]}>
                  {item.total_hadiths?.toLocaleString() || 0} hadiths
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.border} />
            </View>
          </TouchableOpacity>
        )}
      />
    </>
  )
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  arabicName: {
    fontSize: 14,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    marginBottom: 4,
  },
  count: {
    fontSize: 12,
  },
})
