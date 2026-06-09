# App Store Readiness Audit Report
**Project:** Authentic Hadith — iOS App Store Submission
**Entity:** RedLantern Studios / byRed LLC
**Branch:** `audit/appstore-readiness-2026-06-08`
**Audit Date:** 2026-06-08
**Auditor:** RUNTIME (PE Command Interface) + 7 parallel domain agents
**Repo:** redlanternstudios/AuthenticHadithApp

---

## FINAL VERDICT

```
╔══════════════════════════════════════════════════════╗
║                    NO-GO                              ║
║                                                       ║
║  2 HARD BLOCKS must be resolved before submission.   ║
║  Address all FLAGs before TestFlight → ASC upload.   ║
╚══════════════════════════════════════════════════════╝
```

**Hard Blocks:** 2
**Flags (non-blocking but risky):** 7
**Unverified (KP must check manually):** 4

---

## DOMAIN STATUS SUMMARY

| # | Domain | Apple Guideline | Verdict | Severity |
|---|--------|-----------------|---------|----------|
| 1 | Arabic UI toggle dead | 4.0 (Completeness) | FLAG | Medium — hide or finish |
| 2 | IAP/RevenueCat config | 2.1 / 3.1.1 | PASS (code) / UNVERIFIED (ASC) | Low |
| 3 | In-app account deletion | 5.1.1(v) | **BLOCK** | **Hard** |
| 4 | Privacy policy + labels | 5.1.1 | PASS + 2 FLAGS | Low |
| 5 | Sign in with Apple | 4.8 | PASS | Clear |
| 6 | AI assistant safeguards | 1.1 / 1.2 | PASS + 1 FLAG | Medium |
| 7 | Metadata + assets | Store standards | PASS | Clear |
| 8 | Stability / debug content | Store standards | PASS + 2 FLAGS | Medium |

---

## DOMAIN 1 — Arabic UI Toggle (Apple 4.0 Completeness)
**Verdict: FLAG — Hide for v1.0 or finish wiring**

### Evidence
| Claim | Status | Receipt |
|-------|--------|---------|
| Language toggle handler wired | VERIFIED | `app/settings/language.tsx:82` — calls `setLanguage(lang.code)` |
| Preference persists (AsyncStorage) | VERIFIED | `lib/i18n/LanguageProvider.tsx:54` — `saveLanguagePreference()` |
| RTL forced on Arabic selection | VERIFIED | `lib/i18n/LanguageProvider.tsx:57` — `I18nManager.forceRTL(lang === 'ar')` |
| Arabic translation file complete | VERIFIED | `lib/i18n/translations/ar.json` — 67 keys, fully populated |
| Screens call `t()` / `useTranslation()` | **ZERO MATCHES** | Grep across all 49 .tsx files → 0 results |
| % of screens immune to toggle | VERIFIED | 43/49 (87.8%) render hardcoded English regardless |
| Settings menu links to language screen | VERIFIED | `app/settings/index.tsx:51-58` |

### Root Cause
Infrastructure exists (LanguageProvider, i18next config, ar.json with 67 keys) but **no component calls the translation function**. The toggle updates RTL layout and 6 screens that use `isArabic` ternary strings, but the other 43 screens are unaffected.

### Fix Options
- **Option A (v1.0 recommended):** Hide the Language option from Settings for v1.0. Remove `language.tsx` from nav tree. Ship English-only. Add Arabic in v1.1 properly.
- **Option B (finish now):** Wire `t()` into all 49 screens — estimated 2-4 day effort.

### [Q-FOR-KP] Hide Arabic for v1.0 or wire it now?

---

## DOMAIN 2 — IAP / RevenueCat Config (Apple 2.1 / 3.1.1)
**Verdict: PASS (code layer) / UNVERIFIED (App Store Connect)**

