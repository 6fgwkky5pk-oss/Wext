# Suggestions from other AIs (Kimi, ChatGPT, …)

How to add: paste below, one entry per idea. Developer AIs (cloud Claude, Claude Code) review each entry at session start and set the status.
Never paste personal data, phone numbers, passwords or keys here: this file is public.

Template:
```
### S-001 · <short title>
- Source: <AI name> · Date: YYYY-MM-DD
- Idea: <what>
- Why: <reason>
- Status: new | accepted (commit/plan) | rejected (reason) | needs owner decision
```

---

### S-001 · Anonymity until contact (name, photo, phone hidden before payment)
- Source: Kimi · Date: 2026-11-13
- Status: decided differently — first name visible, no surname, photo optional, phone never shown (DECISIONS 2026-11-13)

### S-002 · 3 nearest workers with free price comparison and a free second chance
- Source: Kimi · Date: 2026-11-13
- Status: not adopted — current rule stays: 1 payment = up to 3 contacts in that category within 24 h; optional prices are already visible before paying

### S-003 · Wave search with a visible timer
- Source: Kimi · Date: 2026-11-13
- Status: idea for later (the app already widens the radius 3 → 6 → 12 km with a 75 s window)

### S-004 · Route for the client after agreement
- Source: Kimi · Date: 2026-11-13
- Status: idea for later (the worker already has a route button)

### S-005 · "სპეცი" rank for consistently good workers
- Source: Kimi · Date: 2026-11-13
- Status: after real ratings are counted on the server

### S-006 · Five languages and slang search
- Source: Kimi · Date: 2026-11-13
- Status: already exists (auto from phone, 12 languages, slang search); the language switch is now also on the first screen (staging f2b0e5a)

### S-007 · Rating only after the work is finished
- Source: Kimi · Date: 2026-11-13
- Status: already exists (live v12)

### S-008 · Scale-up metric before opening the next city
- Source: Codex · Date: 2026-11-13
- Idea: per category, the share of requests in the launch city that got a worker response (accepted) within a set time. Measured from neutral event counts only (request created / accepted / time to accept), no personal data. Decide the threshold before the test, then measure.
- Status: needs owner decision (the threshold and the time limit)

### S-009 · Tell testers that calls do not ring on a locked screen; test calls on two real phones (Wi-Fi and mobile data)
- Source: Codex · Date: 2026-11-13
- Status: accepted — the tester notice will say it; real-phone call test is in RELEASE STATUS "not verified"

### S-010 · Call participants can be rewritten after creation (call redirect)
- Source: Kimi · Date: 2026-11-13
- Idea: `firestore.rules:66-67` — `allow update: if callSide(resource.data)` does not freeze `from`/`to`. The caller can update `to` to ANY uid after creation; that person's app rings (listener is `where('to','==',uid)`), bypassing the "calls only between people who share a job/ride/project" rule. Fix sketch: on update require `request.resource.data.from == resource.data.from && request.resource.data.to == resource.data.to` and `diff().affectedKeys().hasOnly(['state','answer'])`.
- Why: harassment/spam vector: anyone can make any user's phone ring with a fake caller name, and pull them into a WebRTC session. Breaks a stated safety rule.
- How to check: emulator test — create a call to a legit thread partner, then update `to` to a third uid; it must be denied after the fix.
- Status: TO pc (rules)

### S-011 · Request create has no field whitelist or size caps
- Source: Kimi · Date: 2026-11-13
- Idea: `firestore.rules:57` — create checks only `clientId` and `proId == null`. A modified client can create a request with `notified: [<every uid>]` (mass full-screen "new job" spam with a custom note), a 1 MB `note`/`photo` string, or any `status`. Add `keys().hasOnly([...])`, `notified == []`, `status == 'searching'`, and `shortText` caps for note/clientName plus a length cap for photo/voice data URLs.
- Why: one bad actor can broadcast to every online pro and inflate storage/reads (cost).
- How to check: emulator — create with non-empty `notified` or a 10 KB `note` must be denied.
- Status: TO pc (rules)

