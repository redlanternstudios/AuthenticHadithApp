# SYSTEM_RULES.md

# Authentic Hadith Engineering System Rules

## Purpose

This document defines the permanent engineering rules for the Authentic Hadith app and all future mobile applications built from this process.

The purpose is to prevent recurring bugs, standardize debugging, preserve institutional knowledge, and make each future app build faster, cleaner, and easier to execute.

Every coding agent, developer, or AI assistant working on this project must read this file before making changes.

---

# Core Principle

No issue is considered fully fixed until:

1. The root cause is identified.
2. The exact files changed are documented.
3. The fix is verified through a build or test.
4. The lesson is added to `BUILD_FIX_LOG.md`.
5. Any recurring pattern is converted into a permanent rule.

---

# Required Debugging Flow

## Step 1: Capture the Error

All active errors must be documented in:

`ERROR_REPORT.md`

Required fields:

- Current goal
- Command or action that triggered the error
- Full error output
- Files likely involved
- What has already been attempted
- Current environment details

---

## Step 2: Diagnose Before Editing

No file should be changed until the root cause is identified.

The debugging agent must determine whether the issue is related to:

- Database schema
- Supabase query logic
- Xcode/iOS build configuration
- Expo plugin configuration
- RevenueCat configuration
- Environment variables
- Missing route or screen
- Authentication/session state
- Dependency mismatch
- Production vs sandbox/test configuration

---

## Step 3: Apply the Smallest Safe Fix

The fix must be minimal, targeted, and reversible.

Do not rewrite large parts of the application unless the existing structure is proven to be the root cause.

---

## Step 4: Verify the Fix

A fix is not complete until one of the following succeeds:

- App runs locally
- iOS simulator opens without error
- Xcode build succeeds
- Expo command completes successfully
- Target feature works in-app
- TestFlight build succeeds

---

## Step 5: Document the Fix

Every completed fix must be added to:

`BUILD_FIX_LOG.md`

Each entry must include:

- Fix ID
- Date
- Problem
- Root cause
- Files changed
- Exact fix
- Verification method
- Lesson learned
- Related recurring pattern

---

# Permanent Engineering Rules

## Rule 001: Database Column Name Consistency

Database column mismatches are a known recurring issue.

Before changing, renaming, or referencing any Supabase column, confirm consistency across:

- Supabase table schema
- Generated Supabase types
- Query files
- UI components
- Join logic
- Seed data
- Test data
- Documentation

No database-related change is complete until all references have been checked.

---

## Rule 002: Supabase Query Standardization

All Supabase queries must follow established project patterns.

Before creating a new query:

1. Check existing working queries.
2. Reuse proven query structure.
3. Avoid unverified PostgREST foreign key joins.
4. Confirm table relationships exist in Supabase.
5. Test the query independently before wiring it into UI.

If a query fails, check schema and relationship structure before blaming the frontend. Very advanced concept, apparently.

---

## Rule 003: RevenueCat Single Source of Truth

RevenueCat configuration must not be scattered across the app.

All RevenueCat values must come from a centralized config file.

This includes:

- API keys
- Entitlement IDs
- Offering IDs
- Package IDs
- Sandbox/test settings
- Production settings

Hardcoded RevenueCat values inside screens, components, or hooks are prohibited.

---

## Rule 004: No Production Test Keys

Before any TestFlight or App Store build, search the entire repo for:

- test key
- sandbox
- mock
- placeholder
- hardcoded
- demo
- fake
- sample

No production build may include test credentials, mock values, or hardcoded temporary keys.

---

## Rule 005: Required Stub Screens

All navigation routes must point to real screens.

If a feature is not ready, create a clean stub screen instead of leaving the route broken.

Every route must have:

- Valid file path
- Exported component
- Safe fallback UI
- No broken imports
- No placeholder crash logic

---

## Rule 006: Build Config Changes Must Be Documented

Any change to build configuration must be documented immediately.

This includes changes to:

