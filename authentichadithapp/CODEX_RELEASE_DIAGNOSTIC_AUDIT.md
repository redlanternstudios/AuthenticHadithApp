# CODEX_RELEASE_DIAGNOSTIC_AUDIT.md

## Executive Summary

VERIFIED: This audit scanned the Expo / React Native mobile repo at `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp`.

PARTIAL: No P0 launch/build blocker was proven by static checks. `package-lock.json` parses, TypeScript passes, Expo Doctor passes, the sanitized Expo public config points at production, and the production mobile chat route returns HTTP 200 JSON.

BLOCKED: The current tree is dirty on `main`, includes uncommitted runtime changes, and contains confirmed P1 App Store/TestFlight blockers. Do not create a TestFlight build from this tree yet.

Build recommendation: `DO_NOT_BUILD_DIRTY_TREE`

Safety classification: `CODEX_AUDIT_BLOCKED_BY_DIRTY_TREE`

## Current Repo State

- Repo: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp`
- Branch: `main...origin/main`
- Latest mobile commit observed: `3de7bb2 fix(eas): pin internal-device builds to production environment`
- Related latest web/backend commit observed in log: `7ee5dd0 docs: WEB_BACKEND_DEPLOY_01 — restoration of /api/mobile-chat to production`
- Dirty tree: yes
- Requested docs present: `CLAUDE.md`, `SYSTEM_RULES.md`, `BUILD_FIX_LOG.md`, `ERROR_REPORT.md`, `APP_LAUNCH_PLAYBOOK.md`, `PRE_TESTFLIGHT_READINESS_GATE.md`, `CURRENT_VS_HANDOFF_AUDIT.md`, `V1_CONTENT_AI_AUDIT.md`, `EAS_PREVIEW_QA_02.md`, `REAL_DEVICE_QA_SWEEP_01.md`

Verification receipts:

- `pwd`: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp`
- `git status -sb`: dirty `main...origin/main`
- `git diff --stat`: `20 files changed, 553 insertions(+), 166 deletions(-)`
- `package-lock.json`: valid JSON
- `npx tsc --noEmit`: passed
- `npx expo-doctor`: `17/17 checks passed. No issues detected!`
- Sanitized Expo config: bundle id `com.byred.authentichadith`, iOS build number `5`, `apiUrl` `https://authentichadith.app`, `appEnv` `production`, required public Supabase and RevenueCat config present
- EAS production env key names present: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_SUPABASE_URL`
- Production AI endpoint: `POST https://www.authentichadith.app/api/mobile-chat` returned HTTP 200 with a string `response`
- Privacy URL used by app: `https://byredllc.com/privacy` returned HTTP 200 after redirect
- Terms URL used by app: `https://byredllc.com/terms` returned HTTP 200 after redirect
- `https://authentichadith.app/privacy` returned HTTP 404; app does not currently use this URL

## Dirty Tree Classification

