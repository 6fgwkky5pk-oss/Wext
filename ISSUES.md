# Open issues — technical work list

Updated 2026-11-13 at hand-off. Full context: HANDOFF.md.

## 0. Release status
See **WORKLOG.md → RELEASE STATUS** (single source of truth for the live version and published rules).

Read CLAUDE.md first. Work on branch `pc`, merge into `staging`, never push `main` without Alexander's "გაუშვი".
Test only far from Telavi (geo 10,10 or -20,-20) with fresh fake numbers (5550004xx). Never call or send requests to real users.

## 1. Calls on real iPhones (top priority, needs real devices — cloud Claude can't test this)
Code: `src/cloud.js` (startCall / answerCall / incoming listener), `src/screens/Chat.jsx` (Voice, IncomingCall), `src/store.js` (callAudio, unlockAudio, ping).

Already done (v7, tested in headless Chromium only):
- Both press "call" at the same moment → one side ends its own call and answers the other (tie-break by uid). Was: two calls "collide".
- States: calling → (answered) connecting → connected, 25 s connect timeout → "კავშირი ვერ დამყარდა".
- Caller's call doc is ended on `pagehide`; incoming ring ignored after 35 s.
- TURN: public openrelay.metered.ca (unreliable, free). Remote audio via one shared `<audio playsinline>`.

Not verified / still broken:
- Sound on a real iPhone (ringtone + voice). Repro: two phones, one iPhone with the PWA open, call from the other. Check you hear ring and voice, with silent switch on and off.
- Calls arrive late. Suspects: Firestore listener latency, TURN relay slow/failing on mobile data. Measure: log timestamps of setDoc(ringing) vs callee snapshot vs `connected`.
- App in background / screen locked: nothing rings. A web page can't do this on iOS without push.

Suggested plan:
1. Own TURN (coturn on a small VPS, or a paid TURN with credentials from a Cloud Function — never commit secrets).
2. Web Push: service worker `push` handler + VAPID + a sender (needs Firebase Blaze plan for Cloud Functions, or another small server). iOS 16.4+ supports push only for PWAs added to Home Screen.
3. For reliable calls on a locked iPhone: wrap the app with Capacitor and use CallKit/PushKit (iOS) and ConnectionService/FCM (Android). This is the real fix for "ring like a normal phone call".

## Login on a new phone (one number = one profile) — found 2026-11-13
**Cause:** the strict rules (deployed live) block the old `restoreByPhone`: it queried other people's `/private` docs by number (denied) and wrote `movedTo` on old `/users` docs (denied). Console: "restore FirebaseError: Missing or insufficient permissions". So the same number on a new phone opens an empty new profile.
**Fix (client, on `staging` 54f35d6, not live):** a lookup doc `phones/{sha256('wext-phone:'+last9)}` = `{ uids:[...], uid, at }`. Login reads it by exact key, adopts the best old account (name, worker data) and saves its ids in `aliases`. No writes to other people's docs: the pros list hides an account that a newer account lists in `aliases`.
**Needs a rules change (only together with real SMS, owner decision):**
```
match /phones/{key} {
  allow get: if signedIn();          // by exact key only
  allow list, delete: if false;      // nobody can download the list
  allow create, update: if signedIn() && request.auth.uid in request.resource.data.uids
    && request.resource.data.uids.size() <= 10 && request.resource.data.uid == request.auth.uid;
}
```
Limits: while SMS is simulated, anyone who types a number can open that profile anyway (real SMS fixes it). Someone who knows a number could also write a wrong id into its phones doc; real SMS + a Cloud Function should own this doc later.

## Security checklist (before testers, 2026-11-13)
pc (rules, live DB, auth, secrets):
- [x] Strict rules deployed: private phone doc only to its owner; requests only to their sides; calls only between people who share a job; stats/misses admin-only.
- [ ] Review every collection for what an anonymous signed-in stranger can read (`users` is readable by all: name, worker data, position of workers on a 50 m grid).
- [ ] `bugs` / `complaints`: size and rate limits in rules.
- [ ] Users rule `trustSame` + `posOk` after the release.
- [ ] Real SMS auth plan; `phones/{key}` rule only with it.
- [x] Admin PIN removed from the code; admin = `/admins/{uid}` only. Old PIN is still in git history but no longer opens anything.
cloud (app code):
- [x] Text caps (name 40, note 500, chat 1000, complaint 1000, bug 2000), control chars stripped.
- [x] Max 5 new requests and 8 outgoing calls per 10 min (client side; a server limit needs Cloud Functions).
- [x] Clients' location not published; workers' on a 50 m grid; request position on the grid.
- [x] Rating / jobs / no-shows / blocked / verified never sent from the phone.
- [x] Test mode: no card number fields; SMS banner says it is a test.
- [x] No phone numbers or personal data in console logs.
Honest limits: SMS is simulated, so anyone who types a number gets a new profile under that name; client-side limits can be bypassed by a modified app; positions of green workers are visible to signed-in users (50 m).