- `app.json`
- `app.config.js`
- `package.json`
- Expo plugins
- iOS folder
- Xcode project settings
- Bundle ID
- Version number
- Build number
- Environment variables

Build config changes are high-risk because one tiny setting can ruin an entire afternoon, as Apple intended.

---

## Rule 007: Dependency Changes Require Verification

No package may be added, removed, upgraded, or downgraded without verification.

Required checks:

- Package is compatible with current Expo SDK
- Package supports iOS
- Package does not require unsupported native config
- App still runs after install
- Lockfile changes are reviewed

Major dependency upgrades must be treated as separate tasks.

---

## Rule 008: Environment Variables Must Be Centralized

All environment variables must be documented in:

`.env.example`

Never rely on hidden local-only configuration.

Required documentation:

- Variable name
- Purpose
- Required or optional
- Development value format
- Production value source

Secrets must never be committed to GitHub.

---

## Rule 009: Every Recurring Bug Becomes a Rule

If the same category of bug appears more than once, it must be converted into a permanent rule inside this file.

A recurring bug is not just a bug.

It is a system failure wearing a different hat.

---

## Rule 010: The Hadiths Table Has Zero Foreign Keys

The `hadiths` table is a flat table with NO foreign key relationships.

This rule exists because this single fact caused 3 separate production failures (FIX-011, FIX-012, FIX-014).

Prohibited:
- `.select('*, collection:collections(*)')` on hadiths — will fail
- `.select('*, book:books(*)')` on hadiths — will fail
- Any PostgREST FK join syntax targeting hadiths as the source table

Required:
- Always use `.select('*')` on hadiths
- Filter by `collection_slug` and `book_number` (not collection_id, not book_id)
- For chapter context: chapter → book (book_id) → collection (collection_id) → hadiths (collection_slug + book_number)

Valid FK joins TO hadiths from other tables:
- `saved_hadiths.hadith_id → hadiths.id` (valid)
- `hadith_views.hadith_id → hadiths.id` (valid)

---

## Rule 011: PostgREST Fails Silently on Bad Column Names

PostgREST does NOT throw errors when you filter on a column that does not exist. It silently returns zero results.

This caused FIX-016: search used `english_translation` instead of `english_text`, and returned nothing for English queries with no error message.

Required:
- After writing any Supabase `.or()`, `.eq()`, `.ilike()`, or `.filter()` call, verify every column name against the actual table schema
- If a query returns zero results unexpectedly, check column names first
- Test search and filter features manually after any query change

---

## Rule 012: Mandatory Documentation Protocol

After completing any fix, the following documentation updates are required:

1. Update `BUILD_FIX_LOG.md` with full entry (Fix ID, date, root cause, files changed, exact fix, verification, lesson, pattern category)
2. Check whether this issue matches an existing recurring pattern in the Pattern Tracker
3. If the bug category has appeared 2 or more times: update this file (`SYSTEM_RULES.md`) with a new permanent rule or strengthen an existing one
4. If deployment or architecture behavior changed: update `APP_LAUNCH_PLAYBOOK.md`
5. If new operational guidance is discovered: update `CLAUDE.md` onboarding instructions
6. Update project memory so future sessions have context

No debugging task is complete until all applicable documentation is updated.

The system must improve after every fix.

---

## Rule 013: Coding Agent Must Read Project Memory First

Before making changes, every AI coding agent must read:

1. `CLAUDE.md` — onboarding and session protocol
2. `ERROR_REPORT.md` — active bugs (fix these first)
3. `BUILD_FIX_LOG.md` — historical fixes and Golden Rules
4. `SYSTEM_RULES.md` — permanent engineering rules
5. `WORKFLOW_ROUTER.md` — tool routing (VS Code vs Expo vs Xcode)
6. `APP_LAUNCH_PLAYBOOK.md` — build process and config reference

No agent should start editing files without first reviewing project memory.

---

## Rule 014: Every Screen Must Have a Navigation Path

After creating any new screen file in the `app/` directory, at least one navigation path must be wired to it from an existing screen.

