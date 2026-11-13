# WORKLOG — two Claudes, one repo

Two agents work on WEXT at the same time:
- **cloud** = Claude in the Claude app project (branch `staging`)
- **pc** = Claude Code on Alexander's PC (branch `pc`)

They cannot message each other. This file is the channel. Keep it short.

## Rule (both agents, every task)
1. Before starting: `git fetch` and read this file on **both** `origin/staging` and `origin/pc` (`git show origin/pc:WORKLOG.md`).
2. Add one line under **Log**: `YYYY-MM-DD HH:MM UTC · who · STARTED: what · files`. Commit + push it to your branch right away.
3. When finished: `DONE: what · commit`. If stuck: `BLOCKED: why · what you need`.
4. A file or area marked STARTED by the other agent (and not DONE) is theirs: don't edit it. Pick another task or wait.
5. Areas below have one owner. To take an area, change the owner line in the same commit and say so in the Log.
6. When you merge `staging` ↔ `pc`, keep **all** lines from both sides (newest at the bottom).
7. Never push `main` without Alexander's own "გაუშვი". Release state goes in the Log too.

## Current owners
| Area | Owner | Files |
|---|---|---|
| Firebase rules / live database | pc | `firestore.rules`, Firebase console |
| Calls (WebRTC, TURN) | pc | `src/cloud.js` call part, `src/screens/Chat.jsx` |
| Push notifications | pc | `public/sw.js` push, sender |
| Login / one number = one profile | cloud (client code) + pc (rules) | `src/cloud.js` `restoreByPhone`, `pushProfile` |
| UI, texts, search, prices, finish/rating | cloud | `src/screens/*`, `src/i18n.js`, `src/data.js` |
| Releases (`main`) | whoever Alexander tells "გაუშვი" | `public/sw.js` version |

## Open items
- **Login on a new phone doesn't open the old profile.** Cause: live rules deny reading other users' `/private` docs and writing `movedTo` on old `/users` docs, so `restoreByPhone` fails ("Missing or insufficient permissions"). A safe fix needs a small rules change (a `phones/{key}` lookup readable by exact key only). Cloud writes the client code on `staging`; the rules change waits for Alexander's OK, then pc deploys it.
- `staging` has 3 commits not on `pc` (price questions, rating after done, simpler finish). `pc` has 2 rules commits not on `staging`. Merge both ways before the next release (sw `wext-v12`).

## Log
2026-11-13 21:00 UTC · cloud · DONE: v11 live (b8bcd66 is on staging only, not live)
2026-11-13 21:00 UTC · cloud · STARTED: WORKLOG.md + CLAUDE.md rule · WORKLOG.md, CLAUDE.md
2026-11-13 21:00 UTC · cloud · STARTED: login fix (one number = one profile), client part · src/cloud.js (restoreByPhone, pushProfile, pros listener)
2026-11-13 21:00 UTC · pc · STARTED: rules — calls only between people who share a job/ride/project; rides/projects edited only by owner (others only book/join); request fields per role (client / accepted pro / offered pro) · firestore.rules, Firebase console