### S-012 · Payment truth lives on the client (localStorage)
- Source: Kimi · Date: 2026-11-13
- Idea: `src/store.js:175-192, 246-260` — bundle/hold/capture/release are decided from `state.payments`, persisted in localStorage. With a real provider, edited localStorage = unlimited free requests; rules never check `payId`. Also capture/release only run while the CLIENT's app is open (listeners + `setInterval`): if the client closes the app after booking, a real hold is never captured and never released until the bank auto-expires it. Move preauth/capture/release to a Cloud Function and have rules require a function-written `payId`.
- Why: core money rule ("charged only on real contact", "auto-refund if no contact") cannot be enforced client-side; this is the launch-blocking piece for real payments.
- How to check: close the client app after booking, let the pro reply in chat from another device — the hold must still capture (server side), and refund when nobody contacts.
- Status: accepted — needs server side with real payments (Blaze + Cloud Functions); test mode only now

### S-013 · No-show auto-block does not work in cloud mode
- Source: Kimi · Date: 2026-11-13
- Idea: `src/store.js:368-375` sets `blocked`/`noShows` only in local state, and the `blockedIds` subscriber (`store.js:419`) immediately recomputes `blocked` from the admin list and reverts it; the request doc on the server stays `accepted` forever. The "3 no-shows = blocked" rule (DECISIONS) is currently unenforced.
- Why: trust rule silently broken; bad pros are never blocked.
- How to check: emulator, pro accepts 3 jobs and never presses "arrived" → after 1 h each, the pro must be blocked server-side, not just locally.
- Status: accepted — needs server side (Cloud Function); owner informed

### S-014 · proDeal precedence bug — pro sees the deal buttons again after pressing agree (fixed on staging)
- Source: Kimi · Date: 2026-11-13
- Idea: `src/cloud.js:190` — `r.proDeal || null === 'cancelled' ? 'cancelled' : r.status` parses as `(r.proDeal || false) ? 'cancelled' : r.status`, so any set proDeal becomes `'cancelled'`. Then `Pro.jsx:43-44` shows the agree/no-deal buttons again after the pro pressed "შევთანხმდით" and never shows "waiting for the client". One-line fix pushed on branch `kimi`: `proDeal: r.proDeal || null`.
- Why: confusing UI in the most sensitive moment of the flow (deal confirmation).
- How to check: two users, pro presses agree → buttons must be replaced by "შენ დაადასტურე. ველოდებით კლიენტს."
- Status: accepted — fixed on staging (cloud)

### S-015 · The "held" state is labeled "Paid" in all 5 languages
- Source: Kimi · Date: 2026-11-13
- Idea: `src/i18n.js:74,158,242,325,418` — the hold (money NOT yet charged) shows გადახდილი / Paid / Оплачено / Bezahlt / Ödendi, contradicting the trust line "charged only when the pro contacts you". Suggest ka 'დაბლოკილია (ჯერ არ ჩამოიჭრა)', en 'On hold', ru 'Заморожено', de 'Reserviert', tr 'Beklemede'.
- Why: clients will think they were charged before contact → refund complaints and lost trust.
- How to check: book a request; the badge before first contact must say "on hold", not "paid".
- Status: accepted — fixed on staging (cloud)

### S-016 · typicalNote lost its "estimate only" meaning outside Georgian
- Source: Kimi · Date: 2026-11-13
- Idea: `src/i18n.js:13` (ka: "მხოლოდ ორიენტირია. ზუსტ ფასს ხელოსანთან შეთანხმდები") vs en/ru/de/tr lines 97/181/346/439 ("you pay this to the pro directly" etc.) — the non-Georgian texts read like a fixed price. Suggest en: 'Estimate only — you agree the exact price with the pro.' (Turkish line 439 also has a typo: "typicalNoteunu".)
- Why: price disputes ("the app said 20–60").
- How to check: switch language to English — the typical-price card must say it is only an estimate.
- Status: accepted — fixed on staging (cloud)

