# Open issues — hand-off between cloud Claude and Claude Code

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

## 2. Distance accuracy
Fixed in v7: a request made without real GPS shows "? კმ" to the pro; pros without real GPS are not drawn on the map. Positions are rounded to ~100 m (`round` in cloud.js).
To check on real phones: two phones in Telavi, compare the km shown with Google Maps straight-line distance. Pro positions update on 50 m moves and every 5 min while green.

## 3. Other pending
Real SMS login · real payments (TBC/BOG) · stricter Firestore rules · real admin auth · per-service working hours.

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
