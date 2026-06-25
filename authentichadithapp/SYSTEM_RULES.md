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

## Rule 032: Probe Live Schema and Build an Alias Map Before Inventing Tables

When a task framing says "table X is missing," verify by probing the live Supabase schema before creating a new table. Production may already have the same entity under a different name. Inventing a duplicate creates two sources of truth — the exact pattern that produced FIX-002.

This rule was extracted during FIX-035 (V1 Schema Alignment Sprint). The brief asked for `companions`, `companion_stories`, `my_hadith_folders`, `folder_hadiths`, `redeem_codes`, `bookmarks`, `daily_hadiths` — none of which exist under those names. All but two are aliased to existing production tables: `sahaba`, `story_parts`, `hadith_folders` + `saved_hadiths.folder_id`, `promo_codes`, `saved_hadiths`. Daily hadith is computed at request time, no table needed.

### Required before any "create missing table" PR

1. **Probe the live schema** with the anon key from `lib/supabase/config.ts`:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" \
     "${SUPABASE_URL}/rest/v1/<table>?select=*&limit=1" \
     -H "apikey: ${ANON_KEY}"
   # 200 = exists (RLS may hide rows). 404 = does not exist.
   ```
2. **Grep the codebase** for all variants of the entity name. Mobile may already query the right table under a different name than the brief uses:
   ```bash
   grep -rln "supabase.from('<entity>" app/ lib/ hooks/
   ```
3. **Read the audit doc** (`V1_SCHEMA_ALIGNMENT_AUDIT.md` or successor). The alias map there is the source of truth for "which name is real."
4. Only then create the migration. Use `CREATE TABLE IF NOT EXISTS` and idempotent policy guards (`DO $$ BEGIN ... EXCEPTION WHEN duplicate_object`).

### Forbidden

- Creating a new table when the audit alias map shows an existing table serving the same purpose
- Renaming an existing production table to match a brief's naming preference (breaks the live web app + every existing query)
- Trusting earlier audit docs over a fresh schema probe — production drifts; documents go stale

### Known Production Aliases (as of FIX-035, 2026-05-08)

| Conceptual name | Real production table |
|---|---|
| companions | `sahaba` |
| companion_stories | `story_parts` filtered by `sahabi_id` |
| my_hadith_folders | `hadith_folders` |
| folder_hadiths | `saved_hadiths.folder_id` (column, not separate table) |
| redeem_codes | `promo_codes` (with `redeem_promo_code` RPC) |
| bookmarks | `saved_hadiths` |
| daily_hadiths | computed at request time from `hadiths` (no table) |
| reading_history | `hadith_views` |

Update this list when a new alias is identified.

---

## Rule 034: Verify Reviewer & Gated-Feature Readiness Against PRODUCTION — Never Trust a Readiness Doc

A "GO" in a checklist, audit, or readiness doc is a CLAIM, not a receipt. Before declaring the app submittable — and specifically before trusting that the Apple reviewer can log in and see premium — you MUST prove the live, production state of every gated path with a real network call. Docs drift from reality; reality is the only source of truth.

This rule was born 2026-06-09 (FIX-063). Every readiness doc said the reviewer enablement was "DONE-CODE" with the demo account and entitlement listed as human-only follow-ups. In production, NEITHER existed: the demo account login returned `Invalid login credentials` (the SQL was written but never run) and the RevenueCat `premium` entitlement was never granted (zero entitlements on the user). The bug "couldn't be fixed for weeks" because everyone trusted the doc that said the path was ready — nobody hit the live endpoints to confirm. The fix took minutes once the live probe exposed the truth.

### The reviewer-readiness verification loop (run before EVERY submission)

Run these against production. PASS means a real receipt, not a checkbox.

1. **Login works** — POST the demo credentials to GoTrue and confirm a token is issued:
   ```
   POST {SUPABASE_URL}/auth/v1/token?grant_type=password
   headers: apikey: {ANON}
   body:    {"email":"apple.reviewer@authentichadith.app","password":"<current>"}
   PASS = response has access_token (+ note email_confirmed). FAIL = account missing / unconfirmed / wrong password.
   ```
2. **Premium is granted** — GET the reviewer's RevenueCat subscriber and confirm the `premium` entitlement is active:
   ```
   GET https://api.revenuecat.com/v1/subscribers/{reviewer_app_user_id}
   headers: Authorization: Bearer {RC_SECRET}   (public SDK key also works for read)
   PASS = subscriber.entitlements.premium present & active. FAIL = entitlements empty.
   ```
   The `reviewer_app_user_id` is the Supabase auth UUID — the app links them via `Purchases.logIn(supabaseUserId)` in `RevenueCatProvider`. Grant the entitlement to the SAME uuid the account actually has, not a hardcoded placeholder UUID from a doc.
3. **AI / backend path answers** — probe the deployed endpoint, not the local file:
   ```
   POST https://www.authentichadith.app/api/mobile-chat  -> must NOT be 404 (see FIX-062)
   ```
4. **Profile row exists with the REAL schema** — `profiles` uses `name` + `user_id`, NOT `username`. Confirm the row is present (service-role read).

### Fixing readiness, not just diagnosing it

When a probe FAILS, fix the live state with the supported admin path, then RE-RUN the same probe to prove green:
- Create / repair the reviewer auth user: GoTrue admin API `POST|PUT {SUPABASE_URL}/auth/v1/admin/users[/{id}]` with the service-role key (`email_confirm:true`, set password). This beats raw `auth.users` SQL — it hashes the password and confirms email correctly.
- Grant premium: `POST https://api.revenuecat.com/v1/subscribers/{uuid}/entitlements/premium/promotional` with `{"duration":"lifetime"}` and the RC secret key.