### Evidence
| Claim | Status | Receipt |
|-------|--------|---------|
| Product IDs centralized | VERIFIED | `lib/revenuecat/config.ts:14-18` — `ah_monthly_premium`, `ah_annual_premium`, `ah_lifetime_premium` |
| Product IDs consistent across codebase | VERIFIED | No conflicting IDs across 6 files checked |
| Entitlement ID unified (`premium`) | VERIFIED | `lib/revenuecat/config.ts:20` — used in RevenueCatProvider, hooks, subscription-check |
| RevenueCat iOS API key present | VERIFIED | `lib/revenuecat/config.ts:11` — hardcoded fallback `appl_FvpB...` (public `appl_` prefix ✓) |
| API key env var wired | VERIFIED | `app.config.js:44-46` reads `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` |
| Secret key exposure | VERIFIED SAFE | `config.ts:36` — rejects any `sk_` prefix keys |
| Restore purchases button | VERIFIED | `app/settings/subscription.tsx:86-102` |
| Paywall delegates to RevenueCat SDK | VERIFIED | `components/premium/PaywallScreen.tsx:13-42` — uses RevenueCatUI.Paywall |
| API layer verified | VERIFIED | `REVENUECAT_GATE_G_FIX.md` — status `API VERIFIED / DEVICE PENDING` (2026-05-28) |

### Flags
- **FLAG (price discrepancy):** APPSTORE_METADATA.md shows `$4.99/$29.99/$79.99`. Mission context stated `$4.99/$9.99/$49.99/$99.99`. Internal docs are consistent at `$4.99/$29.99/$79.99` — the mission brief appears to be outdated. **KP must confirm which prices are live in App Store Connect.**
- **UNVERIFIED:** App Store Connect products created and active — cannot verify from codebase.
- **UNVERIFIED:** Paid agreements signed in App Store Connect — cannot verify from codebase.
- **UNVERIFIED:** TestFlight paywall rendering on physical device — `REVENUECAT_GATE_G_FIX.md` marks device gates pending.

### [Q-FOR-KP] Confirm: are $4.99/$29.99/$79.99 the final prices in App Store Connect?

---

## DOMAIN 3 — In-App Account Deletion (Apple 5.1.1(v))
**Verdict: BLOCK — Backend endpoint missing**

### Evidence
| Claim | Status | Receipt |
|-------|--------|---------|
| Account creation exists | VERIFIED | `app/auth/signup.tsx` — Supabase `signUp()` |
| Delete Account UI exists | VERIFIED | `app/settings/delete-account.tsx` — requires typing "DELETE", double confirmation |
| Route accessible from Profile | VERIFIED | `app/(tabs)/profile.tsx:245` — `router.push('/settings/delete-account')` |
| Supabase `delete_user_account()` SQL function | VERIFIED | `supabase/migrations/20260214_archive_and_restrict_delete_user_account.sql` — archives + deletes all user data |
| `/api/auth/delete-account` endpoint exists | **MISSING** | Searched `external/v0-authentic-hadith/app/api/auth/` — no delete-account route. Only `signout/route.ts` found. |
| API call will succeed at runtime | **WILL FAIL** | `app/settings/delete-account.tsx:39-46` — POSTs to `${API_URL}/api/auth/delete-account` → 404 Not Found |

### Impact
Apple reviewer will:
1. Navigate to Profile > Delete Account ✓
2. Type "DELETE" and confirm ✓
3. App makes POST to `/api/auth/delete-account` → **404**
4. Error state shown → **Guideline 5.1.1(v) rejection**

### Required Fix
Create `external/v0-authentic-hadith/app/api/auth/delete-account/route.ts`:
```typescript
// POST /api/auth/delete-account
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  // Verify token and get user
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // Call existing Supabase function
  const { error } = await supabase.rpc('delete_user_account', { p_user_id: user.id })
  if (error) {
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
```
Then: deploy to Vercel, verify with curl, test E2E on device.

**Owner:** BACKEND
**Effort:** ~2 hours (code + deploy + test)

---

## DOMAIN 4 — Privacy Policy + App Privacy Labels (Apple 5.1.1)
**Verdict: PASS with 2 non-blocking flags**

### Evidence
| Claim | Status | Receipt |
|-------|--------|---------|
| Privacy policy URL declared | VERIFIED | `APPSTORE_METADATA.md:60` — `https://byredllc.com/privacy` |
| Privacy URL resolves | VERIFIED | HTTP 307 redirect — live |
| `privacy-policy.html` exists | VERIFIED | 294 lines, data categories documented (email, usage, notes, chat) |
| In-app privacy link works | VERIFIED | `app/settings/privacy.tsx:17` — `Linking.openURL('https://byredllc.com/privacy')` |
| `PrivacyInfo.xcprivacy` exists | VERIFIED | `ios/AuthenticHadith/PrivacyInfo.xcprivacy` — 4 API access types declared |
| Data collection matches policy | VERIFIED | Supabase, RevenueCat, Groq all disclosed + code-verified |
| No undisclosed analytics SDKs | VERIFIED | Grep for posthog/mixpanel/amplitude/segment/firebase → 0 package matches |
| Encryption declared correctly | VERIFIED | Policy Section 4 + `ITSAppUsesNonExemptEncryption: false` |

