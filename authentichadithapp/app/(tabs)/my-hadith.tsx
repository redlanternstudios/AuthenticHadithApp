import React from 'react'
import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useFolders } from '@/hooks/useMyHadith'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors'

export default function MyHadithScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: folders, isLoading } = useFolders()

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.authPromptContainer}>
          <Text style={styles.authPrompt}>Sign in to save and organize hadiths</Text>
          <Button 
            title="Sign In" 
            onPress={() => router.push('/auth/login')}
            variant="primary"
          />
        </View>
      </View>
    )
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Hadith</Text>
        <Button
          title="+ New Folder"
          onPress={() => router.push('/my-hadith/create-folder')}
          variant="primary"
        />
      </View>

      <FlatList
        data={folders}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <Pressable
            style={styles.folderCard}
            onPress={() => router.push(`/my-hadith/folder/${item.id}`)}
          >
            <Card variant="elevated">
              <View style={styles.cardContent}>
                <Text style={styles.folderIcon}>{item.icon}</Text>
                <Text style={styles.folderName}>{item.name}</Text>
                <Text style={styles.folderCount}>
                  {item.saved_hadiths_count || 0} hadiths
                </Text>
                {item.privacy === 'public' && (
                  <Text style={styles.publicBadge}>🌐 Public</Text>
                )}
              </View>
            </Card>
          </Pressable>
        )}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No folders yet</Text>
            <Text style={styles.emptySubtext}>Create your first folder to organize hadiths</Text>
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
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.bronzeText,
  },
  grid: {
    padding: SPACING.sm,
  },
  folderCard: {
    flex: 1,
    margin: SPACING.sm,
    minWidth: 150,
  },
  cardContent: {
    padding: SPACING.md,
  },
  folderIcon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  folderName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.bronzeText,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  folderCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedText,
    textAlign: 'center',
  },
  publicBadge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.emeraldMid,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  authPrompt: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.mutedText,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.bronzeText,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedText,
    textAlign: 'center',
  },
})