### Forbidden

- Declaring "reviewer can log in" / "premium shows" / "ready to submit" without a live token-issued + entitlement-active receipt from THIS run.
- Trusting a readiness/audit doc's "DONE" or "GO" over a production probe. The doc is a hypothesis; the probe is the test.
- Granting an entitlement to a placeholder UUID from a doc without confirming it matches the account's actual auth UUID.
- Assuming a route file in the repo is deployed. Different repo (web vs Expo) and unmerged branches mean the file can exist locally and 404 in prod (FIX-062).

This rule is the generalization of Rule 033 (prove the pipe before you fill it) applied to release gating: prove the gate is open against production before you tell anyone it is.

---

## Rule 033: Prove the Pipe Before You Fill It — Canary-Verify Every Batch / Paid Operation End-to-End

Before any at-scale or paid operation — mass DB writes, LLM/AI inference loops, paid-API fan-out — you MUST prove the entire pipeline works on ONE item, including the actual WRITE and a read-back against ground truth, before spending money or tokens at scale. Order operations so the cheap validation runs before the expensive generation. Never pay for output that has nowhere to land.

This caused FIX-059 (2026-06-05): the AI-summary script generated Groq output for 31,476 hadiths and PATCHed each into `enriched_hadiths` — which is a **non-updatable VIEW**. Every write returned HTTP 500 "cannot update view." Zero rows landed. Hundreds of paid Groq calls were spent on output with nowhere to go. The 12-row pilot "passed" because pilot mode only PRINTS — it never exercised the write path. The broken pipe was invisible until the real run, and even then the script logged `FAIL` per row and ground through the whole batch instead of stopping.

### The four failures this rule kills

1. **Writing to a target that can't be written** (view, missing table, RLS-blocked). A PostgREST view is not a table — `select` works, `PATCH`/`POST` 500s.
2. **Validating the wrong thing.** A dry-run / pilot that skips the write path proves nothing about whether output lands. Quality review ≠ pipeline verification.
3. **Trusting exit codes.** Exit 0 with `fetched 0 candidate hadiths` is a silent no-op, not a success. Verify against a live count from ground truth.
4. **Grinding a broken batch.** When the pipeline is structurally broken, every item fails identically. Stop after a handful, do not burn the whole run.

### Mandatory pre-flight before any batch write or paid loop

Use `scripts/lib/preflight.mjs`. It is not optional for production-scale operations.

