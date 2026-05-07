import React, { useState } from 'react'
import { Modal, StyleSheet, View, Text, TextInput, FlatList, Pressable, Alert } from 'react-native'
import { useFolders, useSaveHadith } from '@/hooks/useMyHadith'
import { Button } from '@/components/ui/Button'
import { COLORS, SPACING, FONT_SIZES } from '@/lib/styles/colors'

interface Props {
  visible: boolean
  hadithId: string
  onClose: () => void
}

export function SaveHadithModal({ visible, hadithId, onClose }: Props) {
  const { data: folders = [] } = useFolders()
  const saveHadith = useSaveHadith()
  const [selectedFolder, setSelectedFolder] = useState<string>()
  const [notes, setNotes] = useState('')

  const handleSave = async () => {
    try {
      await saveHadith.mutateAsync({
        hadithId,
        folderId: selectedFolder,
        notes: notes.trim() || undefined
      })
      onClose()
      setNotes('')
      setSelectedFolder(undefined)
    } catch (error) {
      console.error('Failed to save hadith:', error)
      Alert.alert('Error', 'Failed to save hadith. Please try again.')
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Save Hadith</Text>

          <Text style={styles.label}>Select Folder (Optional)</Text>
          <FlatList
            data={folders}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.folderChip,
                  selectedFolder === item.id && styles.folderChipSelected
                ]}
                onPress={() => setSelectedFolder(item.id)}
              >
                <Text style={styles.folderIcon}>{item.icon}</Text>
                <Text style={styles.folderChipText}>{item.name}</Text>
              </Pressable>
            )}
            showsHorizontalScrollIndicator={false}
          />

          <Text style={styles.label}>Add Notes (Optional)</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Your thoughts on this hadith..."
            placeholderTextColor={COLORS.mutedText}
            multiline
            numberOfLines={4}
          />

          <View style={styles.actions}>
            <Button title="Cancel" onPress={onClose} variant="outline" />
            <Button 
              title="Save" 
              onPress={handleSave} 
              variant="primary"
              disabled={saveHadith.isPending}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.bronzeText,
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.bronzeText,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    marginRight: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  folderChipSelected: {
    borderColor: COLORS.emeraldMid,
  },
  folderIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  folderChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.bronzeText,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.bronzeText,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
})