| File | Git Status | Classification | Include In Build? | Commit? | Reason |
|---|---:|---|---|---|---|
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/BUILD_FIX_LOG.md` | M | DOC_ONLY | Yes | Yes | Release history log update. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/ERROR_REPORT.md` | M | DOC_ONLY | Yes | Yes | Error status documentation update. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/(tabs)/_layout.tsx` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | Runtime navigation change; affects release behavior. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/(tabs)/assistant.tsx` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | Assistant tab behavior changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/(tabs)/index.tsx` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | Home/runtime behavior changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/(tabs)/today.tsx` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | Today/runtime behavior changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/bookmarks/index.tsx` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | My Hadith/bookmark behavior changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/hadith/[id].tsx` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | Hadith detail and AI summary behavior changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/onboarding.tsx` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | First-launch review path changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/quiz.tsx` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | Quiz runtime behavior changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/settings/index.tsx` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | Settings/review path changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/components/hadith/GradeBadge.tsx` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | Hadith UI behavior changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/components/hadith/HadithCard.tsx` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | AI summary and hadith card behavior changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/components/share/ShareSheet.tsx` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | User-facing share behavior changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/lib/api/groq.ts` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | AI client behavior changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/lib/i18n/translations/ar.json` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | User-facing copy changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/lib/i18n/translations/en.json` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | User-facing copy changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/lib/islamic-safety-filter.ts` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | AI safety behavior changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/lib/supabase/client.ts` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | Core data client behavior changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/types/hadith.ts` | M | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | Data shape changed. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/PRE_TESTFLIGHT_READINESS_GATE.md` | ?? | DOC_ONLY | Yes | Yes | Gate tracking doc; contains current blockers. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/REAL_DEVICE_QA_SWEEP_01.md` | ?? | DOC_ONLY | Yes | Yes | Real-device QA tracking doc. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/(tabs)/more.tsx` | ?? | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | New navigation surface. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/settings/credits.tsx` | ?? | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | New settings/compliance surface. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/components/home/TodayFeaturedSection.tsx` | ?? | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | New home content component. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/docs/CONTENT_TRUST_BLOCKERS.md` | ?? | DOC_ONLY | Yes | Yes | Content trust release blocker doc. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/docs/ENRICHED_HADITHS_PROVENANCE.md` | ?? | DOC_ONLY | Yes | Yes | Enriched content provenance doc. |
| `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/lib/hadith/collectionDisplayName.ts` | ?? | INTENTIONAL_RELEASE_CHANGE | Yes | Yes, after review | Hadith display helper. |
| `/Users/kp/Projects/AuthenticHadithApp/.claude/` | ?? | SHOULD_NOT_COMMIT | No | No | Claude-side local artifact outside mobile repo root. |
| `/Users/kp/Projects/AuthenticHadithApp/AuthenticHadith_HandoffBrief_Keymon.pdf` | ?? | RUNTIME_QA_ARTIFACT | No | No | Handoff artifact outside mobile repo root. |

## Release Gate Status

| Gate | Status | Evidence |
|---|---|---|
| Gate 0 — Command Structure | VERIFIED / PASS | Repo, docs, and owner-lane instructions are present. |
| Gate 1 — Build & Install Stability | PARTIAL | Static checks pass; fresh internal-device build not run in this audit. Dirty tree blocks clean build recommendation. |
| Gate 2 — Core Product Runtime QA | NOT COMPLETE | `REAL_DEVICE_QA_SWEEP_01.md` lists core screens as not tested on RoPhone. |
| Gate 3 — Content & Data Integrity | PARTIAL | Backend/content audit exists; chapter screen has a confirmed static query risk and needs runtime verification. |
| Gate 4 — AI Summary / Assistant | PARTIAL | Production endpoint returns HTTP 200 JSON; device retest still pending. |
| Gate 5 — Apple Review Demo Account | BLOCKED / MANUAL | `PRE_TESTFLIGHT_READINESS_GATE.md` marks demo account pending. |
| Gate 6 — Apple IAP Capability | BLOCKED / MANUAL | Apple Developer Portal capability still pending. |
| Gate 7 — App Store Connect Products | BLOCKED / MANUAL | Product ID mismatch exists across code/docs/gate doc. |
| Gate 8 — RevenueCat Mapping | BLOCKED / MANUAL | Mapping/offering/restore requires dashboard/device verification. |
| Gate 9 — Privacy / Compliance | PARTIAL | App privacy/terms URLs are live; content trust, metadata, and account deletion verification still pending. |
| Gate 10 — Metadata / Screenshots | NOT READY | Metadata copy has overclaim/secret risks and screenshots wait on UI stability. |
| Gate 11 — Final TestFlight Build & Submit | NOT READY | Dirty tree plus P1 blockers. |

## P0 Blockers

No confirmed P0 blockers were proven in this static audit.

P0 evidence checked:

- `package-lock.json` valid.
- TypeScript passed.
- Expo Doctor passed.
- Required public EAS production key names are present.
- Production mobile chat endpoint returned HTTP 200 JSON.

NEEDS_RUNTIME_VERIFICATION: cold launch, warm relaunch, tab navigation, RevenueCat offerings, restore purchases, delete account route, and real-device content pagination still need RoPhone testing.

## P1 Blockers

1. Product ID conflict across code, metadata, and release gate docs blocks App Store Connect / RevenueCat alignment.
2. Tracked App Store metadata contains a plaintext demo password.
3. Chapter route likely displays a whole book instead of the selected chapter when chapter data exists.
4. Static `COLORS` usage remains widespread despite local rules documenting prior dark-mode breakage.
5. Content trust and App Store metadata wording still overclaim provenance/completeness.
6. Apple review, IAP capability, App Store products, and RevenueCat mapping remain manual blockers.

## P2 Issues

1. Several async flows lack mounted/cancel guards.
2. Some first-time Supabase reads use `.single()` and silently ignore missing-row errors.
3. Subscription screen may show raw SDK error text.
4. RevenueCat helper comments still mention adding the library to Expo plugins, contradicting FIX-027.
5. Notifications screen shows visible "coming soon" copy.

## Findings

### AH-P1-001 — RevenueCat/App Store Product ID Mismatch

- Gate: Gate 7, Gate 8
- Severity: P1
- File: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/lib/purchases/revenuecat.ts`
- Lines: 32-40
- Evidence: Code expects `ah_monthly_premium`, `ah_annual_premium`, and `ah_lifetime_premium` with entitlement `premium`.
- Conflicting file: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/APPSTORE_METADATA.md`
- Lines: 65-87
- Evidence: Metadata lists `ah_premium_monthly`, `ah_premium_annual`, and `ah_lifetime`.
- Conflicting file: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/PRE_TESTFLIGHT_READINESS_GATE.md`
- Lines: 120-144
- Evidence: Gate doc flags the same mismatch and says canonical naming must be confirmed.
- Why it matters: App Store Connect product IDs, RevenueCat products, and mobile code must match exactly or subscriptions and restore purchases will fail during Apple review.
- Recommended fix: Choose one canonical product ID set. The current user prompt says expected product IDs are `ah_monthly_premium`, `ah_annual_premium`, `ah_lifetime_premium`, so update docs/dashboard to match code if KP confirms that is final.
- Verification: Confirm product IDs in App Store Connect, RevenueCat product mapping, and `lib/purchases/revenuecat.ts`; then test subscription offering fetch and restore purchases on RoPhone.
- Should Claude patch? Yes, after KP confirms product ID set. Dashboard work remains manual.
- Handoff prompt:

