# COWORK HANDOFF — Produce the migration-spine iOS build (build 46)

**For:** Cowork (terminal + Apple-auth agent). **Self-contained.**
**Context:** The site→app migration spine (shared folder viewer, deep-link aliases, iOS universal links via `associatedDomains`, topic-tag route alias, dark-mode fix) is committed and static-verified. A production iOS EAS build was attempted and **FAILED at signing** because adding `associatedDomains` requires the App ID's provisioning profile to carry the **Associated Domains** capability, and the non-interactive build had no Apple auth to regenerate it. This task = run the build **with Apple authentication** so EAS regenerates the profile and produces the artifact.

- App: **Authentic Hadith** · ASC App ID **6764673665** · Apple Team **LXL3ZMHHK6 (By red llc)** · bundle **com.byred.authentichadith**
- EAS: account **redlantern** · project **@redlantern/authentichadithapp** (`66afcbbf-55c3-48fb-9bf1-29efc52d09eb`) · profile **production**
- Repo: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp` · branch `feat/learn-v2-supabase-20260622` · HEAD **fc8f1fd** (committed, clean tree)
- Failed build: ID `26bf6662-98a6-4a7e-9b3f-779e78547f36`, build number **45**, error: *provisioning profile doesn't include `com.apple.developer.associated-domains`*
- Version source is **remote + autoIncrement** (`eas.json`), so the next build auto-numbers (likely **46**). Do NOT bump `buildNumber` in `app.json`.

---

## OBJECTIVE
A **successful** production iOS artifact for commit `fc8f1fd`, with the Associated Domains entitlement in the regenerated provisioning profile. **Build the artifact only — do NOT submit to App Store / TestFlight.**

## DO THIS — pick the path you can authenticate

### Path A — interactive Apple login (most reliable)
```
cd /Users/kp/Projects/AuthenticHadithApp/authentichadithapp
eas build --platform ios --profile production
```
1. Already logged into EAS as `redlantern` (it skips to credentials).
2. At **"Do you want to log in to your Apple account?"** → **Yes**.
3. Enter the **Apple ID on Team LXL3ZMHHK6 (By red llc)** + password + **2FA** code.
4. EAS detects the new `associatedDomains`, **enables "Associated Domains" on the App ID, regenerates the provisioning profile**, and builds.
5. Wait for **"Build finished"** + the artifact URL.

### Path B — ASC API key, non-interactive (no 2FA prompt; needs the Issuer ID + an App Manager/Admin key)
Key file is on disk: `~/private_keys/AuthKey_L65WW2C698.p8` (Key ID **L65WW2C698**). You supply the **Issuer ID** (ASC → Users and Access → Integrations → App Store Connect API → Issuer ID).
```
cd /Users/kp/Projects/AuthenticHadithApp/authentichadithapp
export EXPO_ASC_API_KEY_PATH="$HOME/private_keys/AuthKey_L65WW2C698.p8"
export EXPO_ASC_KEY_ID="L65WW2C698"
export EXPO_ASC_ISSUER_ID="<paste Issuer ID UUID>"
eas build --platform ios --profile production --non-interactive
```
> If the key is **submit-only** (not App Manager/Admin), EAS errors on the capability/profile step — fall back to Path A.

## RETURN (report these exact receipts to KP)
- EAS build URL
- Final status (finished / errored)
- Assigned iOS build number
- Commit SHA used (expect `fc8f1fd`)
- Profile used (`production`)
- Artifact succeeded? (yes/no)
- Any warnings/errors

## GUARDRAILS — do not cross
- **Do NOT submit** to App Store / TestFlight. Build artifact only. STOP after the artifact succeeds.
- **Do NOT edit** `app.json`, `eas.json`, `lib/auth`, `lib/supabase`, `lib/purchases`, `lib/revenuecat`, AI/assistant routes, quota, summarize, subscriptions.
- **Do NOT remove `associatedDomains`** to force a green build — the whole point is to ship it.
- **Do NOT manually bump `buildNumber`** — remote autoIncrement owns it.
- Build is **pay-as-you-go (paid)** on Rory's EAS account (credits exhausted). One clean run.
- Never echo the `.p8` key contents, Apple password, or 2FA anywhere.
- If any screen/prompt differs from the above or is ambiguous, **STOP and report to KP**.

## AFTER the artifact succeeds
Hand back to KP / Claude for on-device QA via **`docs/QA_BUILD45_MIGRATION.md`** (custom-scheme + universal links + shared folder + topics + dark mode), then the Rule 040 8-item submission gate. The artifact does NOT unlock submission on its own.
