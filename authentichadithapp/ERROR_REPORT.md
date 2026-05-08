# ERROR_REPORT.md — Authentic Hadith iOS App
## Active Bug Intake

> **PURPOSE**: Live error intake. Every Claude session reads this file FIRST. If Status is 🔴 ACTIVE, that is the current problem — fix it before doing anything else.

---

## CURRENT ERROR

**Status**: 🔴 ACTIVE — Three runtime errors blocking smoke test and TestFlight IPA

### Headline

The post-FIX-030 launch smoke test ran the dev client successfully (Metro bundled in 27.9s, deep link delivered, splash → JS load worked). But three runtime errors fire on first JS execution. The dev menu overlay shows "Log 2 of 3" and the underlying app is non-exercisable until the errors are resolved.

### What I Ran

```bash
cd /Users/kp/Projects/AuthenticHadithApp/authentichadithapp
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo start --dev-client &
open -a Simulator
xcrun simctl launch F5384F69-2BE1-40DC-806B-B4C45F03736A com.byred.authentichadith
xcrun simctl openurl F5384F69-2BE1-40DC-806B-B4C45F03736A \
  "exp+authentichadithapp://expo-development-client/?url=http://localhost:8081"
```

App launched, Metro bundle completed, then JS surfaced three errors.

---

### Error 1 of 3 — CRITICAL — Server route bundled into client, throws on module load

**File**: `app/api/chat/route.ts` line 6
**Severity**: Critical (blocks AI feature; will likely crash production IPA on first launch)
**Classification**: VS_CODE_APP_LAYER

**Error message**:
```
ERROR  [Error: GROQ_API_KEY environment variable is not configured. Please add it to your .env file.]

  5 | if (!process.env.GROQ_API_KEY) {
> 6 |   throw new Error('GROQ_API_KEY environment variable is not configured. Please add it to your .env file.')
```

**Source**:
```typescript
// app/api/chat/route.ts:1-11
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { checkInputSafety, ISLAMIC_ETHICS_ADDENDUM } from "../../../lib/islamic-safety-filter"

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is not configured. Please add it to your .env file.')
}

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})
```

**Root cause analysis**:

1. `app/api/chat/route.ts` is structured as a server route — uses `process.env.GROQ_API_KEY` (a server-only secret, not `EXPO_PUBLIC_*`).
2. The mobile app's `app.json` has `"extra.apiUrl": "https://authentichadith.app"` — confirming the mobile client should be calling the deployed Vercel server's `/api/*` routes, not running them locally.
3. Despite being a server route, Expo Router (SDK 54) is bundling `app/api/chat/route.ts` into the **client** JS bundle. The module-load `throw` then fires in the client because `process.env.GROQ_API_KEY` is undefined client-side (Expo only injects `EXPO_PUBLIC_*` vars into the client bundle).
4. No client file imports `api/chat` (verified via grep). Expo Router itself is crawling `app/` and including the route file.

**Why this matters for the IPA**:
- EAS production builds also exclude server-only env vars from the client bundle.
- If Expo Router still includes `app/api/chat/route.ts` in production, the `throw` fires on every fresh app launch in TestFlight or App Store.
- Production has no LogBox; the throw becomes an unhandled exception → app crashes on launch.

**Likely fixes (do NOT apply this session)**:
- Wrap the env check + Groq init inside the exported `POST`/`GET` handler so it only runs when the route is invoked on the server, not at module load.
- OR move `app/api/chat/route.ts` outside the `app/` tree (e.g., into a separate Vercel-only project) so Expo Router doesn't see it.
- OR configure Expo Router server features properly with `expo-router/server` so api routes are isolated from the client bundle.
- Audit all of `app/api/*` for the same module-load pattern — `app/api/chat/` is the only directory currently, so just this one file.

---

### Error 2 of 3 — HIGH — RevenueCat singleton not configured

**Severity**: High (subscriptions broken; App Store requires functioning subscription flow)
**Classification**: VS_CODE_APP_LAYER

**Error message**:
```
ERROR  RevenueCat initialization error:
  [Error: There is no singleton instance. Make sure you configure Purchases before
   trying to get the default instance. More info here: https://errors.rev.cat/configuring-sdk]

Call Stack
  UninitializedPurchasesError (node_modules/@revenuecat/purchases-typescript-internal/dist/errors.js:69:32)
```

**Root cause hypothesis**:

Some hook or screen calls `Purchases.getOfferings()` / `Purchases.getCustomerInfo()` BEFORE `Purchases.configure({ apiKey })` has run. Either:
- (a) The configure call lives in a provider that mounts after a child consumer
- (b) The configure call is itself blocked by Error 1 (if `lib/purchases/revenuecat.ts` ever imports anything that pulls in `app/api/chat/route.ts`, the module-load throw kills the chain before configure runs)
- (c) `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` is missing from `.env.local` (needs verification)