```text
You are AH — Engineering Operator.

Task: Normalize RevenueCat/App Store product ID references to the confirmed canonical set.

Evidence:
- /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/lib/purchases/revenuecat.ts:32-40 currently uses ah_monthly_premium, ah_annual_premium, ah_lifetime_premium.
- /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/APPSTORE_METADATA.md:65-87 still lists ah_premium_monthly, ah_premium_annual, ah_lifetime.
- /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/PRE_TESTFLIGHT_READINESS_GATE.md:120-144 flags the mismatch.

Rules:
- do not run prebuild
- do not modify native iOS files
- do not touch unrelated files
- do not expose secrets

Patch:
- If KP confirms code is canonical, update APPSTORE_METADATA.md and PRE_TESTFLIGHT_READINESS_GATE.md so all product IDs are ah_monthly_premium, ah_annual_premium, ah_lifetime_premium.
- Do not change lib/purchases/revenuecat.ts unless KP chooses the old APPSTORE_METADATA.md naming instead.

Verification:
- rg "ah_premium_monthly|ah_premium_annual|ah_lifetime\\b|ah_monthly_premium|ah_annual_premium|ah_lifetime_premium" APPSTORE_METADATA.md PRE_TESTFLIGHT_READINESS_GATE.md lib app components
- npx tsc --noEmit

Commit:
- docs(revenuecat): align product id references

Safety classification: P1_APP_STORE_REVENUECAT_ALIGNMENT
```

### AH-P1-002 — Plaintext Demo Account Password In Tracked Metadata