### Flags
- **FLAG (non-blocking):** App Store privacy labels section not in APPSTORE_METADATA.md. When filling App Store Connect, declare: Email Address, User ID, Usage Data — linked to Supabase/RevenueCat/Groq — App Functionality purpose.
- **FLAG (non-blocking):** Groq privacy policy URL in `privacy-policy.html:221` needs manual verification that it's current and confirms no training on user chat input.

---

## DOMAIN 5 — Sign in with Apple (Apple 4.8)
**Verdict: PASS — Guideline 4.8 not triggered**

### Evidence
| Claim | Status | Receipt |
|-------|--------|---------|
| Mobile app auth methods | VERIFIED | `app/auth/login.tsx` + `app/auth/signup.tsx` — email/password only |
| Third-party social login on mobile | VERIFIED ABSENT | Grep for oauth/google/facebook/twitter/apple/signInWith → 0 matches in `authentichadithapp/` |
| OAuth packages in dependencies | VERIFIED ABSENT | `package.json` — no expo-apple-authentication, no Google Sign-In, no Firebase Auth |
| Web app compliance | VERIFIED | `external/v0-authentic-hadith/components/auth-form.tsx:114-141` — Google + Apple both implemented |

**Note:** Guideline 4.8 only fires when third-party social login exists. Mobile app is email/password only → 4.8 does not apply. If Google Sign-In is ever added to mobile, Apple Sign-In must ship simultaneously.

---

## DOMAIN 6 — AI Assistant Safeguards (Apple 1.1 / 1.2)
**Verdict: PASS (safeguards) + FLAG (production endpoint broken)**

### Evidence
| Claim | Status | Receipt |
|-------|--------|---------|
| Islamic safety filter wired | VERIFIED | `lib/api/groq.ts:27-33` — `checkInputSafety()` runs before every network call |
| 5 blocked categories | VERIFIED | `lib/islamic-safety-filter.ts` — prompt_injection, explicit_content, haram_facilitation, blasphemy, extremism |
| Ruling/fatwa request deferral | VERIFIED | `lib/islamic-safety-filter.ts:53-55` — soft deferral to qualified scholars |
| System prompt includes ethics addendum | VERIFIED | `app/api/chat/route.web.ts:16-30` + `ISLAMIC_ETHICS_ADDENDUM` at lines 156-185 |
| "Not a fatwa" disclaimer in UI | VERIFIED | `app/(tabs)/assistant.tsx:140-142` — "Answers are AI-generated context, not a fatwa." |
| Onboarding AI disclaimer | VERIFIED | `app/onboarding.tsx:334-342` — defers to qualified scholars for rulings (Arabic + English) |
| Credits AI disclaimer | VERIFIED | `app/settings/credits.tsx:86-97` — "AI guidance only. For religious rulings, consult a qualified scholar." |
| Summary prompts anti-fatwa | VERIFIED | `app/hadith/[id].tsx:175` + `components/hadith/HadithCard.tsx:54-61` — explicit "Do not issue any religious ruling, fatwa, or theological judgment" |

### Flag
- **FLAG (medium):** `/api/mobile-chat` returns HTTP 404 in production — AI Assistant feature is currently non-functional. The route exists in local source (`external/v0-authentic-hadith/app/api/mobile-chat/route.ts`) but Vercel deployment is out of sync. Additionally, `mobile-chat/route.ts` does NOT include the `ISLAMIC_ETHICS_ADDENDUM` — this must be added before redeploy.

**Fix steps:**
1. Add `ISLAMIC_ETHICS_ADDENDUM` import + usage to `mobile-chat/route.ts`
2. Deploy to Vercel
3. Verify: `curl -X POST https://www.authentichadith.app/api/mobile-chat` returns 200

---

## DOMAIN 7 — App Store Metadata + Assets
**Verdict: PASS**