1. **Prove the target accepts writes** — `assertWritableTarget()` runs a zero-row canary PATCH (matches an impossible key, mutates nothing) and throws on a view / 404 / RLS block. Run it BEFORE any generation.
   ```js
   import { assertWritableTarget, assertNonEmpty, CircuitBreaker } from './lib/preflight.mjs'
   if (WRITE) await assertWritableTarget({ urlBase, target: 'enriched_hadiths', headers: writeHeaders })
   ```
2. **Prove the input is non-empty** — `assertNonEmpty(rows)` refuses to "succeed" on a 0-row fetch.
3. **Trip on repeated failure** — wrap the loop in a `CircuitBreaker` (default trip after ~15 consecutive failures) and abort the batch when it trips.
4. **Confirm landing against ground truth** — after the run, re-query a live `count=exact` and assert it climbed by the expected delta. Never report success from the script's own counter alone.

### The cheap-before-expensive ordering rule

In any generate-then-write loop, the write target must be proven writable BEFORE the first generation call. Inference is the expensive step; target validation is free. If you cannot write, you must not generate.

### Forbidden

- Running a paid/at-scale loop whose write target has not been canary-verified in the same run
- Treating a pilot/dry-run that skips the write as proof the pipeline works
- Reporting "done" from an exit code or an in-script counter without a ground-truth re-count
- Letting a batch continue past a wall of identical failures (no circuit breaker)
- PATCHing a Supabase object without first confirming it is a TABLE, not a VIEW

### Verification that this rule is wired

```bash
# The summary script must self-abort at preflight when the target is a view:
node scripts/enrich-summaries.mjs --write 2>&1 | head -2
# Expect: "PREFLIGHT FAILED: ... NON-UPDATABLE VIEW" and a non-zero exit, with NO Groq calls made.
```

---

## Rule 035: Delete Account Auth Contract

Every delete-account endpoint must require an authenticated session. A request with no `Authorization` header or an invalid/expired Bearer token MUST return `401` before any database operation is attempted. A `200` response is only valid when the caller's identity has been verified by Supabase `auth.getUser()` and returned a non-null user. Bypassing this check is a SUBMISSION_BLOCKER and an App Store Review Guideline 5.1.1(v) violation.

### Failing = SUBMISSION_BLOCKER

Any code path that:
- Proceeds to `delete_user_account` RPC without first resolving a valid user from the token
- Returns `2xx` on an unauthenticated request
- Swallows a 401-worthy auth error and proceeds anyway

is a defect. Treat it with the same urgency as a crash.

---

## Rule 036: Profiles Schema Contract

A `profiles` row MUST be created immediately after `auth.signUp()` succeeds, in the same call context. The row must use:
- `id` = `data.user.id` (primary key)
- `user_id` = `data.user.id` (NOT NULL — verified 2026-06-09 against live schema)
- `name` = trimmed full name or email prefix (NOT `username`, NOT `full_name`)

Any code path that creates an auth user without a corresponding `profiles` row is a defect (FIX-064). If `profiles.insert()` fails, `signUp` must throw — never silently continue with a half-created account. The column names `id`, `user_id`, `name` are the canonical production schema. Do not invent or reuse stale column names without probing the live schema first (Rule 032).

---

## Rule 037: Collection Visibility Contract

The following constants in `lib/hadith/visibleCollections.ts` are KP-approved and locked. Changes require explicit KP sign-off before any PR is merged.

| Constant | Required value |
|---|---|
| `HIDDEN_COLLECTION_SLUGS.length` | exactly `6` |
| `VISIBLE_COLLECTION_COUNT` | `2` |
| `VISIBLE_HADITH_TOTAL` | `14444` |

The 6 hidden slugs are: `musnad-ahmad`, `sunan-abu-dawud`, `jami-tirmidhi`, `sunan-nasai`, `sunan-ibn-majah`, `muwatta-malik`. Only Sahih Bukhari and Sahih Muslim are visible. `VISIBLE_HADITH_TOTAL` is the raw Sahihayn corpus count; it matches the App Store listing copy exactly (KP directive 2026-06-10). Any PR that changes these values without a documented KP directive is automatically reverted.