- Gate: Gate 5, Gate 9, Gate 10
- Severity: P1
- File: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/APPSTORE_METADATA.md`
- Lines: 57-61
- Evidence: The Apple Review demo email and plaintext password are present in a tracked repo file. The password value is intentionally not repeated in this audit.
- Why it matters: Demo credentials belong in App Store Connect Review Information or a private password manager, not tracked source. This risks account compromise and accidental distribution.
- Recommended fix: Replace the password line with a private-storage placeholder and rotate the demo password before final submission.
- Verification: `rg -n "Password:|applereview@byredllc.com" APPSTORE_METADATA.md app lib components docs` and confirm no plaintext password remains.
- Should Claude patch? Yes.
- Handoff prompt:

```text
You are AH — Engineering Operator.

Task: Remove plaintext Apple Review demo password from tracked metadata.

Evidence:
- /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/APPSTORE_METADATA.md:57-61 contains the demo account credentials, including a plaintext password. Do not repeat the password value in logs or commits.

Rules:
- do not run prebuild
- do not modify native iOS files
- do not touch unrelated files
- do not expose secrets

Patch:
- In APPSTORE_METADATA.md, keep the demo email.
- Replace the password value with: [stored privately by KP; enter only in App Store Connect Review Information]
- Add one short note that KP must rotate/store the credential privately before submission.

Verification:
- rg -n "Password:" APPSTORE_METADATA.md
- rg -n "[actual old password value]" APPSTORE_METADATA.md docs app lib components should return no matches, but do not print the secret in any report.

Commit:
- docs(appstore): remove tracked demo password

Safety classification: P1_SECRET_HYGIENE
```

### AH-P1-003 — Chapter Route May Show Entire Book Instead Of Selected Chapter

- Gate: Gate 3
- Severity: P1 / NEEDS_RUNTIME_VERIFICATION
- File: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/chapter/[id].tsx`
- Lines: 64-79
- Evidence: The chapter screen builds a query using `collection_slug` and `book_number`, but does not filter by `chapter_number`.
- Related file: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/types/hadith.ts`
- Lines: 12-13
- Evidence: The Hadith type includes `book_number` and `chapter_number`.
- Related file: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/hadith/[id].tsx`
- Lines: 142-156
- Evidence: Hadith detail uses `hadith.chapter_number` to find chapter metadata, proving the app expects chapter numbers in this flow.
- Why it matters: A user tapping a chapter can see all hadiths from the parent book instead of the selected chapter. That is a content integrity failure and can make users believe hadiths are missing or miscategorized.
- Recommended fix: Verify the production `collection_hadiths` rows have usable `chapter_number`; then add `.eq('chapter_number', chapter.number)` or the correct column mapping to the chapter query.
- Verification: On RoPhone, open a known multi-chapter book and compare count/content for two separate chapters. Also query Supabase for `collection_slug`, `book_number`, `chapter_number` counts.
- Should Claude patch? Yes, after DB column verification.
- Handoff prompt:

```text
You are AH — Engineering Operator.

Task: Fix chapter detail filtering so a chapter screen shows only hadiths from the selected chapter.

Evidence:
- /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/chapter/[id].tsx:64-79 filters collection_hadiths by collection_slug and book_number only.
- /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/types/hadith.ts:12-13 includes chapter_number.
- /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/hadith/[id].tsx:142-156 already relies on hadith.chapter_number.

Rules:
- do not run prebuild
- do not modify native iOS files
- do not touch unrelated files
- do not expose secrets

Patch:
- In app/chapter/[id].tsx, after loading the chapter row, include the selected chapter number in the collection_hadiths query if production rows support chapter_number.
- Keep the FIX-037 higher limit behavior; do not reintroduce .limit(100).
- If column verification shows a different column name, patch only to the verified column.

Verification:
- npx tsc --noEmit
- Open two chapters from the same book on device/simulator and confirm different chapter-specific hadith lists.
- Verify a large chapter still loads beyond 100 rows when applicable.

Commit:
- fix(content): filter chapter hadiths by selected chapter

Safety classification: P1_CONTENT_INTEGRITY
```

### AH-P1-004 — Widespread Static COLORS Usage Can Regress Dark Mode

