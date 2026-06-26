import { Share, Alert, Platform } from 'react-native'
import * as Sharing from 'expo-sharing'
import { Hadith } from '../../types/hadith'
import { getCollectionDisplayName, CollectionNameMap } from '../../lib/hadith/collectionDisplayName'

interface ShareSheetProps {
  hadith: Hadith
}

// FIX-118: accept optional collectionNames map from the calling React component
// so live DB names are used when available. Falls back to the 8-key STATIC_FALLBACK
// inside getCollectionDisplayName when collectionNames is undefined/missing the slug.
export async function shareHadith(hadith: Hadith, collectionNames?: CollectionNameMap) {
  const reference = `${getCollectionDisplayName(hadith.collection_slug, collectionNames)} #${hadith.hadith_number}`
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
