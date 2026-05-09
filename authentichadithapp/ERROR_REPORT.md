# ERROR_REPORT.md — Authentic Hadith iOS App
## Active Bug Intake

> **PURPOSE**: Live error intake. Every Claude session reads this file FIRST. If Status is 🔴 ACTIVE, that is the current problem — fix it before doing anything else.

---

## CURRENT ERROR

**Status**: 🔴 ACTIVE

### Headline
AI Summary feature is broken end-to-end on real device — `/api/mobile-chat` returns HTTP 404 on the deployed Vercel host.

### Reproduction
On the internal-device build installed on RoPhone (and reproducible from any client):

1. Open the app → Home tab → tap **AI Summary** under "Hadith of the Moment", OR
2. Open any hadith detail screen → tap **AI Summary**, OR
3. Open Assistant tab → send any prompt.

All three paths fail with the same root cause: a `fetch` POST to `https://authentichadith.app/api/mobile-chat` is 307-redirected to `https://www.authentichadith.app/api/mobile-chat` and the redirected target returns a Next.js 404 page (HTML, not JSON). The mobile UI surfaces the failure as the friendly fallback (post-FIX-037: *"Summary is temporarily unavailable. Please try again later."*), and the Assistant tab surfaces the JSON-parse error as a red error banner.

### Root cause hypothesis
The `/api/mobile-chat` route is missing from the current Vercel deployment serving `authentichadith.app`. The 404 response carries `x-vercel-cache: HIT` with an `etag` `dc07c1d7be439073f002e79594a68780` and `last-modified: Tue, 28 Apr 2026` — i.e. the 404 has been the cached, stable production behavior for at least 11 days. Sibling routes on the same host respond correctly:

| Route | Status |
|---|---|
| `GET /api/chat` | 405 (route exists) |
| `POST /api/chat` | 401 (route exists, requires auth — not the mobile path) |
| `GET /api/mobile-chat` | **404** |
| `GET /api/daily-hadith` | 200 |
| `GET /api/test-groq` | 200 |
| `GET /api/search` | 200 |

So the deployment is healthy in general; only `/api/mobile-chat` is missing. The route used to live at `external/v0-authentic-hadith/app/api/mobile-chat/route.ts` per the parity audit, but the entire `external/v0-authentic-hadith/app/` subtree is no longer present in this repo (only a single Supabase migration remains).

The `GROQ_API_KEY` env var on Vercel is a separate, downstream concern — even if the route is restored, it will return 503 (per the friendly handler in `app/api/chat/route.ts`) unless the secret is set in Vercel → project → Settings → Environment Variables → Production.

### Build identity
- Mobile commit on `main`: `efb4870` ("chore: add internal-device EAS build profile") at the time of audit.
- Internal-device EAS build: `809cceba-69f6-4f2d-892f-7ac0120be1af` (per `EAS_PREVIEW_QA_02.md`) installed on RoPhone.
- Vercel deployment etag (current production): `dc07c1d7be439073f002e79594a68780` (404 page).

### Classification
- **Layer**: VS_CODE_APP_LAYER + external Vercel/web deploy. Not Expo, not Xcode.
- **Type**: BACKEND_ROUTE_ERROR (primary) + secondary UI_FALLBACK_ONLY (already addressed in mobile via FIX-037).

### Severity
**High — blocks ship readiness for the AI Summary feature** that is part of the V1 surface area. The hadith reading and browsing experience is unaffected; only the AI Summary / Assistant features are dead. Mobile already shows a friendly inline fallback per FIX-037 so users are not confronted with a redbox or alert popup.

### Recommended fix paths

**Path A (preferred): redeploy the web app with the route restored.**

1. Locate the canonical source repo for the deployed web app (this monorepo only contains a stub of it under `external/v0-authentic-hadith/`).
2. Confirm that `app/api/mobile-chat/route.ts` is present in that source repo's working tree.
3. Confirm `GROQ_API_KEY` is set in Vercel → Settings → Environment Variables → Production.
4. Trigger a Vercel redeploy.
5. Verify with:
   ```bash
   curl -i -X POST "https://authentichadith.app/api/mobile-chat" \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Test."}]}'
   ```
   Expected: HTTP 200 + JSON body `{ "response": "..." }`. A 503 means env var still missing. A 404 means the route is still not deployed.

**Path B (only if the web source repo is unrecoverable): point the mobile app at a different existing route.**

`POST /api/chat` is live but returns 401. Either (a) provision an unauthenticated path on the website (essentially recreating `/api/mobile-chat`), or (b) ship a server-side function elsewhere (Supabase Edge Function) and update `lib/config/constants.ts` + `lib/api/groq.ts` accordingly. Path B is significantly more work and not appropriate for V1 launch; Path A should be tried first.

### Ruled-out items
- **Mobile endpoint URL is wrong.** Verified: `lib/config/constants.ts` and `lib/api/groq.ts` build the URL the system was designed around. Issue is that the route no longer exists on the backend.
- **Mobile payload shape is wrong.** The mobile `{messages: [...]}` shape matches the contract used by the local `app/api/chat/route.ts` shim. Cannot fully verify against the deployed route while it is 404, but historical parity (FIX-031 narrative) confirms shape was correct when the route was live.
- **App's friendly fallback is broken.** Verified post-FIX-037: hadith detail screen and `HadithCard` both render the friendly inline message. No popup, no redbox.
- **GROQ_API_KEY is the only blocker.** The 404 page has `x-vercel-cache: HIT` and `x-matched-path: /404` — a missing API key would surface as a 503 from the route handler, not a 404 from the Next.js error page. Env var may still be missing, but it is a downstream blocker, not the current one.
- **Reanimated / launch hang.** Resolved by FIX-036; cold launch and warm relaunch are stable.

---

## RELATED DOCUMENT

`V1_CONTENT_AI_AUDIT.md` (FIX-037 audit) contains the full evidence trail, per-collection content counts, the `curl` traces, and the reasoning for the smallest-safe code fixes that were applied this sprint.

---

## INSTRUCTIONS FOR CLAUDE (NEXT SESSION)

1. The blocker above is a backend/Vercel deploy task, **not a mobile code task**. Mobile-side cleanup is already done in FIX-037. Do not attempt to "fix" this in mobile code — the mobile URL and payload are correct.
2. If a new mobile error appears, replace this entire file with a fresh 🔴 ACTIVE intake matching the prior format (Headline, Reproduction, Root cause hypothesis, Build identity, Classification, Severity, Recommended fix paths, Ruled-out items).
3. Do NOT delete or edit `BUILD_FIX_LOG.md` historical entries.
4. Before declaring this 🔴 status resolved: re-run the `curl` from "Path A" step 5 and confirm a 200 + JSON body. Then reset this file to 🟢.