- Gate: Gate 2, Gate 9
- Severity: P1
- File: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/lib/styles/colors.ts`
- Lines: 97-104
- Evidence: `COLORS` is hardwired to `LIGHT_COLORS`; dynamic theming requires `getColors(isDark)`.
- Related file: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/SYSTEM_RULES.md`
- Evidence: Local rules document that static `COLORS` usage caused prior dark-mode bugs and should be avoided in screens.
- Examples still using static `COLORS`: `/app/chapter/[id].tsx`, `/app/book/[id].tsx`, `/app/collection/[slug].tsx`, `/app/sunnah.tsx`, `/app/progress.tsx`, `/app/quiz.tsx`, `/app/onboarding.tsx`, `/app/learn/[pathId].tsx`, `/app/learn/lesson/[lessonId].tsx`, `/app/stories/index.tsx`, `/app/stories/[id].tsx`, `/app/auth/login.tsx`, `/app/auth/register.tsx`
- Why it matters: App Store reviewers and users can run the app in dark mode. Static light colors can cause unreadable text, broken visual contrast, and low-quality screenshots.
- Recommended fix: Convert release-critical screens to `useColorScheme()` plus `getColors(isDark)` first, then finish lower-risk screens.
- Verification: Run the app in light and dark mode; screenshot Home, Collections, Search, Hadith detail, More, Learn, Stories, Progress, Subscription, and Settings.
- Should Claude patch? Yes.
- Handoff prompt:

```text
You are AH — Engineering Operator.

Task: Replace static COLORS usage on release-critical screens with dynamic getColors(isDark).

Evidence:
- /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/lib/styles/colors.ts:97-104 exports COLORS as LIGHT_COLORS.
- Static COLORS is still used in release-critical routes including app/chapter/[id].tsx, app/book/[id].tsx, app/collection/[slug].tsx, app/sunnah.tsx, app/progress.tsx, app/quiz.tsx, app/onboarding.tsx, app/learn/[pathId].tsx, app/learn/lesson/[lessonId].tsx, app/stories/index.tsx, app/stories/[id].tsx, app/auth/login.tsx, and app/auth/register.tsx.

Rules:
- do not run prebuild
- do not modify native iOS files
- do not touch unrelated files
- do not expose secrets
- keep the patch scoped to screen theming

Patch:
- For each touched screen, import/use useColorScheme if not already present.
- Use const isDark = colorScheme === 'dark'; const colors = getColors(isDark).
- Replace user-visible style references from COLORS.* to colors.*.
- Do not change app behavior outside styling.

Verification:
- npx tsc --noEmit
- Run visual QA in light mode and dark mode on release-critical screens.

Commit:
- fix(ui): apply dynamic colors to release screens

Safety classification: P1_DARK_MODE_REVIEW_READINESS
```

### AH-P1-005 — Content Trust / Metadata Overclaim Risk

- Gate: Gate 9, Gate 10
- Severity: P1
- File: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/docs/CONTENT_TRUST_BLOCKERS.md`
- Lines: 5-11
- Evidence: Content trust blockers remain open for enriched hadith provenance, translator/source attribution, and About-screen copyright/publisher mismatch.
- Related file: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/docs/ENRICHED_HADITHS_PROVENANCE.md`
- Lines: 1-31
- Evidence: Enriched hadith provenance is unresolved, with mitigation that enriched content is disabled.
- Related file: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/hadith/[id].tsx`
- Lines: 28-35, 101-115
- Evidence: `ENRICHED_HADITHS_ENABLED = false`, so runtime mitigation is present.
- Related file: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/APPSTORE_METADATA.md`
- Lines: 16-31
- Evidence: Metadata copy says every hadith is sourced from established scholarly collections with verified chains and refers to AI training language. This is stronger than the unresolved provenance docs support.
- Related file: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/settings/about.tsx`
- Lines: 91-97
- Evidence: About screen still says `© 2024 Authentic Hadith App`, while App Store metadata identifies byRed LLC and the current release year is 2026.
- Why it matters: App Store metadata and in-app claims must be supportable. Religious content, AI assistant behavior, and content rights should be precise to avoid review rejection or user trust issues.
- Recommended fix: Keep enriched content disabled until provenance is resolved; soften App Store metadata claims; update About publisher/year; add clear source/credits language in app.
- Verification: Review metadata, About, Credits, Privacy, AI assistant copy, and Hadith detail with screenshots. Confirm no enabled runtime path displays unverified enriched text.
- Should Claude patch? Yes.
- Handoff prompt:

```text
You are AH — Engineering Operator.

