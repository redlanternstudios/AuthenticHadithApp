import { Share, Alert, Platform } from 'react-native'
import * as Sharing from 'expo-sharing'
import { Hadith } from '../../types/hadith'
import { getCollectionDisplayName } from '../../lib/hadith/collectionDisplayName'

interface ShareSheetProps {
  hadith: Hadith
}

export async function shareHadith(hadith: Hadith) {
  // Static fallback only — share is a one-shot fire-and-forget so we don't
  // pull the React Query hook here. The static map in collectionDisplayName
  // covers the 8 production slugs.
  const reference = `${getCollectionDisplayName(hadith.collection_slug)} #${hadith.hadith_number}`
  const message = `${hadith.arabic_text}\n\n${hadith.english_text}\n\n— ${reference}\n\nShared from Authentic Hadith App\nauthentichadith://hadith/${hadith.id}`

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
    __DEV__ && console.error('Share error:', error)
  }
}

export function ShareSheet({ hadith }: ShareSheetProps) {
  // This component is not used directly, shareHadith function is exported
  return null
}