This caused 4 separate issues (FIX-003, 005, 017, 020). Screens were created but never linked from buttons or menus, making them invisible to users.

Required verification before submission:
1. List all route files in `app/`
2. For each route, grep for at least one `router.push` or `Link` reference pointing to it
3. Any route with zero references is an orphan — either wire it or delete it

Apple-specific: account deletion (Guideline 5.1.1) and subscription management MUST be reachable. Orphan screens in these areas cause rejection.

---

## Rule 015: Async useEffect Must Have Error Handling

Every async function called inside `useEffect` must be wrapped in `try/catch/finally` or have a `.catch()` handler.

This caused 2 production failures (FIX-019, FIX-004). Unhandled promise rejections in useEffect cause infinite spinners, crash warnings, or blank screens.

Required pattern:
```typescript
useEffect(() => {
  (async () => {
    try {
      // async work
    } catch (err) {
      // set error state
    } finally {
      setLoading(false);
    }
  })();
}, []);
```

---

## Rule 016: No Template Boilerplate in Production

After scaffolding with Expo or any template, immediately audit and remove all template files.

This caused 2 issues (FIX-005, 018). Default Expo template screens (modal.tsx with "This is a modal", ThemedText, react-logo assets) shipped to production, signaling an unfinished app to Apple reviewers.

Check for and remove:
- `modal.tsx` with default content
- `ThemedText` / `ThemedView` components from template
- `react-logo.png` and variant assets in `assets/images/`
- Any screen with "This is a" placeholder text

---

## Rule 017: Dark Mode Must Use getColors(isDark), Never Static COLORS

The `COLORS` export equals `LIGHT_COLORS` always (line 98 of colors.ts). Any screen importing `COLORS` directly is permanently broken in dark mode.

This caused FIX-024: 6 screens were unreadable in dark mode because they used static `COLORS` instead of the theme-aware `getColors(isDark)` function.

Required pattern for every screen:
```typescript
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';

// In component:
const { isDark } = useTheme();
const colors = getColors(isDark);

// In JSX — inline color styles, NOT in StyleSheet:
<View style={[styles.container, { backgroundColor: colors.background }]}>
```

