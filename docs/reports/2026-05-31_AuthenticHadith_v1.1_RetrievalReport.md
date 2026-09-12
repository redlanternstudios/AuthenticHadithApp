# AuthenticHadith — v1.1 Code Retrieval Report
**Date:** 2026-05-31 · **Scope:** Read-only search of local repo (all branches + history + vendored v0). No files altered. v1.0 / Build #15 untouched.

---

## Reality Check
All three "to-be-retrieved" features already exist in the codebase. Two of them (**dark mode** and **Arabic/RTL**) are not just built — they are **already shipping inside Build #15**, the v1.0 binary. The handoff doc's start-state assumptions ("light mode only," "English only," "RevenueCat identifyUser unwired / zero callers") are **stale**. This matches KP's note that the live code has diverged from the brief. Nothing here was net-new work to build; it was a find-and-confirm job, and everything was found locally — **no GitHub remote access was needed.**

---

## Findings Summary

| Item | Exists? | Where | In Build #15? | Drop-in readiness |
|---|---|---|---|---|
| **Dark mode** | ✅ Full system | `main` / `origin/main` (committed, clean) | ✅ **YES** | Already live in binary |
| **Arabic + RTL** | ✅ Full i18n + native RTL | `main` / `origin/main` (committed, clean) | ✅ **YES** | Already live in binary |
| **3-tier + lifetime pricing** | ✅ Source of truth in v0 | `external/v0-authentic-hadith/lib/products.ts` | ⚠️ Partial (IDs only) | Config scaffold present; needs ASC + RC wiring |
| **RevenueCat `identifyUser` (keystone)** | ✅ Wired | Dirty working tree (`RevenueCatProvider.tsx:166`) | ❌ NO (uncommitted) | Needs validation on clean base |

---

## 1. Dark Mode — DONE, and already in v1.0
Full, persisted, manual-toggle theme system. Not in a branch — committed to `main` **and** `origin/main`.

Files (all tracked/committed):
- `lib/theme/ThemeProvider.tsx` — context, persists choice, defaults to light, no system-follow
- `lib/storage/theme-storage.ts` — persistence
- `constants/theme.ts`, `lib/styles/colors.ts` (`getColors(isDark)`)
- `hooks/use-theme-color.ts`, `components/themed-text.tsx`, `components/themed-view.tsx`
- `app/settings/appearance.tsx` — user-facing toggle screen

Wired into root layout (`app/_layout.tsx`) via `ThemeProvider` + `NavigationThemeProvider`.

**Ancestry check:** introduced by commit `e286fd9` ("Implement dark mode manual toggle"), hardened in `d2d2537`. `e286fd9` **is an ancestor of Build #15 (`0c7c099`)** → **dark mode ships in v1.0 already.** The doc's "light mode only" is wrong.

> Action: Verify on the physical device that the Appearance toggle is reachable in the shipped #15 build. If it's hidden behind a flag, exposing it is a settings-only change — no binary risk.

---

## 2. Arabic / RTL — DONE, and already in v1.0
Full i18n with **native RTL**, not a display-only toggle.

Files (tracked/committed, on `main` + `origin/main`):
- `lib/i18n/LanguageProvider.tsx` — uses `I18nManager.forceRTL`, exposes `isRTL`, persists language
- `lib/i18n/i18n.ts`
- `lib/i18n/translations/en.json` + `ar.json` (67 keys each — parallel coverage)
- `app/settings/language.tsx` — English / العربية picker, LTR/RTL aware

Wired into root layout via `LanguageProvider`. RTL uses `I18nManager.forceRTL(lang === 'ar')` (full native RTL; requires app restart to fully apply — handled in code).

**Ancestry check:** `LanguageProvider.tsx` and `ar.json` both exist at `0c7c099` → **Arabic/RTL ships in v1.0 already.** The doc's "English only" and "decide toggle vs full RTL" open question are both resolved: it's **full RTL, already in.**

> Caveat: "exists and is wired" ≠ "fully translated across every screen." The 67-key `ar.json` should be audited for coverage vs. the full English string set before marketing it as a launch feature.

---

## 3. Pricing Tiers — source exists; mobile needs wiring
The original multi-tier + lifetime structure lives in the **vendored v0 website code**: `external/v0-authentic-hadith/lib/products.ts` (present on `main`).

