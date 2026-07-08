import { Ionicons } from '@expo/vector-icons'
import { Stack, useRouter } from 'expo-router'
import { Pressable } from 'react-native'
import { FONT_FAMILY } from '@/constants/theme'
import { getColors } from '@/lib/styles/colors'
import { useTheme } from '@/lib/theme/ThemeProvider'

export default function StoriesLayout() {
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getColors(isDark)

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.goldMid,
        headerTitleStyle: {
          color: colors.bronzeText,
          fontFamily: FONT_FAMILY.heading,
        },
        headerShadowVisible: false,
        headerLeft: () => (
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)/more'))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ minWidth: 74, height: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.goldMid} />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/(tabs)')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go to Home"
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="home" size={20} color={colors.goldMid} />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Stories', headerShown: true }} />
      <Stack.Screen name="prophet/[slug]" options={{ headerShown: true }} />
      <Stack.Screen name="companion/[slug]" options={{ headerShown: true }} />
    </Stack>
  )
}
