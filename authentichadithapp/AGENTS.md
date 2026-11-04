
## Penn Enterprises infrastructure policy
Read `../../../AGENTS.md` and `../../../.agents/skills/infrastructure-invariants/SKILL.md`.
Enforce `../../../knowledge/graph/guards/guard-six-pillar-invariants.md`; retain every stricter product gate below.


## Rule 045: Navigation Chrome & Header Invariant (Enforced by header-integrity-invariants.test.ts)
1. **Zero Double-Headers:** Any screen rendering a custom `<ScreenHeader />` MUST explicitly set `<Stack.Screen options={{ headerShown: false }} />` to suppress native iOS headers.
2. **Zero Raw Route Leaks:** Subdirectories with pushed routes (e.g. `stories/`, `my-hadith/`) MUST provide an explicit `_layout.tsx` defining human-readable `title` and `headerBackTitle` props.
3. **Automated Verification:** Any commit touching `app/` routes must run `npm test __tests__/navigation/header-integrity-invariants.test.ts` before build or deployment.

## Local Testing Authority

Inherit the root `AGENTS.md` SYS-MOD-022 Level A2 delegation and GUARD-TEST-IMMUTABILITY-001. Development-only routes, fixtures, synthetic sessions, and native `.mjs` runners are authorized for local test friction within the task scope. They do not satisfy release proof or permit changes to test files to force a pass.
