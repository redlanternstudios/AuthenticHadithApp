# Device QA — Build 45 (site→app migration spine)

**Build:** v1.1.0, EAS build (next production build). iOS buildNumber is assigned **remotely by EAS** (`eas.json` `appVersionSource: "remote"` + `production.autoIncrement: true`); `app.json` buildNumber 5 is ignored for production — do not bump it manually.
**Base commit:** `fc8f1fd` on `feat/learn-v2-supabase-20260622`.
**Device:** KP's physical iPhone via TestFlight (NOT simulator).
**Purpose:** validate the migration spine on a real device. Per Rule 040 / TruthSerum, no "works" claim without device evidence in the RESULT column.
**Date:** ______. Fill RESULT per item: ✅ PASS / ❌ FAIL / ⛔ BLOCKED / ❔ UNKNOWN.

## Preconditions
- Build 45 installed from TestFlight on a physical iPhone.
- Have a real folder **share token** and a real **tag slug** ready (generate a share token from a folder's Share action; pick a tag slug from the Topics screen).
- Test both **signed-in** and **signed-out** for the auth/guest paths.
- Universal links (Section B) need: the `associatedDomains` entitlement (present in build 45), Apple's CDN to have fetched the live AASA (verified 200 + application/json pre-build), AND possibly an app reinstall for the association to refresh.

## A. Custom-scheme deep links (work on build 45 regardless of AASA/CDN)
| # | Item | What to do | PASS looks like | RESULT |
|---|------|-----------|-----------------|--------|
| A1 | shared alias | Open `authentichadithapp://shared/<token>` (paste in Notes, tap) | App opens directly to the Shared Folder Viewer; folder loads | ☐ |
| A2 | my-hadith/shared | Open `authentichadithapp://my-hadith/shared/<token>` | Same viewer opens; folder loads | ☐ |
| A3 | topic tag alias | Open `authentichadithapp://topics/tag/<slug>` (real tag slug) | App opens to that tag's hadith list | ☐ |

## B. Universal (https) links — entitlement (build 45) + AASA
| # | Item | What to do | PASS looks like | RESULT |
|---|------|-----------|-----------------|--------|
| B1 | https shared | Tap `https://authentichadith.app/shared/<token>` in Messages/Mail | App opens (if installed) to the Shared Folder Viewer | ☐ |
| B2 | https my-hadith/shared | Tap `https://authentichadith.app/my-hadith/shared/<token>` | App opens to the viewer | ☐ |
| B3 | not-installed fallback (optional) | On a device WITHOUT the app, tap the same link | Opens the website gracefully | ☐ |

> NOTE: `/topics/*` is **not** in the AASA paths (`/shared/*`, `/my-hadith/shared/*` only), so an https topic link opens the **website**, not the app — by design this step. Topic deep-linking works via custom scheme (A3) only.

## C. Shared folder viewer behavior
| # | Item | What to do | PASS looks like | RESULT |
|---|------|-----------|-----------------|--------|
| C1 | folder loads | Open a valid shared folder (A1/B1) | Folder title + metadata + hadith list render | ☐ |
| C2 | hadith list | Inspect the list | HadithCards render cleanly, no blank rows | ☐ |
| C3 | hadith detail | Tap a hadith | Opens the hadith detail screen | ☐ |
| C4 | empty folder | Open a share token for an empty folder | "This shared folder has no hadiths yet" | ☐ |
| C5 | bad/expired token | Open `authentichadithapp://shared/garbage123` | Clear error "could not be opened" + Retry; signed-out also shows Sign In | ☐ |
| C6 | auth failure clarity | Signed out, open a private folder link | Clear message (no blank/crash); Sign In offered | ☐ |

## D. Topics / tags
| # | Item | What to do | PASS looks like | RESULT |
|---|------|-----------|-----------------|--------|
| D1 | topics list | Open Topics ("Browse by Topic") | Tag grid renders with hadith counts | ☐ |
| D2 | tag detail | Tap a tag (or A3) | The tag's hadiths render | ☐ |
| D3 | hadith from tag | Tap a hadith inside a tag | Opens hadith detail | ☐ |
| D4 | empty tag | Open a tag with no hadiths | "No hadiths found for this topic" (readable) | ☐ |
| D5 | category-slug (parked, doc-check) | Be aware: a site `/topics/<categorySlug>` link maps to app `/topics/[slug]` which queries `tags`, so a *category* slug shows "Topic not found" | Behaves as documented (parked, NOT a defect) | ☐ |

## E. Dark mode readability (Settings → Appearance → Dark Mode ON)
| # | Item | What to do | PASS looks like | RESULT |
|---|------|-----------|-----------------|--------|
| E1 | tabs / navigation | Toggle dark; view tab bar + headers | Tab bar dark, icons/labels readable, status bar light text | ☐ |
| E2 | shared folder viewer | Open the viewer in dark | Dark bg, readable text, no white flashes | ☐ |
| E3 | topics list/detail | Open in dark | Cards/text readable; empty-state text readable (Step-4 fix) | ☐ |
| E4 | hadith cards | Any list in dark | Card bg/text readable | ☐ |
| E5 | hadith detail | Open a hadith in dark | Arabic/English/grade readable | ☐ |
| E6 | settings | Settings + Appearance in dark | Readable | ☐ |
| E7 | assistant | Assistant tab in dark (theme only, no logic test) | Readable | ☐ |
| E8 | empty states | Trigger an empty list in dark | Empty text readable (not dim dark-on-dark) | ☐ |

## Verdict
- ☐ ALL GREEN → migration spine validated on device
- ☐ Any RED → file defect below; fix spine-blocking (P0/P1) only, rebuild

## Defects (rank P0 = blocks spine / P1 = major / P2 = minor)
-

> This migration QA is **additive** to the Rule 040 submission gate (cold launch, reviewer login + premium, account deletion, AI assistant, paywall prices, restore purchases, lessons, app icon). Build 45 still needs the full Rule 040 8-item device QA before any Submit for Review.
