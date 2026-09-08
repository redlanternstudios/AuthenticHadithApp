import { Stack } from 'expo-router'

export default function TopicsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[slug]" options={{ headerShown: false }} />
      <Stack.Screen name="tag/[slug]" options={{ headerShown: false }} />
    </Stack>
  )
}
