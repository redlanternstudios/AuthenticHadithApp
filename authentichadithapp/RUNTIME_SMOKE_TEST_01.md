# RUNTIME_SMOKE_TEST_01.md — Authentic Hadith iOS App
## Runtime QA Verification Report

## Summary

| | |
|---|---|
| Date | 2026-05-08 |
| Simulator | iPhone 17 Pro (UDID `F5384F69-2BE1-40DC-806B-B4C45F03736A`), iOS 26.4 |
| Bundle ID | `com.byred.authentichadith` |
| App version | 1.0.0 (build 4) |
| Metro status | Running on `localhost:8081` |
| Latest commit at test time | `ca267b4` (FIX-032: stabilize badges and progress completion) |
| Automation capability | Screenshots ✅, App launch/terminate ✅, Deep links ✅, Limited AppleScript ✅, Synthetic UI taps ⚠️ partially blocked by macOS Accessibility permission + window-overlay competition with other foreground apps |
| Overall result | **PARTIAL — code-verified, manual KP confirmation required for tap-driven flows** |

---

## Cold Launch Result

**✅ PASS.** Fresh cold launch of the dev client renders the home screen cleanly with all FIX-031 fixes intact:

- "Assalamu Alaikum" greeting visible
- "Authentic Hadith" title (FIX-026 display name correct)
- "36,246 hadiths from 8 major collections"
- Explore grid: Today / Quiz / Stories / Sunnah / Progress / Badges
- "Hadith of the Moment" with real content (Sunan Abu Dawud 4326 in test run)
- No redbox, no GROQ_API_KEY error, no i18n error, no RevenueCat singleton error

Screenshots captured: `/tmp/qa-current.png`, `/tmp/qa-fresh-cold.png` (this session).

---

## Runtime Smoke Test — Screen-by-Screen

| # | Area | Result | Evidence | Severity if failed | Blocks EAS Preview? | Notes |
|---|---|---|---|---|---|---|
| 1 | App cold launch | ✅ PASS | Screenshot, Metro log shows clean bundle | — | No | Bundles in 1.4–5.8s, no JS errors |
| 2 | Home tab | ✅ PASS | Screenshot | — | No | Renders Explore grid + Hadith of the Moment |
| 3 | Today tab | 🟡 MANUAL | Code path verified, no automated tap available | Medium if fail | Per KP test | Reads from same DB as home; no FIX-032 changes |
| 4 | Stories tab (list) | 🟡 MANUAL | Code path verified | Medium if fail | Per KP test | No completion logic on the list itself |
| 5 | Stories detail (Prophet) | 🟡 MANUAL | Code wiring confirmed: `useCompletionStatus('story', slug)` at line 19, `markComplete` at line 51, `isComplete` at line 84. Conditional render at lines 138/148. | High if Mark-Complete fails | YES if persistence fails | Local-first, optimistic, available to guests |
| 6 | Stories detail (Companion) | 🟡 MANUAL | Same pattern, line 17, 47, 76, 128, 138 | High if fails | YES if persistence fails | Same model |
| 7 | Learn tab (path list) | 🟡 MANUAL | Pre-existing screen; no FIX-032 changes | Polish | No | |
| 8 | Lesson detail | 🟡 MANUAL | Code wiring confirmed: `useCompletionStatus('lesson', lessonId)` at line 20, `markComplete` at line 74. Brief 600ms badge before nav. | High if fails | YES if persistence fails | Replaces FIX-032 prior literal `// TODO` |
| 9 | Search tab | 🟡 MANUAL | No FIX-032 changes | Medium if fails | Per KP test | |
| 10 | My Hadith tab | 🟡 MANUAL | No FIX-032 changes | Medium if fails | Per KP test | |
| 11 | Assistant tab | 🟡 MANUAL | Calls remote `/api/mobile-chat`. Local `app/api/chat/route.ts` no longer throws (FIX-031). | Medium | Per KP test | Backend-dependent; verify GROQ_API_KEY on Vercel |
| 12 | Profile tab | 🟡 MANUAL | No FIX-032 changes; FIX-017 nav links present | Medium if fails | Per KP test | |
| 13 | **Badges screen** (FIX-032 critical) | 🟢 CODE-VERIFIED | `app/achievements.tsx` rewritten. NO `supabase.from(...)` calls in file. Reads only `useBadges()` + `useProgressSummary()`. Cannot crash on missing tables/auth/empty progress. | Critical if regression | YES if crashes | Tap-test pending KP. Empty state: "Complete lessons, stories, and Sunnah practices to unlock badges." |
| 14 | Progress screen | ✅ HARDENED | All `.single()` → `.maybeSingle()`. No PGRST116 throws on first-time users. | High if regresses | Per KP | |
| 15 | Subscription screen | 🟡 MANUAL | RevenueCat configure succeeds (FIX-031). Offerings will load when Apple Dev Portal IAP is enabled. Currently shows "no offerings" gracefully. | Medium | Per KP test | Pending external Apple setup |
| 16 | Settings → Notifications stub | 🟡 MANUAL | Pre-existing "coming soon" stub | Polish | No | |
| 17 | Settings → Delete Account | 🟡 MANUAL | Required by Apple Guideline 5.1.1 | Critical if missing | YES if missing | |
| 18 | Dark mode toggle | 🟡 MANUAL | New achievements.tsx uses `getColors(isDark)` (Rule 017) | Medium | Per KP test | |
| 19 | App restart persistence (AsyncStorage) | ✅ INFRASTRUCTURE-VERIFIED | AsyncStorage path confirmed at `…/RCTAsyncLocalStorage_V1/`. Service uses durable JSON key `@authentic_hadith/progress/v1`. Currently empty (no completions yet). | High if breaks | YES if breaks | Verifiable by KP after first completion |

