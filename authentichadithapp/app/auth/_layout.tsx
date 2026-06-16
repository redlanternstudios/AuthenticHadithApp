import { Stack } from 'expo-router'

// FIX-086 — Hard-lock every auth screen to headerless.
// Without this group layout, expo-router registered `auth/login`, `auth/signup`,
// and `auth/forgot-password` directly on the ROOT stack. The root only declares
// `<Stack.Screen name="auth" />`, which matches a literal `auth/index` route, NOT
// the child screens — so each child fell through to the default header and leaked
// its raw route title (e.g. "auth/login"). That is an App Store 2.3.2 flag
// (inaccurate metadata / unpolished UI).
//
// `screenOptions={{ headerShown: false }}` makes it structurally impossible for ANY
// current or future auth screen to render a header — the per-screen entries below
// are belt-and-suspenders. This avoids mutating the three hard-locked auth screen
// files (see .claude/rules/forbidden-actions.md) entirely.
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
    </Stack>
  )
}
