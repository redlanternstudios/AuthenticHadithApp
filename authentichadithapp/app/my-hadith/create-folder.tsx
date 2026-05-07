import React, { useState } from 'react'
import { StyleSheet, View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useCreateFolder } from '@/hooks/useMyHadith'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors'

const ICONS = ['📚', '⭐', '❤️', '🕌', '🤲', '📖', '✨', '🌙']
const COLORS_PALETTE = ['#D4A574', '#50C878', '#FF6B6B', '#4ECDC4', '#95E1D3']

export default function CreateFolderScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const createFolder = useCreateFolder()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📚')
  const [color, setColor] = useState('#D4A574')

  const handleCreate = async () => {
    if (!name.trim()) return

    try {
      await createFolder.mutateAsync({
        user_id: user!.id,
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        privacy: 'private',
        is_smart: false
      })
      router.back()
    } catch (error) {
      console.error('Failed to create folder:', error)
      Alert.alert('Error', 'Failed to create folder. Please try again.')
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button
          title="← Back"
          onPress={() => router.back()}
          variant="ghost"
        />
        <Text style={styles.title}>Create Folder</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Folder Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Prayer Hadiths"
          placeholderTextColor={COLORS.mutedText}
        />

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What's this folder about?"
          placeholderTextColor={COLORS.mutedText}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Choose Icon</Text>
        <View style={styles.iconGrid}>
          {ICONS.map((emoji) => (
            <Pressable
              key={emoji}
              style={[
                styles.iconOption,
                icon === emoji && styles.iconSelected
              ]}
              onPress={() => setIcon(emoji)}
            >
              <Text style={styles.iconEmoji}>{emoji}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Choose Color</Text>
        <View style={styles.colorGrid}>
          {COLORS_PALETTE.map((c) => (
            <Pressable
              key={c}
              style={[
                styles.colorOption,
                { backgroundColor: c },
                color === c && styles.colorSelected
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <Button
          title="Create Folder"
          onPress={handleCreate}
          variant="primary"
          disabled={!name.trim() || createFolder.isPending}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.bronzeText,
    marginTop: SPACING.sm,
  },
  form: {
    padding: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.bronzeText,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.bronzeText,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  iconOption: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  iconSelected: {
    borderColor: COLORS.emeraldMid,
  },
  iconEmoji: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: COLORS.bronzeText,
    borderWidth: 3,
  },
})
