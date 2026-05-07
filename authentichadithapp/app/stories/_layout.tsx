import { Stack } from 'expo-router'

export default function StoriesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Stories', headerShown: true }} />
      <Stack.Screen name="prophet/[slug]" options={{ headerShown: true }} />
      <Stack.Screen name="companion/[slug]" options={{ headerShown: true }} />
    </Stack>
  )
}