Task: Remove unsupported App Store/content trust claims and align About/Credits copy.

Evidence:
- /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/docs/CONTENT_TRUST_BLOCKERS.md:5-11 lists unresolved content trust blockers.
- /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/docs/ENRICHED_HADITHS_PROVENANCE.md:1-31 says enriched hadith provenance is unresolved.
- /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/hadith/[id].tsx:28-35 keeps ENRICHED_HADITHS_ENABLED false.
- /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/APPSTORE_METADATA.md:16-31 contains stronger provenance/AI wording than current proof supports.
- /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/settings/about.tsx:91-97 has stale publisher/year copy.

Rules:
- do not run prebuild
- do not modify native iOS files
- do not touch unrelated files
- do not expose secrets

Patch:
- Keep ENRICHED_HADITHS_ENABLED false.
- Update APPSTORE_METADATA.md to avoid unsupported "verified chains" and "AI trained" overclaims.
- Update app/settings/about.tsx publisher/year to byRed LLC / 2026 unless KP supplies different legal copy.
- Ensure Credits/Privacy copy states sources and AI limitations without making scholarly certification claims.

Verification:
- npx tsc --noEmit
- rg -n "verified chains|trained to|© 2024|RedLantern|enriched" APPSTORE_METADATA.md app docs components lib

Commit:
- fix(compliance): align content trust and metadata copy

Safety classification: P1_CONTENT_COMPLIANCE
```

### AH-P1-006 — Manual Apple Review / IAP / RevenueCat Gates Still Pending

- Gate: Gate 5, Gate 6, Gate 7, Gate 8
- Severity: P1
- File: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/PRE_TESTFLIGHT_READINESS_GATE.md`
- Lines: 92-161
- Evidence: Demo account, IAP capability, App Store Connect products, and RevenueCat mapping are marked pending.
- Why it matters: Even if the app builds, Apple review and monetization cannot be considered ready until these manual systems are verified.
- Recommended fix: KP must complete Apple Developer, App Store Connect, and RevenueCat dashboard steps; then perform device verification.
- Verification: Screenshots or receipts from Apple Developer Portal, App Store Connect product pages, RevenueCat offerings, and RoPhone subscription/restore test.
- Should Claude patch? No. Manual platform work required.
- Handoff prompt: none; this is an owner/manual operations gate.

### AH-P2-001 — Async State Updates Lack Mounted Guards

