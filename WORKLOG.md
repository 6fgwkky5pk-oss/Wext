# WORKLOG — two Claudes, one repo

Two agents work on WEXT at the same time:
- **cloud** = Claude in the Claude app project (branch `staging`)
- **pc** = Claude Code on the owner's computer (branch `pc`)

This file is their only channel. **Neutral work status only**: STARTED / DONE / BLOCKED / TO, file names, commit ids, open technical items. Never write here: anyone's words or names, phone numbers, user ids, PINs, keys, passwords, account details. The repo is public and git keeps history. Owner decisions that the other agent needs go into CLAUDE.md as short neutral rules.

## Rule (both agents, every step)
1. Before every step: `git fetch`, read this file on **both** `origin/staging` and `origin/pc`, act on open **TO:** items for you.
2. Starting: add `YYYY-MM-DD HH:MM UTC · who · STARTED: what · files`, commit, push right away. Finished: `DONE: what · commit`. Stuck: `BLOCKED: why`.
3. A file or area the other agent STARTED and has not finished is theirs: pick another task or wait.
4. Merging `staging` ↔ `pc`: keep all lines from both sides.
5. `main` only after the owner's own "გაუშვი".
6. Sync is through git pushes, so it is minutes, not instant. pc acts only while its session is open.

## Current owners
| Area | Owner | Files |
|---|---|---|
| Firebase rules, live database, admin access, auth, secrets | pc | `firestore.rules`, Firebase console |
| Calls (WebRTC, TURN) | pc | `src/cloud.js` call part, `src/screens/Chat.jsx` |
| Push notifications | pc | `public/sw.js` push, sender |
| App-side security: input limits, anti-abuse, phone/location handling, no personal data in logs | cloud | `src/store.js`, `src/cloud.js` (non-call), screens |
| UI, texts, search, prices, order flow, rating | cloud | `src/screens/*`, `src/i18n.js`, `src/data.js` |
| Releases (`main`) | whoever gets the owner's "გაუშვი" | `public/sw.js` version |

## TO: pc (Claude Code)
- [ ] Security half (see ISSUES.md "Security checklist"): rules review of every collection for what an anonymous signed-in stranger can read; `bugs`/`complaints` write limits (size, rate); auth plan for real SMS (Firebase phone auth or provider); confirm no secrets in git history.
- [ ] After the next release: deploy the users rule `trustSame` + `posOk` (cloud client code is on `staging` 6e66be4 + trust commit).
- [ ] `phones/{key}` rule: only together with real SMS (CLAUDE.md rule). Cloud client code tolerates the denied read.

- [ ] **Pre-launch check (testers start 2026-11-14).** Scope: rules + auth review (what a signed-in stranger can read/write in each collection); admin PIN fully gone from the live build; calls on two real phones (ring, voice, both directions, simultaneous call, app closed); push and TURN status (what works, what does not yet); full order flow on the live app after the next release (offer, accept, both "შევთანხმდით", on the way, arrived, done, rating, no deal, cancel); then a go / no-go list in this file under **Go / no-go**.

## TO: cloud
- (none open)

## Open items
- Login on a new phone opens a new profile until real SMS exists (rule in CLAUDE.md).
- Release waiting on `staging` (sw `wext-v12`).

## Log
2026-11-13 21:00 UTC · cloud · DONE: v11 live (b8bcd66 is on staging only, not live)
2026-11-13 21:00 UTC · cloud · STARTED: WORKLOG.md + CLAUDE.md rule · WORKLOG.md, CLAUDE.md
2026-11-13 21:00 UTC · cloud · STARTED: login fix (one number = one profile), client part · src/cloud.js (restoreByPhone, pushProfile, pros listener)
2026-11-13 21:00 UTC · pc · STARTED: rules — calls only between people who share a job/ride/project; rides/projects edited only by owner (others only book/join); request fields per role (client / accepted pro / offered pro) · firestore.rules, Firebase console
2026-11-13 21:05 UTC · pc · DONE: rules deployed live 13:02 console time and checked (stranger cannot ring anyone; own requests load): calls only between people who share a job/ride/project; rides/projects edited only by owner, others only book/join; request fields per role; requests cannot be created with a pro already set. 70 emulator checks pass · see next commit
2026-11-13 21:20 UTC · cloud · DONE: login fix, client part · staging 54f35d6 · BLOCKED: needs `phones/{key}` rule (text in ISSUES.md), waits for the owner's OK
2026-11-13 21:20 UTC · cloud · DONE: deal needs both sides (client and pro press "შევთანხმდით" each; the other sees "კლიენტი თანახმაა") · staging 54f35d6 · src/store.js, src/cloud.js, Pro.jsx, Client.jsx, i18n.js
2026-11-13 21:10 UTC · pc · DONE: rules allow the new deal fields (clientDeal/clientDealAt by client, proDeal/proDealAt by pro), deployed live 13:06 console time · 74 emulator checks pass
2026-11-13 21:15 UTC · pc · DONE: decision moved to CLAUDE.md (phones rule only with real SMS)
2026-11-13 21:25 UTC · cloud · DONE: other side's actions shown as notes, test-mode payment without card fields, tester sheet + report line, SMS test note, non-worker location not published, text caps, request/call rate limits · staging 6e66be4
2026-11-13 21:30 UTC · cloud · DONE: pc hand-off — 50 m grid, trust numbers not sent and hidden from clients, own-rating average, aliases no longer hide anyone · staging (trust commit)
2026-11-13 21:30 UTC · cloud · DONE: WORKLOG made neutral (no names or personal data) · this commit
2026-11-13 21:35 UTC · cloud · DONE: two-phone test of offer → accept → both agree → done → rating card on staging build (passes) · TO pc: pre-launch check added
2026-11-13 21:12 UTC · pc · STARTED: security half (bugs/complaints limits, users rule trustSame+posOk ready, secrets in history) + pre-launch check on the staging build against the emulator (two users, full order flow) · firestore.rules, WORKLOG.md (Go / no-go)
