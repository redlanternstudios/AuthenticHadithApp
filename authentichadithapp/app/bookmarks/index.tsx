import React from 'react'
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { useAuth } from '@/hooks/use-auth'
import { Ionicons } from '@expo/vector-icons'

export default function BookmarksScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: bookmarks, isLoading } = useBookmarks(user?.id)

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="lock-closed" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Please sign in to view bookmarks</Text>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: 'Bookmarks' }} />
        <View style={styles.centerContainer}>
          <Ionicons name="bookmark-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No bookmarks yet</Text>
          <Text style={styles.emptySubtext}>Start bookmarking hadiths to see them here</Text>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: `Bookmarks (${bookmarks.length})` }} />
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/hadith/${item.hadith_id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.collection}>{item.hadith?.collection?.name || 'Unknown'}</Text>
              <Ionicons name="bookmark" size={20} color="#1B5E43" />
            </View>
            <Text style={styles.hadithNumber}>Hadith #{item.hadith?.hadith_number}</Text>
            <Text style={styles.excerpt} numberOfLines={3}>
              {item.hadith?.english_text}
            </Text>
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
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  collection: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E43',
  },
  hadithNumber: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  excerpt: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
})