### Evidence
| Field | Value | Limit | Status |
|-------|-------|-------|--------|
| App Name | "Authentic Hadith" | 30 chars | PASS (16 chars) |
| Subtitle | "Daily Hadith and Scholar Guide" | 30 chars | PASS (exactly 30) |
| Keywords | 96 chars | 100 chars | PASS |
| Bundle ID | `com.byred.authentichadith` | — | PASS |
| Version | `1.0.0` | — | PASS |
| Build Number | `5` | — | PASS |
| ASC App ID | `6764673665` | — | PASS |
| App Icon | `assets/images/icon.png` | — | PASS |
| Splash | `assets/images/splash-icon.png` | — | PASS |
| Screenshots | 20 files (iPhone + iPad) in `screenshots/2026-05-30/` | — | PASS |
| EAS auto-increment | Enabled | — | PASS |
| `ITSAppUsesNonExemptEncryption` | `false` | — | PASS |
| Placeholder text in metadata | None found | — | PASS |

**Info:** Age rating not declared in `app.json` — set manually in App Store Connect (Religious Content → 4+).

**UNVERIFIED:** Demo account `apple.reviewer@authentichadith.app` must be created in Supabase with premium entitlement before submission. Password stored privately by KP.

---

## DOMAIN 8 — Stability + Debug Content
**Verdict: PASS (code) + 2 FLAGS**

### Evidence
| Claim | Status | Receipt |
|-------|--------|---------|
| Console logs guarded | VERIFIED | 20 console statements across 11 files — all wrapped in `__DEV__` guards |
| No unguarded debug logs | VERIFIED | Zero matches for unguarded `console.log/warn/error` in production paths |
| No hardcoded test credentials | VERIFIED | Grep for test@test/example.com/lorem ipsum → 0 matches in source |
| 404 handler graceful | VERIFIED | `app/+not-found.tsx` — user-friendly "hadith not found" screen |
| FIX-060 (Musnad Ahmad hidden) | VERIFIED | `BUILD_FIX_LOG.md` — 8 files updated, tsc clean |

### Flags
- **FLAG (medium):** BUG-C — `/api/mobile-chat` 404 in production. AI Assistant tab and hadith summary feature will silently fail. `ERROR_REPORT.md` confirms this is open and unresolved.
- **FLAG (KP decision required):** Content integrity concern — hadith grade distribution (29,879 sahih / 1,610 hasan / 4 daif across Sunan collections) flagged as implausible. `ERROR_REPORT.md` offers 3 options: (A) source authoritative gradings, (B) hide grade labels, (C) ship Bukhari+Muslim only for v1. Decision required before submission.
- **UNVERIFIED:** FIX-045 (AI timeout fix) is code-complete but not verified on physical device/TestFlight. KP must run TestFlight build and confirm AI endpoint responds within 12s.

---

## OPEN QUESTIONS FOR KP

| ID | Question | Domain | Blocking? |
|----|----------|--------|-----------|
| Q1 | [Q-FOR-KP] Arabic toggle: hide for v1.0 (recommended) or wire `t()` across all 49 screens now? | D1 | No — but must decide before ship |
| Q2 | [Q-FOR-KP] Confirm final IAP prices: is `$4.99/$29.99/$79.99` correct (not $9.99/$49.99/$99.99)? | D2 | No — but prices must match ASC |
| Q3 | [Q-FOR-KP] Are App Store Connect products created and paid agreements signed? | D2 | Yes — UNVERIFIED, cannot check from code |
| Q4 | [Q-FOR-KP] Hadith grade integrity: which option — (A) authoritative gradings, (B) hide labels, (C) Bukhari+Muslim only for v1? | D8 | Soft — ship with visible bad data is a 2-star risk |
| Q5 | [Q-FOR-KP] Demo account (`apple.reviewer@authentichadith.app`) created in Supabase with premium entitlement? | D7 | Yes — Apple reviewer needs it |

---

## FULL CHECKLIST

### Hard Blocks (must fix before submission)

- [ ] **BLOCK-1 (D3):** Create `/api/auth/delete-account` Next.js route, bridge to Supabase `delete_user_account()`, deploy to Vercel, E2E test on device. Owner: BACKEND.
- [ ] **BLOCK-2 (D6/D8):** Add `ISLAMIC_ETHICS_ADDENDUM` to `mobile-chat/route.ts`, deploy to Vercel, verify `POST /api/mobile-chat` returns 200. Owner: BACKEND + DEPLOY.

### High-Priority Flags (fix before ASC upload)