---

## Progression QA — Detailed Flow Results

| Flow | Result | Evidence | Persistence verified? | App restart verified? | Notes |
|---|---|---|---|---|---|
| Story Completion (Prophet) | 🟡 CODE-VERIFIED | `useCompletionStatus('story', slug)` wired at line 19. Optimistic `setIsComplete(true)` in hook on `markComplete`. Subscriber notify pattern fires re-renders on every other open instance of the screen. | Pending KP tap | Pending KP tap | Local write is canonical; Supabase mirror is best-effort |
| Story Completion (Companion) | 🟡 CODE-VERIFIED | Same pattern as Prophet | Pending KP tap | Pending KP tap | |
| Lesson Completion | 🟡 CODE-VERIFIED | Pre-FIX-032 was a literal `// TODO`. Now full flow with optimistic UI + `trackActivity('complete_lesson')` best-effort + 600ms delay → `router.back()`. | Pending KP tap | Pending KP tap | |
| Sunnah Practice Completion | 🔴 NOT IMPLEMENTED | `app/sunnah.tsx` has no Mark-Complete UI. Service supports the type but no consumer screen. | N/A | N/A | **Acceptable v1 gap** — flagged for follow-up. Practice browser still works (read-only). |
| Badges Screen | 🟢 CRASH-PROOF (CODE) | Old crash path eliminated. New screen renders 9 calculated badges (locked on first launch with progress %), filter chips, level/XP from local progress, empty state copy. | N/A | N/A | Tap-test pending |
| Progress Summary | ✅ HARDENED | `.single()` → `.maybeSingle()` everywhere. First-time users no longer trigger PGRST116. | Yes (XP/streak via Supabase user-scoped) | N/A | |
| App Restart Persistence | ✅ INFRASTRUCTURE-VERIFIED | AsyncStorage backing dir confirmed. Storage key versioned. Service uses defensive parsing — corrupted stores fall back to empty rather than crash. | Pending KP completion+restart | Pending KP test | |

---

## Findings Worth Promoting

### Finding 1 — `react-native-reanimated` warm-relaunch crash (HIGH severity, dev-only)

**Reproducible:** ✅ 100% on warm relaunch (terminate + `simctl launch` while same Metro session is running)
**Cold launch:** ✅ works cleanly (verified in two consecutive cold-launch attempts this session)

**Crash signature** (from two iOS DiagnosticReports):
```
SIGABRT  Abort trap: 6
0  __pthread_kill
1  pthread_kill
2  abort
3  __assert_rtn                                       ← assertion failure
4  AuthenticHadith.debug.dylib  -[ReanimatedModule installTurboModule]   ← root cause
5  CoreFoundation               __invoking___
…
Faulting thread: com.facebook.react.runtime.JavaScript
```

**Diagnostic file:** `/Users/kp/Library/Logs/DiagnosticReports/AuthenticHadith-2026-05-08-1607*.ips` and `…-1621*.ips`

**Analysis:**
- `react-native-reanimated@~4.1.1` + Expo SDK 54 + New Architecture enabled (`RCTNewArchEnabled = true`)
- Reanimated's TurboModule installer hits an internal assertion when re-installing on a process that already had it installed in a previous JS context this Metro session
- Triggers on: `terminate booted com.byred.authentichadith` → `launch booted com.byred.authentichadith` while Metro is still running

**Why it likely doesn't affect production**:
1. Production EAS builds embed the JS bundle directly — no Metro, no dev client launcher screen
2. Each launch is a fresh process with a fresh JS context — no reuse of state from a prior instance
3. Reanimated installs once cleanly per process lifetime
4. The cold launch path that works in this session is the same path production uses