---

## Rule 038: RC Entitlement Key Contract

The active RevenueCat entitlement key is `premium`. The string `rc_promo_premium_lifetime` is permanently retired as of 2026-06-10 (FIX-063 era cleanup). Any `grep` hit on that string in the codebase is a false signal from a stale search — do not act on it, do not reactivate it, do not reference it in docs or configs. The correct entitlement identifier in all code, docs, probes, and RevenueCat dashboard entries is the single string `premium`.

### Prohibited

- Using `rc_promo_premium_lifetime` as an entitlement ID anywhere in source, docs, or RC dashboard
- Granting a promotional entitlement under any key other than `premium`
- Treating a grep hit on the retired string as evidence of a real problem

---

## Rule 039: Reviewer Account Probes Are Pre-Submission BLOCKERS

Before every TestFlight or App Store submission, the following two probes MUST be run manually and both must PASS with a live receipt (not a checkbox in a doc):

**B10 — Reviewer auth:** `apple.reviewer@authentichadith.app` can sign in via GoTrue password grant and reaches the home tab without error. PASS = `access_token` returned. FAIL = any other response.

**B11 — RC entitlement:** Reviewer UID `00000000-0000-0000-0000-000000000001` has an active `premium` entitlement via `GET api.revenuecat.com/v1/subscribers/{uid}`. PASS = `entitlements.premium` present and active. FAIL = entitlements missing or empty.

Both are SUBMISSION_BLOCKERS. If either probe fails, fix the live state (Rule 034) and re-run the probe before proceeding. Never substitute a doc checklist for a live receipt. The lesson from FIX-063: the doc said "DONE" for weeks while the reviewer couldn't log in and had no entitlement.

---

## Rule 040: No App Store Submission Without Full Device QA Evidence (HARD GATE)

KP directive, hardcoded 2026-06-12. "Submit for Review" is BLOCKED until every release-critical flow is confirmed on the **actual TestFlight build, on a physical iPhone, by KP, with screenshots/results.** This rule outranks any readiness doc, audit verdict, simulator result, or code inspection.

**No operator (Claude Code, Cowork, swarm, web session) may:**
- Claim a build "passes QA" / is "ready to submit" / "production-ready" without KP's device evidence for each item below.
- Treat code-side audit, simulator render, or assumption as a substitute for device confirmation.
- Press Submit for Review, or instruct KP that it is safe to submit, until the checklist is GREEN with receipts.

**Device-confirmed checklist (each needs a KP screenshot/result on the build being submitted):**
1. Cold launch — clean, no white flash, lands signed-in, state restored.
2. Reviewer login + premium unlock — reviewer account signs in AND premium content is unlocked (proves the RC↔Supabase entitlement resolves live).
3. Account deletion — end-to-end on a throwaway account (prior rejection cause).
4. AI Assistant — returns a real answer with disclaimer (prior rejection cause).
5. Paywall — loads with $9.99 / $49.99 / $99.99 and does not crash.
6. Restore Purchases — runs without error.
7. Lessons / Learn — paths and lessons render, Next/Previous works.
8. App icon — correct green/gold logo on the home screen (not Expo default).

**Permitted before full QA:** attaching a build to the App Store version (reversible prep). **Not permitted:** Submit for Review. The attach step does not satisfy this rule and does not unlock submission.

**Receipt discipline (ties to TruthSerum + Rule 039):** a checklist item flips to PASS only with a KP-provided device receipt. Until then it is Unknown. "The build is ready" without all 8 device receipts is a Rule 040 violation. Re-confirm the FULL checklist on any NEW build number before submission — a prior build's QA does not carry forward.

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

---

## Rule 041: Splash Image Assets MUST Be RGBA PNG — Never Palette (Mode P)

**Trigger**: Any time a PNG file is added or modified in `assets/images/` for splash screen use.