- Gate: Gate 1, Gate 2
- Severity: P2
- File: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/quiz.tsx`
- Lines: 159-176
- Evidence: Completion path schedules `setTimeout` and starts async tracking/insert work without cleanup or catch.
- Related file: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/learn/lesson/[lessonId].tsx`
- Lines: 93-107
- Evidence: Completion path schedules a delayed `router.back()` without cleanup.
- Related file: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/(tabs)/assistant.tsx`
- Lines: 41-57, 95-114
- Evidence: Async initialization and message send can update state after unmount.
- Related file: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/lib/auth/AuthProvider.tsx`
- Lines: 34-40
- Evidence: Initial auth session promise updates state without mounted guard or catch.
- Related file: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/lib/revenuecat/RevenueCatProvider.tsx`
- Lines: 68-123
- Evidence: RevenueCat async initialization updates provider state without mounted guard.
- Why it matters: These are common warm-relaunch/navigation instability risks. They are not proven crashes, but they are cleanup/leak candidates.
- Recommended fix: Add cleanup guards and clear delayed timers in release-critical flows.
- Verification: Navigate away during quiz completion, assistant request, lesson completion, and subscription load; verify no warnings, no stale spinners, no crash.
- Should Claude patch? Yes, after P1s.
- Handoff prompt: P2 hardening prompt can be generated after P1 queue is accepted.

### AH-P2-002 — First-Time Supabase Reads Silently Ignore Missing Rows

- Gate: Gate 2
- Severity: P2
- File: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/(tabs)/index.tsx`
- Lines: 79-104
- Evidence: Home stats/streak reads use `.single()` and ignore returned errors.
- Related file: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/(tabs)/today.tsx`
- Lines: 106-115
- Evidence: Today streak read uses `.single()` and ignores returned errors.
- Why it matters: First-time Apple reviewers and guest users often have no profile/stats rows. Silent failure can hide broken state and make QA harder.
- Recommended fix: Use `.maybeSingle()` for optional rows and log gated debug information only in development.
- Verification: Test fresh account, guest account, and returning account on RoPhone.
- Should Claude patch? Yes, P2.

### AH-P2-003 — Subscription Screen Can Show Raw SDK Error Text

- Gate: Gate 8, Gate 9
- Severity: P2
- File: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/settings/subscription.tsx`
- Lines: 26-38
- Evidence: `setError(err instanceof Error ? err.message : 'Failed to load subscription options')` can surface SDK/internal wording to users.
- Why it matters: Apple review polish and user trust are better served by a stable friendly message with optional dev-only logging.
- Recommended fix: Show a friendly generic message; keep technical details behind `__DEV__`.
- Verification: Disable RevenueCat key or network and confirm the visible error is user-friendly.
- Should Claude patch? Yes, P2.

### AH-P2-004 — RevenueCat Helper Comments Contradict FIX-027

- Gate: Gate 8
- Severity: P2
- File: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/lib/purchases/revenuecat.ts`
- Lines: 1-10
- Evidence: Comments still say to add the library to Expo plugins, contradicting FIX-027 and current `app.json`.
- Why it matters: Future agents can accidentally reintroduce the RevenueCat plugin mistake.
- Recommended fix: Update comments to state RevenueCat uses React Native autolinking and must not be added to Expo plugins.
- Verification: `rg -n "RevenueCat.*plugin|react-native-purchases.*plugin|autolinking" lib app docs app.json`
- Should Claude patch? Yes, P2 docs/comment-only.

### AH-P2-005 — Visible Coming Soon Copy In Settings Flow

- Gate: Gate 2, Gate 9
- Severity: P2
- File: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp/app/settings/notifications.tsx`
- Lines: 47
- Evidence: User-visible copy says push notifications are coming soon.
- Why it matters: Not a core release blocker, but visible unfinished copy can reduce review polish if reached.
- Recommended fix: Hide the route until ready or rewrite as a normal notification preference screen with disabled controls.
- Verification: Open Settings > Notifications and confirm the screen does not look unfinished.
- Should Claude patch? Optional.

## Claude-Ready Fix Handoffs Created

1. AH-P1-001 — RevenueCat/App Store product ID alignment.
2. AH-P1-002 — Remove tracked demo password.
3. AH-P1-003 — Fix/verify chapter filtering.
4. AH-P1-004 — Dynamic dark-mode colors on release-critical screens.
5. AH-P1-005 — Content trust and metadata copy alignment.

## Build Recommendation

`DO_NOT_BUILD_DIRTY_TREE`

Reason: The repo has uncommitted runtime changes and confirmed P1 release blockers. Create a fresh internal-device build only after the dirty tree is reviewed, P1 fixes are patched/committed, and manual Apple/RevenueCat gates are updated or explicitly deferred.

## Exact Next Step For KP

KP should confirm the canonical product ID set. Based on the current prompt and code, the proposed canonical set is:

- `ah_monthly_premium`
- `ah_annual_premium`
- `ah_lifetime_premium`

After that confirmation, Claude Code can execute the P1 handoffs in this order:

1. Remove tracked demo password.
2. Align product ID docs to the confirmed canonical set.
3. Patch content trust/About/metadata copy.
4. Verify and patch chapter filtering.
5. Convert release-critical screens away from static `COLORS`.

