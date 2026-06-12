# Physical-Device QA — Build 22 (1.0.0) — Apple-Ready Gate

Install via **TestFlight app → Authentic Hadith 1.0.0 (22)**. Test on a real iPhone (cold launch).
Each item below maps to a REAL prior-submission blocker. Every one is already verified GREEN at the
API/production level (receipts in `docs/SUBMISSION_BLOCKER_LEDGER.md`) — this device pass is the final
human confirmation that the UX wires through. Check each box on your phone.

**Reviewer demo account (what Apple uses — test with THIS to replicate review):**
`apple.reviewer@authentichadith.app` / `AppleReview2026!` (premium comp'd). The ASC-listed reviewer
account `apple.reviewer+20260604@authentichadith.app` (password in ASC → App Review Information) also works.

---

## A. THE PRIOR REJECTION BLOCKERS — these MUST pass

### 1. Account deletion — Apple Guideline 5.1.1(v)  [prior rejection cause]
- [ ] Log in → Profile/Settings → **Delete Account**
- [ ] Type the confirmation (`DELETE`) and confirm
- [ ] Result: success message, you're signed out, account gone
- [ ] Log back in with the same creds → should FAIL (account truly deleted)
> Backend verified live: returns 200 + removes the account (FIX-065). Confirm the in-app button reaches it.

### 2. AI Assistant works — Apple Guideline 2.1 (App Completeness)  [prior rejection: spinner hang / 404]
- [ ] Open AI Assistant (More → AI Assistant)
- [ ] Ask a question (e.g., "What does Islam say about patience?")
- [ ] A real answer returns within a few seconds (no infinite spinner, no red error)
- [ ] The "not a fatwa / consult a scholar" disclaimer is visible
> Backend verified live: `/api/mobile-chat` → 200 + real answer (FIX-062). Confirm on device.

### 3. Reviewer login + Premium unlock — Guideline 2.1 (demo account)  [prior rejection cause]
- [ ] Sign in with the reviewer demo account above
- [ ] App loads, no crash, no "invalid credentials"
- [ ] Premium is ACTIVE: AI shows "Unlimited" (no daily cap), all Learning Paths open, no paywall block
> Verified live: login issues token + RevenueCat `premium` entitlement ACTIVE (FIX-063).

### 4. Paywall loads products + prices  [prior: "No plans available"]
- [ ] As a NON-premium state (or fresh account), open the paywall (Subscription / a premium feature)
- [ ] All 3 plans show WITH prices: Monthly $9.99, Annual $49.99, Lifetime $99.99
- [ ] No "No plans available" / blank paywall
> If prices don't load on a real device, that's a RevenueCat offering issue — flag it before submit.

### 5. Restore Purchases
- [ ] Subscription screen → **Restore Purchases** runs without error
- [ ] (With the comp'd reviewer account, premium stays active after restore)

### 6. Learning Paths load  [prior: FIX-044 not loading]
- [ ] Learn tab → Learning Paths render (Foundations, Daily Practice, etc.), no error banner
- [ ] Tapping a path opens its lessons

### 7. Correct app icon  [prior: Build 19 shipped wrong blue Expo icon]
- [ ] The installed app icon is the **green/gold Authentic Hadith** artwork (NOT a blue/default icon)

### 8. Content integrity — Sahihayn-only V1
- [ ] Home reads "**14,232 hadiths from 2 major collections**"
- [ ] Collections shows ONLY **Sahih al-Bukhari** + **Sahih Muslim** (no Abu Dawud/Tirmidhi/Nasai/Ibn Majah/Malik/Musnad Ahmad)
- [ ] Search does NOT surface any hidden-collection hadith
- [ ] Hadith cards show **Arabic + English** + a "Sahih" grade (Arabic not blank)

---

## B. GENERAL SMOKE (no crashes)
- [ ] Cold launch from a fully-quit state → home loads, no crash, no red error
- [ ] Home / Search / Collections / My Hadith / More all open
- [ ] Open a hadith → detail shows Arabic + English, language toggle works
- [ ] Today / Quiz / Stories / Sunnah / Badges / Progress all load
- [ ] Save a hadith → appears in My Hadith → unsave works
- [ ] Sign out → sign back in cleanly

---

## C. APPLE-READY CONFIRMATION (already done — for your awareness)
- [x] Build 22 attached to version 1.0 (swapped off stale Build 20)
- [x] 3 IAPs READY_TO_SUBMIT (+ review screenshots)
- [x] Age rating 4+, Free pricing, App Privacy labels
- [x] iPhone screenshots refreshed (premium screens shown)
- [x] Reviewer demo account live + premium entitlement granted
- [x] AI backend + delete-account + signup verified working in production

## VERDICT GATE
If A1–A8 all pass on your device → it is **Apple-ready to submit**. Reply "submit" and I stage the
final "Submit for Review" (that press is your authorization). If ANY item fails, tell me which # and
I fix it before we go — we do not ship halfway.