Prohibited:
- `import { COLORS } from '@/lib/styles/colors'` in any screen component
- Color values in `StyleSheet.create()` — they cannot react to theme changes
- Hardcoded hex values (#fff, #333, etc.) — use the color system

After creating any new screen, verify it uses `useTheme()` + `getColors(isDark)`.

---

## Rule 018: Console Statements Must Be Gated Behind __DEV__

React Native's `__DEV__` flag is false in production builds. Console statements without this guard leak to device logs and waste cycles.

This caused FIX-023: 19 console.warn/error statements shipped to production.

Required pattern:
```typescript
__DEV__ && console.error('Debug info:', error)
```

Exceptions (keep ungated):
- `ErrorBoundary` componentDidCatch (standard React pattern)
- Server-side API routes (app/api/) — these run on the server, not the device
- Dev-only scripts (scripts/) — never bundled into production

Before any App Store build, run:
```
grep -rn 'console\.' --include='*.ts' --include='*.tsx' lib/ app/ components/ | grep -v '__DEV__' | grep -v ErrorBoundary | grep -v 'api/'
```

---

## Rule 019: User-Facing Limits Must Be Enforced, Not Cosmetic

If the UI shows a usage limit (quota, rate limit, trial counter), the enforcement must be real. A cosmetic counter with no backend or storage is worse than no counter.

This caused FIX-022: AI quota showed 3/3 remaining but `useState(0)` reset on every app restart. Users could send unlimited messages.

Required for any usage limit:
1. Persist count to AsyncStorage (or Supabase) with a date key for resets
2. Load persisted count on mount — do not start from zero
3. Check limit BEFORE the action (not after)
4. Failed actions must NOT consume quota
5. Premium users must bypass the limit
6. Disable the action UI (button, input) when limit is reached
7. Show clear upgrade path when limit is hit

---

## Rule 020: Classify Before Acting — Use the Workflow Router

Every issue must be classified before any file is edited or any command is run. See `WORKFLOW_ROUTER.md` for the full protocol.

Classification must be exactly one of:
- `VS_CODE_APP_LAYER` — JS, TS, UI, Supabase, RevenueCat logic, theming, app copy
- `EXPO_HYBRID_LAYER` — Expo plugin, app.json/app.config.js, native dependency, prebuild config, EAS profile
- `XCODE_NATIVE_LAYER` — provisioning, signing, archive, pods, linker, Swift/ObjC, native crash, entitlements
- `UNKNOWN_NEEDS_TRIAGE` — read logs and history before opening any tool

Required output before any fix:
```
Classification:
Reason:
Correct tool:
Likely files:
First safe action:
Risk level:
Verification step:
Documentation update:
```

Default tool is VS Code. Xcode is only used when the failure is provably native and unfixable from the Expo config layer. The `ios/` directory is generated by `expo prebuild` — edits there are erased on the next regeneration unless mirrored back into Expo config.

This rule exists to stop wasted time bouncing between tools and to prevent destructive native regenerations from being run casually.

---

## Rule 021: Verify a Package Ships an Expo Config Plugin Before Registering It

Every package with native iOS code (entitlements, frameworks, permissions, capabilities) must be wired into the native target. Some packages do this through an Expo config plugin registered in `app.json` `expo.plugins`. Others do it purely through React Native autolinking with capabilities enabled externally (Apple Developer portal, App Store Connect). **Adding a package to `expo.plugins` without first verifying the package actually exports a config plugin will break every EAS build and every local prebuild.**

This rule exists because of FIX-026 (added `react-native-purchases` to `expo.plugins` based on a wrong assumption) and FIX-027 (the resulting EAS build failure with `Unable to resolve a valid config plugin for react-native-purchases`). The package does not ship a config plugin. The IAP capability is enabled through Apple Developer portal, not through Expo plugin registration.

### Mandatory pre-flight before adding ANY entry to `expo.plugins`

Run all three checks. If any fail, **do not add the entry**.

1. **`app.plugin.js` exists at the package root**
   ```bash
   ls node_modules/<package>/app.plugin.js
   ```
2. **OR the package's `package.json` has an `expo` field pointing to a plugin**
   ```bash
   node -e "console.log(require('./node_modules/<package>/package.json').expo)"
   ```
3. **OR the package documentation explicitly says "add to expo.plugins"** (link required in BUILD_FIX_LOG entry)

If none of those are true, **the package autolinks via React Native's standard mechanism** and any required iOS capability is enabled externally:
- Apple Developer portal (capabilities tab on the App ID)
- App Store Connect (in-app purchases, sign in with Apple, etc.)
- Manual `infoPlist` keys in `app.json.expo.ios.infoPlist`

### Mandatory post-edit verification

After any change to `expo.plugins`, run:
```bash
npx expo config --json > /dev/null
echo "exit code: $?"
```
A non-zero exit code means a plugin entry is invalid. Revert immediately. Do not commit a config that fails this check.

### Common packages and how they wire in

| Package | Mechanism | Plugin entry needed? |
|---|---|---|
| `react-native-purchases` (RevenueCat 9.x) | Autolink + Apple Dev portal IAP capability | NO |
| `expo-notifications` | Expo config plugin | YES (auto via `npx expo install`) |
| `expo-secure-store` | Expo config plugin | YES |
| `expo-tracking-transparency` | Expo config plugin | YES |
| `expo-camera`, `expo-location`, `expo-media-library` | Expo config plugin | YES |
| `expo-build-properties` | Expo config plugin | YES |

### Required for any release audit

1. For every entry in `expo.plugins`, confirm the package ships a plugin (run the pre-flight checks above).
2. For every native package in `package.json`, identify which capability mechanism it uses (plugin, autolink, or manual). If autolink + external capability, document in BUILD_FIX_LOG which Apple Developer portal toggle is required.
3. Orphan entitlements in `ios/<App>/<App>.entitlements` (entitlements without a corresponding plugin or manual config) must be cleaned via `expo prebuild --clean` after the source plugin is removed.

---

## Rule 022: CocoaPods Requires UTF-8 Locale Before iOS Native Install

Before running `pod install`, `npx expo run:ios`, `npx expo prebuild` (which runs pod install), or any local EAS iOS build, the shell environment MUST have a UTF-8 locale set. CocoaPods (specifically `Pod::Config#installation_root`) calls `String#unicode_normalize`, which throws `Encoding::CompatibilityError: Unicode Normalization not appropriate for ASCII-8BIT` if `LANG` and `LC_ALL` are unset or set to `C`/`POSIX`.

This caused FIX-028: prebuild's pod install step failed with a Ruby encoding error during iOS regeneration. The error was misleading — it looks like a CocoaPods or Ruby version bug, but the actual cause is an unset shell locale. KP's terminal had `LANG=""` and `LC_ALL=""`, falling back to `C` (ASCII).

### Required before any iOS native install

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

For permanent fix, add to `~/.zshrc` or `~/.bashrc`:
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

### Diagnostic

```bash
locale                  # All LC_* should be UTF-8, not "C"
echo $LANG              # Must not be empty
echo $LC_ALL            # Must not be empty
pod --version           # If this prints the UTF-8 warning, locale is broken
```

CocoaPods itself prints a warning when locale is wrong:
```
WARNING: CocoaPods requires your terminal to be using UTF-8 encoding.
Consider adding the following to ~/.profile: export LANG=en_US.UTF-8
```
That warning is the canary. Treat it as a build blocker, not a warning.

### Do not blame Expo or CocoaPods first

When pod install fails with a Ruby encoding error, the diagnosis order is:
1. Locale (LANG / LC_ALL)
2. Workspace state (corrupted `ios/` from interrupted prebuild → `expo prebuild --clean`)
3. Ruby/CocoaPods version mismatch (only after 1 and 2 are confirmed clean)

Reinstalling Ruby, reinstalling CocoaPods, or running `expo prebuild --clean` casually wastes 30+ minutes when the actual fix is a one-line export. SYSTEM_RULES Rule 020 still applies: classify before acting.

---

## Rule 023: No Module-Load Throws for Missing Env Vars

A module-load `throw` (a top-level statement that throws when an env var is missing) crashes every consumer of that module the moment it is imported. In an Expo Router app, every file under `app/` is bundled into the client JS regardless of whether the file is intended for client or server execution. Server-only secrets (`GROQ_API_KEY`, `STRIPE_SECRET_KEY`, etc.) are never present in the client bundle, so the throw fires on every device launch.

This caused FIX-031 Error 1: `app/api/chat/route.ts:6` threw at module load, crashing the React Native bundle before any screen rendered.

### Required pattern

Move env validation INSIDE the request handler / function runtime so it only runs when the route or function is actually invoked.

```typescript
// ❌ BAD — throws at module import time
if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not configured.')
}
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

// ✅ GOOD — env check runs only when handler is invoked on the server
export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: 'AI assistant unavailable',
        details: 'The AI assistant is temporarily unavailable. Please try again later.' },
      { status: 503 }
    )
  }
  const groq = createGroq({ apiKey })
  // ... rest of handler
}
```

### Audit checklist

For every file in `app/api/**`:
- No top-level `throw` statements
- No top-level construction of clients that require server-only secrets
- All env reads happen inside exported handler functions

For every file in `lib/**` that reads `process.env`:
- The read is inside a function, not at module top level, OR
- The read is for an `EXPO_PUBLIC_*` var guaranteed to be in the client bundle, OR
- The fallback path is non-throwing

---

## Rule 024: SDK Singletons Must Never Be Called Before Configure Succeeds

Native SDKs that expose default-instance / singleton accessors (RevenueCat `Purchases`, Stripe, Sentry, Firebase) throw if any default-instance method is called before the SDK's explicit `configure()` (or equivalent) has succeeded.

This caused FIX-031 Error 2: `RevenueCatProvider` called `Purchases.getCustomerInfo()` before any code called `Purchases.configure()`. Result: "There is no singleton instance" runtime error.

### Required pattern for any SDK singleton

1. **One configure path.** If the project has both a React provider and a non-React helper for the same SDK, the provider MUST route through the helper so both share one `isConfigured` source of truth. Do not duplicate the configure call.
2. **Track configured state explicitly.** Expose `isConfigured` on the provider context so consumers can branch.
3. **Gate every default-instance call.** No SDK default-instance method may run before `isConfigured === true`.
4. **Degrade gracefully.** If the API key is missing in dev, set degraded state — do NOT throw, do NOT redbox.
5. **Isolate data-fetch failures from configure failures.** Wrap each post-configure network call in its own try/catch. Configure failures are real bugs; data fetch failures may be expected (simulator without StoreKit Config, no products configured yet).
6. **Listener attach is also a default-instance call.** Attach inside the same code path that runs after a successful configure.

---

## Rule 025: Optional Services Degrade Gracefully When Env Keys Are Missing

Apps must launch successfully in dev environments that lack non-essential service credentials. Subscriptions, AI, analytics, push, and any other optional service must NOT crash startup, redbox the screen, or block navigation when its API key is missing.

This caused FIX-031 across all three errors: each service treated its env var as mandatory at module-load time.

### Required behavior for any optional service provider

| Condition | Required behavior |
|---|---|
| API key present, configure succeeds | Service runs normally |
| API key missing | Provider sets degraded state. No throw. No redbox. `__DEV__ && console.warn` only. |
| API key present but configure throws | Provider catches, sets `error` state. Logs `__DEV__ && console.error` once. No redbox. |
| Post-configure data fetch fails | Provider catches per-call, leaves other state intact. `__DEV__ && console.warn`. No redbox. |
| Consumer asks "is this service available?" | Provider answers truthfully via `isConfigured` flag. UI shows "unavailable" affordance. |

### What MUST NOT happen on app startup in dev

- Red error overlay (LogBox redbox)
- Hard crash / app freeze
- Repeated infinite retry loops
- Console error noise that drowns out real errors

A clean dev startup is the baseline. If it fails because of missing optional credentials, treat it as a Rule 025 violation.

---

## Rule 031: Validate `package-lock.json` JSON Before Diagnosing EAS Install Failures

When EAS Build's "Install dependencies" phase fails with the opaque CLI message *"Unknown error. See logs of the Install dependencies build phase for more information"*, the first diagnostic step is ALWAYS:

```bash
python3 -c "import json; json.load(open('package-lock.json'))"
```

If that errors, the lockfile JSON is corrupted and EAS's `npm ci` can't parse it. Fix by regenerating:

```bash
rm package-lock.json
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm install --ignore-scripts
```

This caused FIX-034: two EAS builds were burned guessing at JS source / orphan-import issues before KP pasted the actual EAS web log, which immediately surfaced the lockfile parse error.

### Why local tooling misses this

| Tool | Behavior on corrupted lockfile |
|---|---|
| `npm install` | Lenient — falls back to cached `node_modules` and may not error |
| `npm install --dry-run` | Lenient — reports "up to date" if cache is consistent |
| `npx tsc --noEmit` | Doesn't read the lockfile |
| `npx expo-doctor` | Doesn't validate lockfile JSON syntax |
| Metro bundler | Doesn't read the lockfile |
| `npm ci` (what EAS uses) | **Strict** — aborts immediately on JSON parse failure |

A lockfile that "works locally" can still be invalid JSON. EAS catches this; everything else hides it.

### Required diagnostic order for EAS install-dependencies failures

1. `python3 -c "import json; json.load(open('package-lock.json'))"` — JSON validity
2. `python3 -c "import json; json.load(open('package.json'))"` — same for package.json
3. `npx eas-cli build:view <build-id>` — get the EAS web URL
4. Open the web URL, expand "Install dependencies" phase, copy the failure tail
5. Match the failure to a known cause:
   - Lockfile parse error → regenerate
   - Missing peer dependency → install or downgrade
   - Postinstall script failure → check the package's install hooks
   - Out-of-disk / out-of-memory on EAS worker → retry, or escalate to Expo support

### Forbidden

- Re-running the EAS build with no diagnostic between attempts (wastes credits, no learning)
- Guessing at JS-source causes when the failure is in the install phase (different layer)
- Trusting `npm install --dry-run` "up to date" output as proof of lockfile health

---

## Rule 029: Web-to-Mobile Feature Ports Require an Audit Before Implementation

Any task framed as "port the website feature to mobile" or "replicate the web version in mobile" MUST start with a documented parity audit (`WEB_TO_MOBILE_PARITY_AUDIT.md` style) before any code is written.

This caused FIX-033 efficiency: the original premise was *"the website has Sunnah/Summarize/etc. that mobile is missing,"* but the committed web source actually had NO Sunnah page and ZERO summarize references. The mobile app was already at parity or ahead. Without the audit step, dev time would have been spent migrating non-existent web code or building duplicates of features that already exist in mobile.

### Required audit checklist

Before writing any port code:
1. Locate the canonical web source (this repo: `external/v0-authentic-hadith/`)
2. `grep -rln <feature>` across both web and mobile trees
3. Read the actual route/component files on both sides
4. Build a parity table: feature, web status, mobile status, gap classification (Critical / High / Medium / Polish / Deferred / Already-implemented)
5. Identify the minimal real work needed
6. Only then start coding

### Forbidden

- Assuming the web is a superset of mobile without verification
- Migrating data from "the live website" via scraping (use the committed source or production DB)
- Hardcoding sample/placeholder content as if it were real seed data without flagging it
- Faking content counts in the UI

---

## Rule 030: Optional Remote Content Must Have a Local Fallback

Any screen whose primary content comes from a Supabase table the user did not author MUST have a bundled local fallback dataset for first launch, network outage, or unseeded-DB scenarios.

This caused FIX-033: the Sunnah screen was empty when Supabase tables didn't exist. The fix shipped `lib/sunnah/sunnahFallbackData.ts` (35 curated practices, 7 categories, every entry with hadith reference) and made the screen prefer live data when ≥1 row is returned, falling back to bundled data otherwise.

### Required pattern

```typescript
const liveCount = liveData?.length ?? 0
const usingFallback = !isLoading && liveCount === 0
const effectiveData = usingFallback ? FALLBACK_DATASET : (liveData || [])
```

The fallback dataset must:
- Live in `lib/<feature>/<feature>FallbackData.ts`
- Use stable ids that don't collide with live rows (prefix with `<feature>-` is good)
- Cite real sources where applicable (hadith_ref, etc.)
- Have a DEV-only duplicate-id check at module load
- Match the shape of the live data so consumers don't branch on which source is rendering

### Doesn't apply

- Authenticated-user-specific data (bookmarks, progress, customer info) — that's local-first via the progress service or AsyncStorage, not a "fallback" in this sense
- Truly transient data (search results, AI responses, etc.) — degrade with a friendly empty state instead

---

## Rule 026: User Progress Goes Through the Unified Progress Service

All completion writes (story, lesson, sunnah practice, course, daily hadith) MUST go through `lib/progress/progressService.ts` via the hooks in `hooks/useProgress.ts`. Direct `supabase.from(...).upsert(...)` calls in screen components are forbidden for progress data.

This caused FIX-032 across multiple screens. The story screens upserted directly to Supabase but never invalidated React Query cache → UI never refreshed. The lesson screen had a literal `// TODO: Implement lesson completion` and just called `router.back()`. Each screen invented its own state.

### Required pattern

```typescript
// In any screen that lets the user complete content:
import { useCompletionStatus } from '@/hooks/useProgress'

const completion = useCompletionStatus('story', slug)

// In the handler:
await completion.markComplete({ /* optional metadata */ })

// In the render:
{completion.isComplete ? (
  <CompletedBadge />
) : (
  <Button title="Mark as Complete" isLoading={completion.isMarking} onPress={...} />
)}
```

### Forbidden

- `supabase.from('user_lesson_progress').upsert(...)` directly in a screen component
- `useState<boolean>(false)` for "is this complete" — that loses state on navigate-away and never persists
- Reading completion state from a separate Supabase query when the service already exposes it
- Adding a new progress table to Supabase without also wiring the service to mirror to it

### Why

One source of truth for progress means: optimistic UI just works, app restart preserves state, guests get full functionality, badges compute from real data, every screen reflects writes from every other screen.

---

## Rule 027: Local-First Persistence for User Progress

User progress data MUST be persisted locally (AsyncStorage) as the canonical store. Supabase mirror is best-effort and may fail without affecting the user experience.

This caused FIX-032: every progress flow required Supabase auth + a specific table schema. Guest users had zero progress. Network failure left the user staring at a button that did nothing visible.

### Required behavior

| Scenario | Expected |
|---|---|
| Authenticated user, network OK | Local write + background Supabase mirror |
| Authenticated user, network down | Local write succeeds; Supabase mirror queued via best-effort retry on next interaction |
| Unauthenticated guest | Local write succeeds; no Supabase call attempted |
| Supabase table missing | Local write succeeds; Supabase mirror swallows the schema error in DEV warn |
| App restart | All local progress survives |
| App reinstall | Local progress wiped (acceptable; document in onboarding if cross-device sync becomes a feature) |

### Storage key conventions

- `@authentic_hadith/progress/v1` — main progress store (versioned for migrations)
- Any new progress-related store keys MUST be namespaced under `@authentic_hadith/` and versioned

---

## Rule 028: Calculated Display Screens Render With Empty Defaults

Screens that display calculated state — badges, achievements, progress summaries, level/XP, streak data — MUST render successfully on first launch with zero data. They must NEVER crash on missing tables, missing auth, or empty progress.

This caused FIX-032 Issue A: the old `achievements.tsx` queried `supabase.from('achievements')` and called `.single()` on `user_stats`. On first launch (no rows), `.single()` threw PGRST116. The screen unmounted abruptly — described to KP as "crashes/closes the app."

### Required behavior for any calculated-display screen

1. Source data through the unified progress service (Rule 026), not direct table queries
2. If a Supabase fallback is genuinely needed, use `.maybeSingle()` not `.single()`
3. Render an intentional empty state when the data is empty:
   - "No badges earned yet. Complete a story, lesson, or Sunnah practice to unlock your first badge."
   - "Your progress timeline will appear here as you complete lessons, stories, and Sunnah practices."
4. Never depend on a table existing — wrap any cross-cutting fetches in try/catch and fall through to empty
5. Use `getColors(isDark)` for theming (Rule 017)

### Forbidden

- `.single()` on user-scoped queries that may return zero rows
- Throwing inside a queryFn for missing-data conditions
- Conditional rendering that produces no fallback UI for the empty case
- Reading from `COLORS` directly (breaks dark mode per Rule 017)

---

# Required File System

Every serious app build must include:

- `ERROR_REPORT.md`
- `BUILD_FIX_LOG.md`
- `APP_LAUNCH_PLAYBOOK.md`
- `SYSTEM_RULES.md`
- `WORKFLOW_ROUTER.md`
- `CLAUDE.md`
- `.env.example`
- `README.md`

These files form the engineering operating system.

---

# Future App Rule

When starting a new app, copy this entire system first.

Do not begin a new app from a blank repo.

The next app must begin from:

1. Starter template repo
2. Existing debugging system
3. Existing launch playbook
4. Existing system rules
5. Existing coding agent instructions

The goal is not to rebuild knowledge.

The goal is to reuse it.
