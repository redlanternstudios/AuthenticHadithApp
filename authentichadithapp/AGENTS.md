
## Rule 045: Navigation Chrome & Header Invariant (Enforced by header-integrity-invariants.test.ts)
1. **Zero Double-Headers:** Any screen rendering a custom `<ScreenHeader />` MUST explicitly set `<Stack.Screen options={{ headerShown: false }} />` to suppress native iOS headers.
2. **Zero Raw Route Leaks:** Subdirectories with pushed routes (e.g. `stories/`, `my-hadith/`) MUST provide an explicit `_layout.tsx` defining human-readable `title` and `headerBackTitle` props.
3. **Automated Verification:** Any commit touching `app/` routes must run `npm test __tests__/navigation/header-integrity-invariants.test.ts` before build or deployment.
