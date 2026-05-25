# Authentic Hadith App: Pre-Submission QA Report

Generated: 2026-05-20
Auditor: Claude Opus 4.6 (automated) + manual code review
App Version: 1.0.0 (Build 5)
Bundle ID: com.byred.authentichadith
Framework: React Native 0.81.5 / Expo SDK 54 / Expo Router

---

## 1. Route and Screen Inventory

**47 routes discovered** across the app.

### Tab Bar (5 visible + 4 hidden)

| Route | Screen | Purpose | Auth Gated | Deps |
|-------|--------|---------|------------|------|
| /(tabs)/ | HomeScreen | Landing page, hadith of the moment, quick actions | No (soft) | Supabase, Auth |
| /(tabs)/search | SearchScreen | Full-text hadith search | No | Supabase |
| /(tabs)/collections | CollectionsTab | Browse hadith collections | No | Supabase |
| /(tabs)/my-hadith | MyHadithTab | User saved hadith folders | Yes (user check) | Auth |
| /(tabs)/more | MoreScreen | Hub linking to Today, Learn, Assistant, Profile, Settings | No | None |
| /(tabs)/today | TodayScreen | Daily hadith, sunnah, reflection | No (soft) | Supabase, Auth, AI |
| /(tabs)/learn | LearnScreen | Learning paths | No | Supabase |
| /(tabs)/assistant | AssistantScreen | AI chat for hadith questions | No (premium gated) | AI, Premium, AsyncStorage |
| /(tabs)/profile | ProfileScreen | User profile, subscription status | Yes | Auth, Premium |

### Auth Screens

| Route | Purpose | Loading | Error | Validation |
|-------|---------|---------|-------|------------|
| /auth/login | Email/password sign in | Yes | Yes (Alert) | Yes (empty check) |
| /auth/signup | Registration | Yes | Yes (Alert) | Yes (empty check) |
| /auth/forgot-password | Password reset | Yes | Yes (Alert) | Yes |

### Content Screens

| Route | Purpose | Loading | Error | Empty State |
|-------|---------|---------|-------|-------------|
| /hadith/[id] | Hadith detail with Arabic, English, AI summary | Yes | Yes | Yes (FIX-038) |
| /collection/[slug] | Collection browser | Yes | Yes | Yes |
| /book/[id] | Book chapters | Yes | NO | Yes |
| /chapter/[id] | Chapter hadiths | Yes | NO | Yes |
| /topics/index | Topic list | Yes | NO | NO |
| /topics/[slug] | Topic filtered hadiths | Yes | Yes | Yes |
| /bookmarks/index | Saved bookmarks | Yes | NO | Yes |
| /stories/index | Stories hub | Yes | NO | NO |
| /stories/prophet/[slug] | Prophet stories | Yes | Yes | Yes |
| /stories/companion/[slug] | Companion stories | Yes | Yes | Yes |
| /sunnah | Daily sunnah practices | Yes | NO | Yes |
| /reflections | Daily reflections | Yes | NO | Yes |

### Gamification

| Route | Purpose | Loading | Error |
|-------|---------|---------|-------|
| /quiz | Hadith quiz | Yes | NO |
| /progress | User progress tracker | Yes | NO |
| /achievements | Achievement badges | Yes | NO |
| /onboarding | First-run onboarding | Yes | Yes |

### Settings (8 screens)

| Route | Purpose | Risk |
|-------|---------|------|
| /settings/index | Settings hub | LOW |
| /settings/appearance | Theme toggle | LOW |
| /settings/language | Language selection | LOW |
| /settings/subscription | Manage subscription | MEDIUM |
| /settings/delete-account | Account deletion | HIGH |
| /settings/privacy | Privacy policy | LOW |
| /settings/notifications | Notification prefs | LOW |
| /settings/about | App info | LOW |

### Premium / Redemption

| Route | Purpose |
|-------|---------|
| /redeem/index | Code redemption |
| /redeem/my-code | View redemption code |

### Utility

| Route | Purpose |
|-------|---------|
| /my-hadith/create-folder | Create saved folder |
| /my-hadith/folder/[id] | Folder contents |
| /learn/[pathId] | Learning path detail |
| /learn/lesson/[lessonId] | Individual lesson |
| /+not-found | 404 handler |

---

## 2. Static Code Risk Audit

### CRITICAL Risks

| Issue | File | Description |
|-------|------|-------------|
| Dual useAuth exports | `hooks/use-auth.ts` vs `lib/auth/AuthProvider.tsx` | Two different implementations of `useAuth`. 2 screens use the React Query version, 17+ use the Context version. Session state could diverge. |
| Dev Supabase credentials in bundle | `lib/supabase/client.ts:15-19` | Hardcoded dev URL and anon key. Gated by `__DEV__` so stripped in prod, but exists in source. |

### HIGH Risks