Actual v0 products (note: differs from the doc's "$4.99 / $39.99 / $99.99"):

| Product | Price | Type | Tier |
|---|---|---|---|
| Monthly (Intro) | **$4.99** | subscription / month | premium (intro, coupon `INTRO_MONTHLY`) |
| Monthly Premium | **$9.99** | subscription / month | premium (7-day trial) |
| Annual Premium | **$49.99** | subscription / year | premium (highlighted "Best Value") |
| Lifetime Access | **$99.99** | one-time payment | lifetime |

So the real numbers are **$4.99 / $9.99 / $49.99 / $99.99**, not $4.99/$39.99/$99.99. **Flag for Rory** — confirm intended live pricing before building config.

Mobile side (`authentichadithapp/lib/revenuecat/config.ts`) already defines product IDs:
- `MONTHLY_PREMIUM: 'ah_monthly_premium'`
- `ANNUAL_PREMIUM: 'ah_annual_premium'`
- `LIFETIME: 'ah_lifetime_premium'` ← lifetime ID already scaffolded
- Single entitlement: `ENTITLEMENT_ID = 'premium'`

v1.0 ships only Monthly + Annual; the lifetime ID is present but not offered. Pricing branches also exist: `origin/claude/paywall-pricing-tiers-Kvgf6`, `origin/sync/paywall-clean`, `origin/claude/subscription-system-coupons-zWX5C`, `origin/claude/add-paywall-integration-yJlce`.

---

## 4. RevenueCat `identifyUser` (the keystone) — ALREADY WIRED in working tree
The doc calls this the unwired foundation with "zero callers." **That is no longer true.** In the current (dirty) working tree:
- Defined: `lib/purchases/revenuecat.ts:109` → `export async function identifyUser(...)` (calls `Purchases.logIn`)
- **Called:** `lib/revenuecat/RevenueCatProvider.tsx:166` → `await identifyUser(user.id)`

⚠️ This wiring lives in the **52-file dirty working tree** (`RevenueCatProvider.tsx` shows as `M`), **not** in Build #15 or `origin/main`. Per the guardrails it must NOT be dragged in as-is — but it means the keystone work may already be substantially done and just needs to be cherry-picked onto a clean base and validated, rather than built from scratch.

---

## Mistakes / Risks to avoid
- **Don't trust the doc's start-state.** Dark mode + Arabic are already in #15; identifyUser is already wired in the working tree. Build the v1.1 charter from the *code*, not the brief.
- **Don't branch v1.1 off the dirty tree.** The identifyUser wiring and pricing edits are tangled in 52 uncommitted files incl. forbidden-zone `supabase/client.ts`. Cherry-pick specific, reviewed pieces onto a clean base.
- **Pricing numbers are unconfirmed.** v0 code says $9.99 monthly / $49.99 annual / $99.99 lifetime — reconcile with Rory before configuring ASC/RC.
- **"Wired" ≠ "verified."** Arabic translation coverage and the identifyUser flow both need functional testing, not just presence checks.

---

## Outcome / Recommended Next Actions
1. **KP (now):** Submit v1.0 / Build #15 (App Availability → Add for Review → Submit). Unaffected by all of the above.
2. **Confirm the discrepancies on-device:** Is the Appearance toggle and the Arabic language switch actually reachable in the shipped #15 build? If yes, v1.1 "dark mode + Arabic" largely collapses into a QA/translation-coverage task, not a build.
3. **Rory:** Confirm intended live pricing (the v0 numbers differ from the brief) and what each tier unlocks.
4. **v1.1 charter:** Reframe around what's actually true — keystone (`identifyUser`) is likely 80% done in the dirty tree; the real remaining work is (a) cherry-pick + verify identifyUser onto clean base, (b) tier-gating, (c) 3rd/4th product config in ASC+RC, (d) Arabic translation-coverage audit.

---

### Note on GitHub
Not connected as a live API connector, and **not required** — the local clone already contains every `origin/*` branch and the vendored v0 code, so all history is searchable offline. If you still want the live GitHub connector for `rsemeah/AuthenticHadithApp`, it can't be OAuth-authorized from chat here; it's connected through Cowork's connector/settings panel. Say the word and I'll walk you through it.
