import { Stack } from 'expo-router'

/**
 * Layout for all screens under /my-hadith/.
 *
 * FIX-133: Without this file expo-router falls back to a default Stack that
 * renders a native header with the raw route string as title — e.g.
 * "my-hadith/folder/[id]" — visible in the nav bar header on the device.
 * Setting headerShown:false here removes that default header for every child
 * (create-folder, folder/[id], shared/[token]); each child uses its own
 * <ScreenHeader> component for the visual header.
 */
export default function MyHadithLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  )
}
