# Authentic Hadith -- App Store Deployment Summary

Generated: 2026-05-20

---

## Blockers Resolved

| # | Issue | Resolution |
|---|---|---|
| 1 | Missing PrivacyInfo.xcprivacy | Already present at `ios/AuthenticHadith/PrivacyInfo.xcprivacy` with all 4 required API categories (UserDefaults, FileTimestamp, DiskSpace, SystemBootTime) |
| 2 | appEnv set to "development" | Changed to `"production"` in `app.json` -> `expo.extra.appEnv` |
| 3 | Missing in-app purchase entitlement | Added `com.apple.developer.in-app-purchases` to `ios/AuthenticHadith/AuthenticHadith.entitlements` |
| 4 | Icon dimensions / alpha check | Verified: 1024x1024px, no alpha channel. Clean. |
| 5 | App Store Connect completeness | See checklist below |

---

## App Store Connect -- Required From KP

These items live in App Store Connect (appstoreconnect.apple.com), not in code. You must fill them manually before Apple will accept a submission.

### App Information Tab
- [ ] App Name: "Authentic Hadith" (confirm no trademark conflicts)
- [ ] Subtitle (30 chars max): e.g. "Verified Prophetic Traditions"
- [ ] Primary Category: "Reference" or "Education"
- [ ] Secondary Category (optional): "Lifestyle" or "Books"
- [ ] Content Rights: Confirm you have rights to all hadith content displayed

### Pricing and Availability
- [ ] Price schedule configured (Free with IAP, or paid tier)
- [ ] Country/region availability set
- [ ] Pre-order settings (if applicable)

### App Privacy (Privacy Nutrition Labels)
- [ ] Privacy Policy URL (required, must be a live public URL)
- [ ] Data collection declarations matching PrivacyInfo.xcprivacy
- [ ] If using Supabase auth: declare "Contact Info" or "Identifiers" as collected
- [ ] If using analytics: declare "Usage Data" and "Diagnostics"

### Version Information (per release)
- [ ] App description (4000 chars max, no placeholder text)
- [ ] Keywords (100 chars max, comma-separated)
- [ ] Support URL (required, must be live)
- [ ] Marketing URL (optional)
- [ ] Screenshots: minimum 3 per required device size
  - [ ] 6.7" display (iPhone 15 Pro Max / 16 Pro Max): 1290 x 2796px
  - [ ] 6.5" display (iPhone 14 Plus): 1284 x 2778px (or use 6.7" set)
  - [ ] 12.9" iPad Pro (if supportsTablet is true): 2048 x 2732px
- [ ] App Preview video (optional but recommended)

### Review Information
- [ ] Contact info for App Review team (name, phone, email)
- [ ] Demo account credentials if app requires login
- [ ] Notes for reviewer explaining any non-obvious features or IAP flows

### In-App Purchases (RevenueCat)
- [ ] IAP products created in App Store Connect and matched to RevenueCat dashboard
- [ ] Subscription group name set
- [ ] Subscription pricing tiers configured
- [ ] RevenueCat API key set to production (not sandbox)
- [ ] "Restore Purchases" button visible in app (confirmed present in settings/subscription.tsx)

### TestFlight (Pre-Submission Testing)
- [ ] Internal testing group created
- [ ] At least one successful TestFlight build uploaded
- [ ] Export compliance set (ITSAppUsesNonExemptEncryption: false -- already configured)
- [ ] Beta App Review submitted (if using external testers)

---

## Build Commands

```bash
# From /Users/kp/Projects/AuthenticHadithApp/authentichadithapp

# Production build for App Store
npx eas-cli build --platform ios --profile production

# Submit to App Store Connect after build completes
npx eas-cli submit --platform ios --profile production
```

---

## Configuration Snapshot

- Bundle ID: com.byred.authentichadith
- ASC App ID: 6764673665
- EAS Project ID: 66afcbbf-55c3-48fb-9bf1-29efc52d09eb
- Version: 1.0.0 (auto-incremented by EAS)
- appEnv: production
- Encryption: non-exempt (no export compliance required)
- Privacy Manifest: complete
- IAP Entitlement: enabled
- Icon: 1024x1024, no alpha
- Min iOS: 12.0
- New Architecture: enabled