**Rule**: All splash screen images (`splash-icon.png`, icon variations) must be saved in RGBA color mode. Palette-mode (Mode P / 8-bit indexed color) PNGs cannot be rendered by the iOS storyboard splash screen renderer — they silently fall back to the Expo calibration template (concentric circles + grid on black background), which appears to users as a broken launch screen.

**Verification command**:
```python
from PIL import Image
img = Image.open('assets/images/splash-icon.png')
assert img.mode == 'RGBA', f"FAIL: mode is {img.mode}, must be RGBA"
```

**Fix command**:
```python
from PIL import Image
img = Image.open('path/to/image.png')
img.convert('RGBA').save('path/to/image.png')
```

**Root cause reference**: FIX-107 — splash-icon.png was Mode P, causing calibration template fallback on every cold launch.

**Applies to**: All new apps in the Red Lantern / By Red pipeline. PNG assets for iOS must be verified for mode before inclusion. Source: FIX-107 (2026-06-24).

---

## Rule 042: Every Text Style MUST Declare fontFamily from FONT_FAMILY Constants

**Trigger**: Any `StyleSheet.create()` block that includes `fontSize` or `fontWeight`.

**Rule**: iOS does NOT inherit font families. Every `Text` element renders in the system font (San Francisco) unless `fontFamily` is explicitly set in its style. All text styles in this app must include `fontFamily: FONT_FAMILY.heading` (for headings/labels with fontWeight 700 or letterSpacing) or `fontFamily: FONT_FAMILY.body` (for body text, captions, descriptions). The FONT_FAMILY constants are defined in `constants/theme.ts` and must be imported.

**Exceptions**:
- Arabic text fields: use `fontFamily: FONT_FAMILY.arabic` (currently `undefined` — intentional, no Arabic font loaded yet)
- Button badge text on colored backgrounds (`color: '#ffffff'`): fontFamily still required, color is intentionally white for contrast

**Enforcement**: Before any PR merge, grep for fontSize blocks missing fontFamily:
```bash
grep -n "fontSize:" src/**/*.tsx | grep -v "fontFamily:"
```

**Root cause reference**: FIX-108 — 80+ text styles across 11 files omitted fontFamily, causing all body/heading text to render in San Francisco instead of Cinzel. Source: FIX-108 (2026-06-24).

---

## Rule 043: App Store Screenshots MUST NEVER Include Paywall or Subscription Gate Screens

**Trigger**: Any App Store Connect screenshot submission workflow, or any agent/human capturing screenshots for ASC upload.

**Rule**: Paywall screens, subscription walls, and IAP upsell screens (any screen whose primary UI element is a "Subscribe / Upgrade" prompt rather than app content) are PERMANENTLY EXCLUDED from App Store screenshots. Apple Guideline 2.3.7 requires screenshots to demonstrate the actual in-app user experience. A paywall-only screenshot does not demonstrate app functionality and risks rejection for misrepresentation or misleading metadata.

**Approved screenshot set for Authentic Hadith (both iPhone 6.9" and iPad 13"):**
1. `01_home.png` — Home / Hadith feed
2. `02_hadith_detail.png` — Hadith detail view
3. `03_ai_assistant.png` — AI Assistant
4. `04_collections.png` — Collections
5. `05_quiz.png` — Quiz / Learn
6. `06_stories.png` — Stories

**Paywall captures**: Save to `DO_NOT_SUBMIT/` subfolder with `_EXCLUDED` suffix. Never upload to ASC.

**Folders**:
- iPhone 6.9" approved: `~/Downloads/asc_screenshots_iphone69/01_home.png` through `06_stories.png`
- iPad 13" approved: `~/Downloads/asc_screenshots_ipad13/01_home.png` through `06_stories.png`
- Excluded: `~/Downloads/asc_screenshots_iphone69/DO_NOT_SUBMIT/00_paywall_raw_EXCLUDED.png`

**Applies to all future Red Lantern / By Red apps.** Any screen that gates content behind a purchase prompt is excluded from ASC screenshots by default.

**Root cause reference**: KP directive 2026-06-24 — "Paywall can not be listed on Apple list ensure that is hardcoded." Source: session following FIX-108. Apple Guideline 2.3.7.