| Issue | File | Description |
|-------|------|-------------|
| Missing error handling on 15+ Supabase screens | See route scanner output | Screens like collections, search, learn, book, chapter do not catch query failures in the UI. React Query prevents crashes but users see no error message. |
| Profile insert after signup has no error handling | `lib/auth/AuthProvider.tsx:75` | `supabase.from('profiles').insert(...)` does not check for error. If insert fails, user is signed up but profile row is missing. |
| Settings screens have no loading states | `settings/*.tsx` | Static pages but some (subscription, sync) could benefit from loading indicators. |

### MEDIUM Risks

| Issue | File | Description |
|-------|------|-------------|
| `(tabs)/more.tsx` has no loading or error state | `app/(tabs)/more.tsx` | Static menu page. Low risk but no defensive rendering. |
| Hardcoded hadith count on home | `app/(tabs)/index.tsx:148` | "31,886 hadiths from 8 major collections" is hardcoded. Will become stale. |
| `api/chat/route.ts` exists but may not run on mobile | `app/api/chat/route.ts` | Expo Router API routes work on web only. On mobile, AI calls go through `lib/api/groq.ts` to the backend. This file is unused on iOS. |
| Premium gate UX on assistant | `app/(tabs)/assistant.tsx` | Free users hit a daily limit of 3. The "daily limit reached" state disables input but does not suggest upgrade action beyond text. |

### LOW Risks

| Issue | File | Description |
|-------|------|-------------|
| `+not-found` minimal | `app/+not-found.tsx` | Basic 404 page. Sufficient for v1. |
| Settings pages are static | `settings/about.tsx`, `settings/credits.tsx` etc. | No data dependencies, no crash risk. |
| `ENRICHED_HADITHS_ENABLED = false` | `app/hadith/[id].tsx:35` | Feature flag disabled. Key teaching panel hidden. Correct for v1. |

---

## 3. Automated Verification Results

### TypeScript Strict Mode
- **Status: PASS**
- `npx tsc --noEmit` returns zero errors
- Strict mode enabled in tsconfig.json

### Route Integrity
- **Status: PASS**
- All 47 routes have corresponding files
- All 9 tab routes have files in `app/(tabs)/`
- All Stack.Screen entries in `_layout.tsx` resolve to real files

### Privacy Manifest
- **Status: PASS**
- `PrivacyInfo.xcprivacy` present with all 4 required API categories
- UserDefaults (CA92.1), FileTimestamp (0A2A.1, 3B52.1, C617.1), DiskSpace (E174.1, 85F4.1), SystemBootTime (35F9.1)

### App Icon
- **Status: PASS**
- 1024x1024px, no alpha channel

### Bundle Configuration
- **Status: PASS**
- Bundle ID consistent: `com.byred.authentichadith`
- EAS project ID configured
- ASC App ID configured: `6764673665`
- `appEnv: "production"` (fixed during this audit)
- `ITSAppUsesNonExemptEncryption: false`

### In-App Purchase Entitlement
- **Status: PASS (fixed during this audit)**
- `com.apple.developer.in-app-purchases` added to entitlements

### Error Boundary
- **Status: PASS**
- Global `ErrorBoundary` wraps entire app in `_layout.tsx`
- Catches render crashes app-wide

### AI Safety
- **Status: PASS**
- Islamic safety filter runs client-side before any AI call
- `AI_REQUEST_FAILED` constant prevents raw error leakage
- All AI responses labeled as "AI-generated, not a religious ruling"
- Try/catch on every `sendChatMessage` call

---

## 4. What Still Requires Real Device Confirmation

These items cannot be verified from code alone:

| Item | Why |
|------|-----|
| Arabic text rendering at all font sizes | RTL layout edge cases on physical devices |
| Keyboard dismiss behavior on all input screens | Particularly assistant chat and search |
| RevenueCat paywall presentation | Requires sandbox Apple ID and App Store Connect IAP setup |
| Push notification permission prompt | Requires real device |
| Deep link handling (authentichadithapp://) | Requires real device URL scheme test |
| Splash screen timing and transition | Varies by device speed |
| Dark mode / light mode on all screens | Visual regression only testable by eye |
| ScrollView performance on long hadith lists | Requires device with representative data |
| Session persistence across app kill | Requires background/foreground cycle |
| Offline behavior | Network conditioner on device |

---

## 5. App Store Submission Blockers

### Blockers (must fix before submission)

| # | Item | Status |
|---|------|--------|
| 1 | Privacy manifest | RESOLVED |
| 2 | appEnv = production | RESOLVED |
| 3 | IAP entitlement | RESOLVED |
| 4 | Icon 1024x1024 no alpha | VERIFIED CLEAN |
| 5 | App Store Connect metadata | **REQUIRES MANUAL ACTION** |

### App Store Connect Remaining (manual)

- [ ] App description (max 4000 chars)
- [ ] Keywords (max 100 chars)
- [ ] Screenshots (6.7", 6.5", 12.9" iPad)
- [ ] Privacy Policy URL (must be live)
- [ ] Support URL (must be live)
- [ ] Review contact info
- [ ] IAP products configured in App Store Connect
- [ ] RevenueCat production API key verified

---

## 6. Risk Summary

| Level | Count | Description |
|-------|-------|-------------|
| CRITICAL | 2 | Dual useAuth, dev credentials in source |
| HIGH | 3 | Missing error UI on 15+ screens, signup profile insert unhandled, settings loading |
| MEDIUM | 4 | Hardcoded stats, unused API route, premium gate UX, More screen no states |
| LOW | 3 | Static settings pages, feature flag disabled, minimal 404 |

---

## 7. Recommended Fixes Before Submission

### Must-Fix (Critical + High)

1. **Consolidate useAuth**: Pick one (`lib/auth/AuthProvider` recommended since 17 screens use it). Update `bookmarks/index.tsx` and `hadith/[id].tsx` to import from `@/lib/auth/AuthProvider`.

2. **Add error handling to signup profile insert**: In `AuthProvider.tsx:75`, wrap the profile insert in try/catch. A failed insert should not crash signup.

3. **Add error UI to high-traffic screens**: At minimum, `collections`, `search`, `today`, `book/[id]`, `chapter/[id]` need visible error states when Supabase queries fail.

### Should-Fix (Medium)

4. Remove or make the hadith count dynamic on the home screen.
5. Add a "Go Premium" CTA button when assistant hits daily limit.
6. Confirm `app/api/chat/route.ts` is not bundled in the iOS binary (it should not be with Expo Router, but verify).

### Nice-to-Fix (Low)

7. Improve `+not-found` screen with a "Go Home" button.

---

## 8. Real Device Smoke Test (Under 20 Minutes)

### Prerequisites
- TestFlight build installed on physical iPhone
- Test account credentials ready
- RevenueCat sandbox configured

### Steps

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| 1 | Launch app from cold start | Splash screen appears, transitions to Home | [ ] |
| 2 | Verify Home screen loads | "Assalamu Alaikum" greeting, Hadith of the Moment visible | [ ] |
| 3 | Tap "Refresh" on Hadith of the Moment | New hadith appears | [ ] |
| 4 | Tap the hadith card | Hadith detail screen opens with Arabic + English text | [ ] |
| 5 | Toggle language to "Arabic only" | English text hides, Arabic text displays RTL | [ ] |
| 6 | Tap "AI Summary" | Loading spinner appears, summary text renders | [ ] |
| 7 | Tap back, go to Search tab | Search screen loads with input field | [ ] |
| 8 | Search "prayer" | Results appear in list | [ ] |
| 9 | Go to Collections tab | Collection list renders | [ ] |
| 10 | Open "Sahih al-Bukhari" or first collection | Books list loads | [ ] |
| 11 | Go to My Hadith tab | Guest prompt or empty state appears | [ ] |
| 12 | Navigate to More > Profile > Sign Up | Signup screen renders | [ ] |
| 13 | Create account with test email | Redirects to Home, greeting shows username | [ ] |
| 14 | Go to My Hadith, create a folder | Folder appears in list | [ ] |
| 15 | Open a hadith, tap Save | Save modal appears, select folder, confirm | [ ] |
| 16 | Open bookmarks | Saved hadith appears | [ ] |
| 17 | Go to More > Assistant | Chat screen loads with suggested prompts | [ ] |
| 18 | Send a message | AI response renders in chat bubble | [ ] |
| 19 | Toggle dark mode (Settings > Appearance) | All visible screens switch theme | [ ] |
| 20 | Kill app completely, reopen | Session persists, user still logged in | [ ] |
| 21 | Go to Profile, tap Sign Out | Returns to guest state | [ ] |

**Estimated time: 15-18 minutes**

---

## 9. Final Readiness Classification

### Classification: READY FOR TESTFLIGHT

**Rationale:**

The app has a solid foundation:
- 47 routes all resolve to real files
- TypeScript strict mode passes clean
- Global ErrorBoundary prevents white-screen crashes
- AI safety filter and error handling are production-quality
- Privacy manifest, icon, bundle config, and IAP entitlement are all correct
- Auth flow is functional with proper loading/error states

**Not yet App Store submission ready because:**
- 15+ screens lack visible error UI for failed Supabase queries (users would see blank content, not crashes, but Apple reviewers may flag)
- Dual `useAuth` creates a maintenance risk
- App Store Connect metadata (screenshots, description, privacy URL) not yet confirmed
- RevenueCat IAP products need verification in App Store Connect
- Real device smoke test not yet completed

**Recommended path:**
1. Fix the 3 must-fix items (30-60 min of code changes)
2. Upload a TestFlight build via `npx eas-cli build --platform ios --profile production`
3. Run the 21-step smoke test on a physical device
4. Complete App Store Connect metadata
5. Submit for review

---

## 10. Test Commands Reference

```bash
# Run all QA checks
npm run qa:report

# Individual checks
npm run qa:types          # TypeScript strict check
npm run qa:lint           # ESLint
npm run qa:test           # Jest tests with coverage
npm run qa:routes         # Route integrity tests only

# Route scanner (detailed inventory)
node scripts/qa-route-scanner.js

# Build for App Store
npx eas-cli build --platform ios --profile production

# Submit to App Store
npx eas-cli submit --platform ios --profile production
```