**Action required:**
1. KP must verify on a **real device** with an EAS preview IPA — cold launch + force-quit + relaunch repeatedly. If real-device production behavior matches dev-cold (clean), ship. If real-device shows the same assertion, **block ship** and downgrade to `react-native-reanimated@~3.x` or disable New Architecture in `app.json`.
2. Document outcome here in a follow-up VERIFY entry.

### Finding 2 — Sunnah completion UI not implemented (Medium severity, acceptable v1 gap)

**Status:** `app/sunnah.tsx` is a read-only practice browser. Tapping a category expands its practices list with hadith refs, but there's no per-practice "Mark as Complete" affordance.

**Service support:** Already in place (`progressService.markComplete('sunnah_practice', practiceId, ...)`).

**Recommendation:** Acceptable for v1.0 launch. Add a follow-up task to wire `useCompletionStatus('sunnah_practice', practice.id)` onto each `practiceItem` if Sunnah completion is a launch-blocker feature. The badge "First Sunnah" cannot unlock until this UI ships.

### Finding 3 — RevenueCat offerings dev-only error (Known, not a regression)

**Status:** `[RevenueCat] Error fetching offerings — RevenueCat SDK Configuration is not valid` toast appears on every launch.

**Cause:** Apple Developer Portal IAP capability not enabled for `com.byred.authentichadith`. App Store Connect products not yet configured.

**Action required from KP:**
- Apple Developer Portal → Identifiers → `com.byred.authentichadith` → Capabilities → toggle In-App Purchase ON
- App Store Connect → Features → In-App Purchases → confirm IDs `ah_monthly_premium`, `ah_annual_premium`, `ah_lifetime_premium`
- RevenueCat dashboard → Products → confirm matching IDs and entitlement mapping

This was already documented as the FIX-031 known external blocker. Not a code issue.

---

## Remaining Risks

| Risk | Impact | Owner | Status |
|---|---|---|---|
| Reanimated warm-relaunch SIGABRT in dev | Blocks dev iteration if KP relaunches a lot in same session. **Likely** does not affect production. | KP — verify on EAS preview IPA on real device | Open |
| Sunnah completion UI not implemented | "First Sunnah" badge never unlocks for users without UI | Follow-up dev task | Acceptable v1 |
| Apple Developer Portal IAP capability ungranted | RevenueCat offerings unavailable, paywall shows "no offerings" | KP — manual external | Open |
| App Store Connect product IDs unverified | Subscription purchase will fail silently if mismatch | KP — manual external | Open |
| RevenueCat dashboard product mapping unverified | Same as above | KP — manual external | Open |
| Supabase demo review account uncreated | App Store Review will reject for missing demo credentials | KP — manual Supabase | Open |
| Privacy policy URL not deployed | Apple will reject without a live URL | KP — manual web hosting | Open |
| Tap-driven simulator verification incomplete | Story/lesson/badges UI flows are code-verified but not pixel-verified through actual user taps | KP — manual tap walkthrough OR EAS preview on real device | Open |

---

## Final Recommendation

**READY for EAS Preview IPA build, conditional on KP confirming the Reanimated warm-relaunch crash does NOT manifest on a real device after install.**

Reasoning:
- Code is verified end-to-end. TypeScript clean (only pre-existing unrelated `expo-sqlite` warning).
- Cold launch works cleanly. The dev-client warm-relaunch crash does not occur on cold launch.
- Production EAS build path differs from dev client in ways that almost certainly avoid the Reanimated issue (no Metro hot-reload, no JS context reuse).
- All three FIX-032 critical fixes (badges crash, completion persistence, unified progress) are implemented and code-certified.
- All FIX-031 startup blockers remain resolved.
- Manual external blockers (Apple Dev Portal, App Store Connect, RevenueCat, Supabase demo, privacy URL) are NOT code blockers — they're release-checklist items that don't gate the IPA build itself.

**Build the EAS preview now**, then test the IPA on a real device. If real-device cold-launch + force-quit + relaunch all work cleanly, ship to TestFlight. If real-device shows the same Reanimated SIGABRT, file a critical bug and downgrade Reanimated to 3.x or disable New Architecture.

```bash
cd /Users/kp/Projects/AuthenticHadithApp/authentichadithapp
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx eas-cli build --platform ios --profile preview --non-interactive
```

After the build completes (~10-15 min on EAS servers), install on a real iPhone via TestFlight or QR-code link and run the manual tap walkthrough documented in APP_LAUNCH_PLAYBOOK.md Section 5 ("Runtime QA: Progression system smoke").
