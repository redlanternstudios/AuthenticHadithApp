# Deploy Checklist: AuthenticHadith iOS — App Store Release

**Date:** 2026-06-05 | **Deployer:** KP | **Target:** App Store (com.byred.authentichadith, ASC 6764673665)
**Ship path:** EAS build → TestFlight → App Store review. NOT a server deploy.

> This is a religious-content app going to thousands+ of Muslim users. Content accuracy
> is a hard gate, not a nice-to-have. A wrong Arabic verse or fabricated summary is a
> launch-stopper, not a bug ticket. Data gates below are first-class.

---

## GATE 0 — Data Integrity (BLOCKING, app-specific)
The reason this app can't ship today. Every box here is a NO-GO until checked.

- [ ] **Arabic coverage** — every collection ≥99% `arabic_text` present
  - [x] Sahih Bukhari (Bug B resolved — 7,173)
  - [x] Sahih Muslim (Bug B resolved — 6,942)
  - [x] Sunan Abu Dawud (backfill DONE — 3,706 written, 1 no-source row, 3,750 total w/ Arabic)
  - [ ] Nasai / Tirmidhi / Ibn Majah / Muwatta spot-checked
- [ ] **English coverage** — 384 missing-English rows resolved or accepted (not in fawazahmed0; sunnah.com source decision pending)
- [ ] **AI summaries** — full Groq run complete OR feature flagged OFF for v1
  - [ ] "Test summary" junk rows purged before any user sees them
  - [ ] Spot-check 20 random summaries for EN↔AR↔source alignment
- [ ] **Keying defect** — duplicate `hadith_number` dedup decided and applied (or accepted with manifest logged)
- [ ] **Musnad Ahmad (Bug A)** — either sourced OR hidden from collection list for v1 (no empty collection ships)
- [ ] EN ↔ AR ↔ summary alignment verified by sub-agent audit (NO-GO until CONFIRMED)

## GATE 1 — Backend / Config
- [x] App points at correct prod Supabase (`nqklipakrfuwebkdnhwg`) — dev + EAS prod env confirmed
- [ ] **Bug C** — web backend API endpoints live (3/4 currently 404; `mobile-chat` route needs Vercel redeploy)
- [ ] Vercel server-side `SUPABASE_SERVICE_ROLE_KEY` = `nq`, redeployed
- [ ] No live reference to stray project `lwklogxdpjnvfxrlcnca` anywhere
- [ ] Supabase RLS: anon role can READ hadiths, CANNOT write (verify policy)
- [ ] No secrets in bundle — only `EXPO_PUBLIC_*` anon key ships; service_role file-only

## GATE 2 — Build (EAS)
- [ ] `npx tsc --noEmit` clean (no TypeScript errors)
- [ ] `app.json` version + build number bumped (Build 21 if rebuilding)
- [ ] EAS build profile = `production`, pulls `nq` env (confirmed)
- [ ] Build succeeds, no native module / pod failures
- [ ] Install build on a real device, smoke test below

## GATE 3 — Smoke Test (real device, human eyes)
- [ ] App launches, no white screen / crash on cold start
- [ ] Collection list loads all 7 shipping collections
- [ ] Open a hadith: English renders, Arabic renders RTL correctly, grade shows
- [ ] Search returns results
- [ ] Bookmark / favorite persists across app restart
- [ ] AI summary displays (if feature ON) or is cleanly absent (if OFF)
- [ ] No "undefined" / empty-state bugs on any hadith detail screen

## GATE 4 — App Store Submission (6-gate runbook)
- [ ] Screenshots current (no stale pricing/UI)
- [ ] Subscription GROUP localization filled (empty group = "Missing Metadata" rejection)
- [ ] Reviewer notes: no stale prices, 3-surface pricing match
- [ ] Privacy policy URL live + correct
- [ ] Age rating + content rights (religious content) declared
- [ ] Submit to App Review

## Post-Submit
- [ ] TestFlight internal build verified before prod review
- [ ] Update BUILD_FIX_LOG.md with release entry
- [ ] Log release to PE Session Brain (Notion)
- [ ] Close Bug A / Bug C tickets or move to v1.1 backlog

## Rollback / Hold Triggers
- Any Arabic verse renders wrong or empty on a shipping collection → HOLD
- Any AI summary fabricates a ruling or misattributes a hadith → pull summaries feature, reship
- Crash rate > 1% in TestFlight → fix before prod
- API 404s persist (Bug C) and a shipping feature depends on it → HOLD that feature

---
**Current verdict: NO-GO.** Blockers remaining: AI summaries (gated on KP), keying defect (gated on KP), Bug C API 404, Musnad Ahmad empty. Abu Dawud Arabic CLEARED 2026-06-05.
