import { Stack } from 'expo-router'

export default function StoriesLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Stories', 
          headerShown: true,
          headerBackTitle: 'Home' 
        }} 
      />
      <Stack.Screen 
        name="prophet/[slug]" 
        options={{ 
          title: 'Prophet Story',
          headerShown: true,
          headerBackTitle: 'Stories'
        }} 
      />
      <Stack.Screen 
        name="companion/[slug]" 
        options={{ 
          title: 'Companion Story',
          headerShown: true,
          headerBackTitle: 'Stories'
        }} 
      />
    </Stack>
  )
}