## 2. Distance accuracy
Fixed in v7: a request made without real GPS shows "? კმ" to the pro; pros without real GPS are not drawn on the map. Positions are rounded to ~100 m (`round` in cloud.js).
To check on real phones: two phones in Telavi, compare the km shown with Google Maps straight-line distance. Pro positions update on 50 m moves and every 5 min while green.

## 3. Other pending
- Real SMS login (provider not chosen) · real payments (TBC/BOG, no contract) · per-service working hours · terms/privacy texts.
- ✅ Firestore rules deployed 2026-11-13 (see Repo privacy note). ✅ Also deployed 2026-11-13: `stats/misses` admin-only; users may only add/raise up to 3 stats counters per write, never delete. Live rules = `firestore.rules` on `pc` (main gets the file on the next release).
- ✅ Admin PIN removed (live since v11). Admin = only `/admins/{uid}`.
- Map tiles: OSM standard tiles are not for heavy production use; pick a provider before launch.
- My-pros tab: the call button reuses the old request thread; verify after a job is finished.
- Test isolation: add a `wext-test` Firebase project or the emulator so tests never touch real users.
- Data cleanup: junk test ride "fd → hxbd"; test users are in region `test`.

## Order of work for calls (decided with Alexander, 2026-11-13)
1. **Own TURN server** (instead of the free public openrelay, so calls connect on every network).
   Alexander does: opens a TURN account or a small VPS (coturn) with the company card and gives the credentials to the server settings only, never into chat or git.
   Claude does: reads the credentials from a Cloud Function / server setting, switches `ICE` in `src/cloud.js`.
2. **Web Push** (sound when the app is closed).
   Alexander does: upgrades Firebase to the Blaze plan (card), creates the VAPID key pair in the Firebase console, confirms the sender (Cloud Functions). Phones: iOS 16.4+ and the app added to the Home Screen.
   Claude does: service worker `push` handler, token saving, sender function.
3. **Capacitor** (ring on a locked screen like a normal call: CallKit/PushKit on iOS, ConnectionService/FCM on Android).
   Alexander does: Apple Developer account ($99/year), Google Play account ($25 once), a Mac or a cloud Mac build service, signing certificates and keys.
   Claude does: wraps `dist/`, native call plugin, store listings text.

Status 2026-11-13 on `pc`: early-ICE-candidate fix, call release on early end, decline ends the callee; real-device tests (delay, sound, simultaneous call, closing the app) are still to be done by Alexander on two phones.

### Prices (USD, checked 2026-11-13 on the official pages; unknown = "unknown")
- TURN: Cloudflare Realtime TURN $0.05 per GB, first 1,000 GB free (https://developers.cloudflare.com/realtime/turn/faq/). Own coturn VPS monthly price: unknown (not checked).
- Firebase: deploying Cloud Functions requires the Blaze plan (https://firebase.google.com/docs/functions/get-started); Blaze is pay-as-you-go with a no-cost usage level (https://firebase.google.com/support/faq). Exact Blaze monthly cost and push-sender cost: unknown.
- Apple Developer Program: $99 per year (https://developer.apple.com/programs/).
- Google Play developer account: $25 one-time (https://support.google.com/googleplay/android-developer/answer/6112435).
Rules: Alexander opens every account and enters the card himself; keys/secrets only in server or environment variables, never in chat or in git.

## Repo privacy (decided with Alexander, 2026-11-13)
The repo stays **public for now**. Next stage: make it private. Two ways: GitHub Pro (~$4/month, Alexander opens it with the company card), or move hosting to Firebase Hosting and then make the repo private. Until then, keep the rule: no secrets, PINs, keys or real phone numbers in git.
Admin: one `/admins/{uid}` doc was created by hand in the Firebase console on 2026-11-13.
