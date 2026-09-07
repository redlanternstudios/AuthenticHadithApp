import { Stack } from 'expo-router'

export default function MyHadithLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="create-folder" options={{ headerShown: false }} />
      <Stack.Screen name="folder/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="shared/[token]" options={{ headerShown: false }} />
    </Stack>
  )
}
