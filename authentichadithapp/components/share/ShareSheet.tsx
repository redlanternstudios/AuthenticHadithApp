import React from 'react'
import { Share, Alert, Platform } from 'react-native'
import * as Sharing from 'expo-sharing'
import { Hadith } from '../../types/hadith'

interface ShareSheetProps {
  hadith: Hadith
}

export async function shareHadith(hadith: Hadith) {
  const message = `${hadith.arabic_text}\n\n${hadith.english_text}\n\n— ${hadith.collection_slug} ${hadith.hadith_number}\n\nShared from Authentic Hadith App\nauthentichadith://hadith/${hadith.id}`

  try {
    if (Platform.OS === 'web') {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(message)
      } else {
        // Fallback for web
        await Share.share({ message })
      }
    } else {
      await Share.share({
        message,
        title: `Hadith ${hadith.hadith_number}`,
      })
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to share hadith')
    console.error('Share error:', error)
  }
}

export function ShareSheet({ hadith }: ShareSheetProps) {
  // This component is not used directly, shareHadith function is exported
  return null
}
