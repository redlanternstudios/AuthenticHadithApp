# Authentic Hadith V1 Refinement

Date: 2026 07 08
Owner: Codex
Product: Authentic Hadith
Lane: ah/e2e v1 refinement

## CTP Contract

GOAL: verify the iOS simulator app page by page, fix the visible blockers, and preserve screenshots for App Store review.

CONSTRAINTS: do not touch App Store Connect, TestFlight, or live RevenueCat state. Only Sahih al Bukhari and Sahih Muslim should be visible. No forced payment gate should block access.

FORMAT: local app receipt plus Claudex receipt plus screenshot evidence.

FAILURE: claiming the app is ready while screenshots, bridge state, or route verification remain incomplete.

## Verified Fixes

VERIFIED: onboarding no longer lists the six collection set. It shows Sahih al Bukhari and Sahih Muslim only.

VERIFIED: launch no longer forces the subscription paywall before app access.

VERIFIED: Home shows 14,444 hadiths from 2 collections with a clearer deep study entry point.

VERIFIED: dark mode now uses the emerald diamond pattern direction from v0 on the main surfaces tested.

VERIFIED: collection detail pages derive books from the hadith rows and display meaningful canonical book titles.

VERIFIED: topic lists and topic detail pages are scoped to the Sahihayn visible collections.

VERIFIED: Chat screen footer copy no longer advertises forced unlimited paid access in the visible tested state.

VERIFIED: Collections screen was reformatted into a Sahihayn entry page with two intentional collection rows.

VERIFIED: Book detail now uses the canonical title and app TopBar instead of the stale native route header.

VERIFIED: native header pages now receive a Home button globally, and custom header pages expose Back plus Home.

VERIFIED: Hadith detail contrast now matches the online pattern better by keeping the diamond pattern behind solid reading panels.

VERIFIED: Search collection chips now wrap cleanly so Sahih Muslim is visible and tappable.

VERIFIED: Profile long emails are constrained inside the identity card.

VERIFIED: Progress uses a readable Back control and keeps Home available in the header.

VERIFIED: Stories uses the shared emerald header, with Back and Home visible on the list route.

VERIFIED: companion and prophet story readers include Home beside their existing bookmark and share actions.

VERIFIED: RevenueCat offering audit passes with current offering `default` and all three expected product IDs.

VERIFIED: Subscription screen shows Back, Home, three plans, Manage Subscription, and Restore Purchases.

## Screenshot Receipts

Saved in this folder:

- e2e-submit-20260708-01-launch.png
- e2e-submit-20260708-02-bukhari.png
- e2e-submit-20260708-03-muslim.png
- e2e-submit-20260708-04-topics.png
- e2e-submit-20260708-05-topic-faith.png
- e2e-submit-20260708-06-topic-faith-readable.png
- e2e-submit-20260708-07-today.png
- e2e-submit-20260708-08-chat.png
- e2e-submit-20260708-09-my-hadith.png
- e2e-submit-20260708-10-more.png
- e2e-submit-20260708-11-chat-fixed.png
- e2e-submit-20260708-12-collections.png
- e2e-submit-20260708-13-collections-fixed.png
- e2e-submit-20260708-14-book-title.png
- e2e-submit-20260708-15-book-fixed.png
- e2e-submit-20260708-16-hadith-detail-fixed.png
- e2e-submit-20260708-17-hadith-detail-contrast.png
- e2e-submit-20260708-18-collections-back-home.png
- e2e-submit-20260708-19-hadith-back-home-contrast.png
- e2e-submit-20260708-20-search.png
- e2e-submit-20260708-21-search-fixed.png
- e2e-submit-20260708-22-learn.png
- e2e-submit-20260708-23-profile.png
- e2e-submit-20260708-24-settings.png
- e2e-submit-20260708-25-settings-privacy.png
- e2e-submit-20260708-26-settings-notifications.png
- e2e-submit-20260708-27-settings-about.png
- e2e-submit-20260708-28-settings-delete-account.png
- e2e-submit-20260708-29-create-folder.png
- e2e-submit-20260708-30-bookmarks.png
- e2e-submit-20260708-31-progress.png
- e2e-submit-20260708-32-achievements.png
- e2e-submit-20260708-33-quiz.png
- e2e-submit-20260708-34-stories.png
- e2e-submit-20260708-35-profile-fixed.png
- e2e-submit-20260708-36-progress-fixed.png
- e2e-submit-20260708-37-stories-fixed.png
- e2e-submit-20260708-38-stories-back-home.png
- e2e-submit-20260708-39-revenuecat-subscription.png
- e2e-v1-refinement-01-current.png
- e2e-v1-refinement-02-dark-home.png
- e2e-v1-refinement-03-dark-appearance.png
- e2e-v1-refinement-04-dark-home-pattern.png
- e2e-v1-refinement-05-dark-home-final.png
- e2e-v1-refinement-06-dark-home-readable.png
- e2e-v1-refinement-07-dark-bukhari-books.png
- e2e-v1-refinement-08-dark-bukhari-98-books.png
- e2e-v1-refinement-09-dark-bukhari-full-books.png

## Verification

VERIFIED: `npx tsc --noEmit` passed after the current fixes.

VERIFIED: focused tests passed after the current fixes: book titles, visible collections, route integrity, home template, onboarding access.

VERIFIED: iOS simulator rebuild succeeded with zero errors after the Search, Profile, Progress, and Stories fixes.

PARTIAL: one Xcode pod warning remains for SDWebImage deployment version. It did not block the debug simulator build.

PARTIAL: e2e sweep is still active for destructive or external flows. Account deletion was viewed but not executed, native share sheet was not completed, App Store Connect was not touched, and the XcodeBuildMCP accessibility snapshot is blocked by local Xcode selector state.

VERIFIED: `npm run qa:revenuecat` passed on 2026 07 08 with `default` offering, package count 3, and no missing product IDs.

PARTIAL: `node scripts/ios-go-no-go-audit.mjs` still reports NO GO with three manual blockers: App Store Connect products Ready to Submit, RoPhone paywall proof, and final go/no go doc.

## Submission Posture

PARTIAL: not ready to submit yet. The main visible blockers found in this pass were fixed and receipted, but the final App Store readiness call still needs scoped review of share, notification permission, purchase restore, and account deletion safeguards.
