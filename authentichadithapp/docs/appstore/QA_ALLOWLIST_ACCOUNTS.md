# Authentic Hadith QA Allowlist Accounts

Status: PARTIAL
Owner: Ro / KP
Source of truth: `lib/revenuecat/config.ts`

## Purpose

These are the exact email identities that the app treats as premium for reviewer and QA access.
The match is exact only. No wildcard. No domain wide grant.

## Current roster

| Category | Email | Use |
| --- | --- | --- |
| Reviewer | `apple.reviewer+20260604@authentichadith.app` | Current App Review demo account |
| Reviewer | `apple.reviewer@authentichadith.app` | Legacy App Review demo account |
| QA | `testflight.qa@authentichadith.app` | TestFlight access path |
| QA | `codex.sim.20260711.1333@authentichadith.test` | Simulator verification path |
| QA | `qa.review.01@authentichadith.app` | New reviewer QA slot |
| QA | `qa.review.02@authentichadith.app` | New reviewer QA slot |
| QA | `qa.device.01@authentichadith.app` | New physical device QA slot |
| Internal | `roryleesemeah@icloud.com` | Lifetime access |
| Internal | `g.homira@gmail.com` | Lifetime access |
| Internal | `clashon64@gmail.com` | Lifetime access |

## Rules

1. Keep the list exact. If the app changes, update the code, this file, and the tests together.
2. Do not store passwords here.
3. If a QA account needs to be recreated, create the Supabase Auth user manually and keep the credential outside the repo.
4. If App Review changes the demo email, update the code and this registry in the same change.

## Notes

- The app grants premium on the read side only for these exact emails.
- This is a QA access set, not a public bypass.
- The normal paid gate still applies to every other user.