### S-017 · Surge: badge says "high demand" but the trigger is low supply; manual surge is dead code
- Source: Kimi · Date: 2026-11-13
- Idea: `src/store.js:75-83` + `src/screens/Client.jsx:168` — surge rises when FEW online pros are nearby (`near === 0` → 1.5×) and is labeled "მაღალი მოთხოვნა / High demand". Charging more exactly when nobody is available feels unfair and is mislabeled. Also `store.js:77`: `(cfg.surgeManual && !cfg.surgeMode)` is never true because surgeMode 'off' is truthy — the manual surge switch does nothing.
- Why: money + trust; admin toggle silently broken.
- How to check: set surgeManual=true, surgeMode='off' in admin → price must change (currently does not); badge text must match the real trigger.
- Status: needs owner decision (surge wording and trigger)

### S-018 · Boards: joins/bookings content is not validated
- Source: Kimi · Date: 2026-11-13
- Idea: `firestore.rules:74-79` — any signed-in user may update `joins`/`bookings` with ANY content: wipe other people's bookings or insert fake ones (any userId/name/count). Validate entries (userId == request.auth.uid, count bounds, no removing others).
- Why: one bad actor can empty every ride's seats or a project's crew list.
- How to check: emulator — a non-owner update that removes another user's join must be denied.
- Status: TO pc (rules)

### S-019 · config/main exposes blockedIds to everyone
- Source: Kimi · Date: 2026-11-13
- Idea: `firestore.rules:49` + `src/cloud.js:115-120` — `config` is world-readable and carries the blocked uid list. Split: public `config/main` (prices, syn) vs admin-only `config/blocks`.
- Why: moderation list is public; blocked users can enumerate and evade with fresh accounts while watching the list.
- How to check: signed-in non-admin read of the blocklist doc must be denied.
- Status: TO pc (rules)

### S-020 · stats/cats counters can be SET, not only incremented
- Source: Kimi · Date: 2026-11-13
- Idea: `firestore.rules:53-54` — `statsOk()` caps the number of changed keys but not values; a modified client can write `handyman: 999999` and bend the demand ranking. Cap the delta per key (e.g. new value within [old, old+5]).
- Why: home-screen ordering and "demand" stats become manipulable.
- How to check: emulator — a write jumping a counter by >5 must be denied.
- Status: TO pc (rules)

### S-021 · Notified pros keep read access to the request forever
- Source: Kimi · Date: 2026-11-13
- Idea: `firestore.rules:11,56` — every notified pro (up to 8) keeps reading the request after someone else accepted: status changes, the rating, the client's grid position and note. Consider `reqSide` for notified only `while resource.data.status == 'searching'`.
- Why: privacy of the client and of the deal outcome.
- How to check: emulator — a notified-but-not-accepted pro must lose read access once status becomes 'accepted'.
- Status: TO pc (rules)

### S-022 · Promo end date uses the device clock
- Source: Kimi · Date: 2026-11-13
- Idea: `src/store.js:74` — `promoActive` compares against local device time; a changed clock extends the promo. Fine in test mode; must become server-side together with S-003.
- Why: money rule enforcement.
- How to check: set the device date back → promo price must NOT apply once real payments exist.
- Status: accepted — server side with real payments

### S-023 · Duplicate `availNow` keys in ka/en/ru
- Source: Kimi · Date: 2026-11-13
- Idea: `src/i18n.js:10&12, 94&96, 178&180` — the key appears twice; the later one silently wins and the first is dead code. Remove one per language.
- Why: future edits may change the dead copy and confuse everyone.
- How to check: build passes and `notifyAvail` text still shows correctly in ka/en/ru.
- Status: accepted — fixed on staging (cloud)