- [ ] **FLAG-1 (D1):** Decision on Arabic toggle — hide from Settings or wire `t()`. If hiding: remove `language.tsx` nav link from `settings/index.tsx`. Owner: FRONTEND.
- [ ] **FLAG-2 (D8):** Hadith grade integrity decision from KP. Owner: KP + DATA.
- [ ] **FLAG-3 (D2):** Verify App Store Connect products active, paid agreements signed, prices match `$4.99/$29.99/$79.99`. Owner: KP (ASC console).

### Pre-Submission (before upload, not before code fix)

- [ ] **FLAG-4 (D4):** Fill App Store Connect privacy labels: Email Address, User ID, Usage Data → App Functionality → Supabase/RevenueCat/Groq.
- [ ] **FLAG-5 (D4):** Verify `groq.com/privacy-policy` URL is current and confirms no training on user input.
- [ ] **FLAG-6 (D7):** Set age rating in App Store Connect (Religious Content → 4+).
- [ ] **FLAG-7 (D7):** Create demo account `apple.reviewer@authentichadith.app` in Supabase with active premium entitlement. Rotate password after each review cycle.

### Device Verification (UNVERIFIED — KP must run on physical device)

- [ ] **UNVERIFIED-1 (D2):** TestFlight paywall rendering, purchase sandbox, restore purchases flow on RoPhone.
- [ ] **UNVERIFIED-2 (D8):** FIX-045 verification — AI assistant responds within 12s timeout on TestFlight build.
- [ ] **UNVERIFIED-3 (D3):** Full account deletion E2E — sign up, save data, delete, verify Supabase auth + `archived_user_data` table.
- [ ] **UNVERIFIED-4 (D5):** Login/signup flow end-to-end on physical device (email/password).

---

## PROPOSED FIX PRs (Drafts — NOT for merge without KP approval)

### Draft PR 1: Create Account Deletion API Endpoint
**Branch:** `fix/account-deletion-endpoint` (from audit branch)
**File:** `external/v0-authentic-hadith/app/api/auth/delete-account/route.ts`
**Scope:** ~30 lines — POST handler + bearer token validation + Supabase RPC call
**Status:** DRAFT — code template above in Domain 3 section
**KP approval required before merge + deploy**

### Draft PR 2: Fix Mobile Chat Route (add safety addendum + redeploy)
**Branch:** `fix/mobile-chat-safety-addendum` (from audit branch)
**File:** `external/v0-authentic-hadith/app/api/mobile-chat/route.ts`
**Scope:** Add `ISLAMIC_ETHICS_ADDENDUM` import + concatenation to system prompt
**Status:** DRAFT — requires Vercel redeploy after merge
**KP approval required before merge + deploy**

### Draft PR 3: Hide Arabic Language Toggle for v1.0
**Branch:** `fix/hide-arabic-toggle-v1` (from audit branch)
**File:** `authentichadithapp/app/settings/index.tsx`
**Scope:** Remove language SettingsItem from settings menu (1 JSX block) + update language.tsx to show "Coming Soon" state
**Status:** DRAFT — only if KP confirms hiding vs. wiring
**Conditional on Q1 answer**

---

## RECEIPT LOG

| Domain | Audit Method | Files Read | Key File:Lines |
|--------|-------------|-----------|----------------|
| D1 | Explore agent + grep | 8 files | `lib/i18n/LanguageProvider.tsx:52-58`, `app/settings/language.tsx:82`, `lib/i18n/translations/ar.json` |
| D2 | Explore agent | 12 files | `lib/revenuecat/config.ts:9-20`, `app.config.js:44-46`, `REVENUECAT_GATE_G_FIX.md` |
| D3 | Explore agent | 10 files | `app/settings/delete-account.tsx:39-46`, `supabase/migrations/20260214_...sql`, `external/.../app/api/auth/` |
| D4 | Explore agent | 14 files | `privacy-policy.html`, `ios/AuthenticHadith/PrivacyInfo.xcprivacy`, `lib/api/groq.ts` |
| D5 | Explore agent | 8 files | `app/auth/login.tsx`, `app/auth/signup.tsx`, `package.json` |
| D6 | Explore agent | 12 files | `lib/islamic-safety-filter.ts:53-55,117-124`, `app/(tabs)/assistant.tsx:140-142`, `app/hadith/[id].tsx:175` |
| D7+D8 | Explore agent | 15 files | `app.json:1-95`, `eas.json`, `ERROR_REPORT.md`, `BUILD_FIX_LOG.md` |

---

*Report generated on audit branch. No changes committed to main. No App Store submission made.*
*Proposed fix PRs are drafts only — none merged, none submitted.*
