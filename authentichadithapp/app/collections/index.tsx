import React from 'react'
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useCollections } from '@/hooks/use-hadiths'
import { Ionicons } from '@expo/vector-icons'

export default function CollectionsScreen() {
  const router = useRouter()
  const { data: collections, isLoading } = useCollections()

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Hadith Collections' }} />
      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/collections/${item.id}`)}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="book" size={32} color="#1B5E43" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.collectionName}>{item.name_en}</Text>
                <Text style={styles.arabicName}>{item.name_ar}</Text>
                {item.description_en && (
                  <Text style={styles.description} numberOfLines={2}>
                    {item.description_en}
                  </Text>
                )}
                <Text style={styles.count}>
                  {item.total_hadiths?.toLocaleString() || 0} hadiths
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
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
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    backgroundColor: '#F8F6F2',
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
    color: '#333',
    marginBottom: 4,
  },
  arabicName: {
    fontSize: 14,
    color: '#1B5E43',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  count: {
    fontSize: 12,
    color: '#999',
  },
})