**Likely fixes (do NOT apply this session)**:
- Audit the RevenueCat provider mount order in `app/_layout.tsx`.
- Verify `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` is set in `.env.local`.
- Confirm Error 1 is fixed first — Error 2 may resolve once the module-load throw chain is broken.

---

### Error 3 of 3 — MEDIUM — Hermes lacks Intl.PluralRules

**Severity**: Medium (warning only, fallback works; localization quality reduced)
**Classification**: VS_CODE_APP_LAYER (polyfill in code)

**Error message**:
```
ERROR  i18next::pluralResolver: Your environment seems not to be Intl API compatible,
  use an Intl.PluralRules polyfill. Will fallback to the compatibilityJSON v3 format handling.
```

**Root cause**: Hermes (the JS engine used per `Podfile.properties.json: expo.jsEngine=hermes`) does not include full Intl support by default. i18next plural resolution falls back to its v3 format handling.

**Likely fixes (do NOT apply this session)**:
- `npx expo install intl-pluralrules` and import it once at the top of `app/_layout.tsx` or a polyfill file
- OR configure i18next explicitly with `compatibilityJSON: 'v3'` to suppress the warning

---

### Smoke Test Checklist Result

The 13-step UI smoke test from the prompt **could not be exercised** because Errors 1-3 surface as a LogBox dev menu overlay before the home screen is visible. Reported items:

| # | Step | Result |
|---|---|---|
| 1 | App opens, no red screen | ❌ FAIL — red error overlay |
| 2 | Home tab loads, no `[id]` text | ⏸ blocked by Error 1 |
| 3 | Bottom nav visible | ⏸ blocked |
| 4-8 | Tab switches | ⏸ blocked |
| 9 | Subscription paywall renders | ⏸ blocked + Error 2 |
| 10 | Notifications stub "coming soon" | ⏸ blocked |
| 11 | Delete Account reachable (Rule 014) | ⏸ blocked |
| 12 | Dark mode readable (Rule 017) | ⏸ blocked |
| 13 | 60s idle no crash | ⏸ blocked |

### Build State

- `ios/Pods/`, `ios/Podfile.lock`, both workspaces — intact
- `AuthenticHadith.app` installed on iPhone 17 Pro simulator (UDID `F5384F69-2BE1-40DC-806B-B4C45F03736A`)
- Bundle ID `com.byred.authentichadith` confirmed at install
- The native build itself is fine — this is JS / app-layer logic
- Metro killed cleanly after smoke test
- Working tree clean, stash@{0} preserved

### Constraints

- Do NOT install or upgrade packages without KP approval
- Do NOT run `expo prebuild --clean`
- Do NOT modify feature code in this session
- These errors block the IPA — they must be resolved before EAS production build

### Implication for IPA / TestFlight

**Do NOT cut an IPA yet.** Error 1 will likely crash the production app on launch. Error 2 breaks subscriptions which Apple requires functional. Both are in JS code that ships identically to dev and production.

The path forward:
1. Fix Error 1 (server route module-load throw)
2. Verify Error 2 resolves once Error 1 is fixed; if not, audit RevenueCat init order
3. Optionally fix Error 3 (Intl polyfill) — non-blocking but improves UX
4. Re-run smoke test — confirm all 13 checklist items
5. Run `npx eas build --platform ios --profile preview` to produce a TestFlight IPA
6. KP completes the manual Apple Developer Portal / App Store Connect / RevenueCat / Supabase / privacy policy tasks
7. Submit to TestFlight via `npx eas submit`

### Recommended Next Session Prompt (for KP to send)

> "You are the Senior iOS Release Engineer. ERROR_REPORT.md status is 🔴 with three runtime errors blocking the smoke test and IPA submission. Read ERROR_REPORT.md, then:
> 1. Fix Error 1 by moving the GROQ_API_KEY env check + Groq init inside the exported route handler in `app/api/chat/route.ts` so it only runs when the route is invoked, not at module load. Verify the fix by re-running the smoke test (Metro + simctl launch).
> 2. After Error 1 is fixed, observe whether Error 2 (RevenueCat singleton) still fires. If yes, audit `lib/purchases/revenuecat.ts` and `app/_layout.tsx` for the provider mount order and `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` env presence.
> 3. Optionally resolve Error 3 with `npx expo install intl-pluralrules` and import it in `app/_layout.tsx`.
> 4. Re-run the 13-step smoke test. Document each fix with FIX-031 / FIX-032 / FIX-033 entries in BUILD_FIX_LOG.md. Reset ERROR_REPORT.md to 🟢 only when all three errors are gone and the smoke test passes."

---

## INSTRUCTIONS FOR CLAUDE (NEXT SESSION)

1. Read this file FIRST.
2. The three errors above are blockers. Fix in order: Error 1 → re-test → Error 2 if still present → Error 3.
3. Do NOT cut an EAS IPA until smoke test passes cleanly.
4. After resolution, log each fix to BUILD_FIX_LOG.md and reset this file to 🟢.
