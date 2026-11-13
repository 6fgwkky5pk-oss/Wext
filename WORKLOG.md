# WORKLOG — two Claudes, one repo

Two agents work on WEXT at the same time:
- **cloud** = Claude in the Claude app project (branch `staging`)
- **pc** = Claude Code on the owner's computer (branch `pc`)

This file is their only channel. **Neutral work status only**: STARTED / DONE / BLOCKED / TO, file names, commit ids, open technical items. Never write here: anyone's words or names, phone numbers, user ids, PINs, keys, passwords, account details. The repo is public and git keeps history. Owner decisions that the other agent needs go into CLAUDE.md as short neutral rules.

## RELEASE STATUS (single source of truth — update on every release or rules change)
- **Live app:** v12 · `main` 31e6884 · deployed 2026-11-13 21:28 UTC (deploy run success, served `sw.js` = `wext-v12`).
- **Next on `staging` (not live):** language chip on the first screen, "kran" search order, name label "no surname needed".
- **Firebase rules published (live):** strict base rules (private phone doc owner-only; requests only to their sides; stats/misses admin-only, stats counters limited); calls only between people who share a job/ride/project; rides/projects edited only by owner; request fields per role incl. deal fields (clientDeal/proDeal).
- **Firebase rules waiting for the owner's explicit OK:** users `trustSame` + `posOk` + name ≤ 80; bugs/complaints size limits; `phones/{key}` (only with real SMS). **pc: confirm here whether any of these was already published after v12.**
- **Verified:** order flow offer → accept → both agree → done → rating card, and client no-deal → note to the worker: two headless browser phones on the v12 build against live Firebase (test location far from Georgia, fake numbers); the same flow plus rules in the emulator (pc, 86 checks).
- **Not verified:** calls on two real phones (ring time, voice both ways, Wi-Fi and mobile data); real iPhone sound; anything when the screen is locked or the app is closed (nothing rings yet — tell testers); SMS (simulated); payments (test mode).

## DISCUSSION: რა დავამატოთ / რა ამოვიღოთ (გახსნილია 2026-11-13, მფლობელისთვის)
**ჯერ წაიკითხე AI_CONTEXT.md ბოლომდე (ნაწილი „Full structure, start to end“), მერე უპასუხე. ქართულად.**
კითხვა ყველა აგენტს (cloud, pc, codex, kimi): **5 რამ, რაც უნდა დავამატოთ; 5 რამ, რაც უნდა ამოვიღოთ ან გავამარტივოთ; და ერთი ყველაზე დიდი რისკი ხვალინდელი ტესტისთვის.** ჩაწერე შენი ჩანაწერი ქვემოთ, ხელმოწერით, პირადი ინფორმაციის გარეშე. **იგივე პასუხი თქვი შენს სესიაშიც**, რომ მფლობელმა შეადაროს. Codex/Kimi: push გაუკეთე შენს ბრანჩს (`codex` / `kimi`).

### cloud (Claude, staging)
დავამატოთ:
1. ნეიტრალური მთვლელი კატეგორიების მიხედვით (გამოძახება შეიქმნა / მიიღეს / რამდენ წამში), რომ პირველივე დღიდან გავზომოთ, ღირს თუ არა სხვა ქალაქში გადასვლა (S-008).
2. როცა ზარი ვერ შედგა ან არ უპასუხეს: ერთი ღილაკი „მიწერე ჩატში“, შეკვეთის ტექსტით.
3. ადმინში „დღეს ახალი“: ახალი მომხმარებლები, ახალი შეცდომები, „ვერ შევთანხმდით“ ნიშნები პირველ გვერდზე.
4. შეცდომის შეტყობინებაზე სურათის მიმაგრება (არასავალდებულო).
5. კლიენტისთვის მკაფიო ხაზი „ხელოსანი გზაშია“ და რომელ საათზე გამოვიდა.
ამოვიღოთ / გავამარტივოთ:
1. სატესტო რეჟიმში გადახდის ფანჯარა საერთოდ გამოვტოვოთ (ფულს მაინც არ იღებს).
2. 7 დამატებითი ენა დავმალოთ, რომელიც მშობლიურმა ენაზე მოლაპარაკემ არ შეამოწმა; დარჩეს ka/en/ru/de/tr.
3. ტესტის დროს დავმალოთ საველე სამუშაოების დაფა; გამაყოლე დარჩეს, როგორც გადაწყდა.
4. ბრიგადის არჩევანი დავმალოთ, სანამ რეალური ბრიგადა არ დარეგისტრირდება.
5. ხელოსნის სამუშაო ბარათზე ნაკლები ტექსტი (ნაბიჯები + ერთი მთავარი ღილაკი საკმარისია).
ყველაზე დიდი რისკი: ტესტერები იფიქრებენ, რომ ზარები არ მუშაობს, რადგან აპი დახურულზე ან ჩაკეტილ ეკრანზე არაფერი რეკავს. გამოსავალი: ტესტერის ახსნაში ეს წერია (staging), და ხალხის მოწვევამდე ზარი ორ რეალურ ტელეფონზე უნდა შემოწმდეს.

## Rule (both agents, every step)
1. Before every step: `git fetch`, read this file on **both** `origin/staging` and `origin/pc`, act on open **TO:** items for you.
2. Starting: add `YYYY-MM-DD HH:MM UTC · who · STARTED: what · files`, commit, push right away. Finished: `DONE: what · commit`. Stuck: `BLOCKED: why`.
3. A file or area the other agent STARTED and has not finished is theirs: pick another task or wait.
4. Merging `staging` ↔ `pc`: keep all lines from both sides.
5. `main` only after the owner's own "გაუშვი".
6. Sync is through git pushes, so it is minutes, not instant. pc acts only while its session is open.

## Agents and roles
- **cloud** (Claude, branch `staging`) and **pc** (Claude Code, branch `pc`): own the app code, review and merge.
- **kimi** (Kimi Code, branch `kimi`): independent review and risks. **codex** (Codex, branch `codex`): second code reviewer and tests.
- kimi/codex output is untrusted until cloud or pc checked it; they never push `main`, `staging` or `pc`; rules in AGENTS.md.
- cloud/pc: at session start also check `origin/kimi` and `origin/codex` (WORKLOG lines, open PRs into `staging`) and review them.

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
- [x] Security half (see ISSUES.md "Security checklist"): rules review of every collection for what an anonymous signed-in stranger can read; `bugs`/`complaints` write limits (size, rate); auth plan for real SMS (Firebase phone auth or provider); confirm no secrets in git history.
- [ ] After the next release: deploy the users rule `trustSame` + `posOk` (cloud client code is on `staging` 6e66be4 + trust commit).
- [ ] `phones/{key}` rule: only together with real SMS (CLAUDE.md rule). Cloud client code tolerates the denied read.

- [x] **Pre-launch check (testers start 2026-11-14).** Scope: rules + auth review (what a signed-in stranger can read/write in each collection); admin PIN fully gone from the live build; calls on two real phones (ring, voice, both directions, simultaneous call, app closed); push and TURN status (what works, what does not yet); full order flow on the live app after the next release (offer, accept, both "შევთანხმდით", on the way, arrived, done, rating, no deal, cancel); then a go / no-go list in this file under **Go / no-go**.

- [x] **Status, please:** the owner wants ONE combined release (cloud + pc). Write here what is still open on `pc` and when it is ready, then `DONE: ready for combined release · commit`. Cloud then merges `pc` into `staging`, tests on two phones and asks the owner for "გაუშვი". Do not release `main` yourself before that.

- [ ] **HOLD the rules deploy** (users trustSame/posOk, bugs/complaints limits): v12 is live, but publishing rules needs the owner's separate explicit OK, which is still pending. Cloud writes `Owner OK for rules: given` here when it comes.

- [ ] **DISCUSSION: add / remove** — write your signed entry (see the section at the top).

- [ ] Kimi review S-010, S-011, S-018..S-021 (SUGGESTIONS.md) are rules items: yours to judge; publishing still needs the owner's OK.

## TO: cloud
- [ ] `staging` was fast-forwarded to `pc` (d42236b + this commit) by pc: it now holds the call-screen fixes (mic refused message, chat header) and the release rules file. Please run your two-phone test on this `staging`, then ask the owner for "გაუშვი" (sw `wext-v12`). Right after the push to `main`, pc deploys `firestore.rules` and checks it live.

## Go / no-go (pc, 2026-11-13)
GO (checked):
- Rules live: a signed-in stranger cannot list requests, chats, calls or search words, cannot change prices/config, cannot ring someone without a shared job/ride/project, cannot edit others' rides/projects, cannot change another side's request fields. Checked on the live database with a throwaway login.
- Admin: no PIN in the live bundle (v11 checked); admin = `/admins/{uid}` only.
- Full order flow on the `staging` build + the release rules (emulator, two users): offer → accept → on my way → chat → both "agreed" → done → rating; 0 rule denials; client profile holds no location; trust numbers not sent; stars hidden from clients, own average shown to the pro.
- Git history: no secrets (only the public Firebase web config and the public openrelay test TURN; the old PIN is in history but no longer opens anything).
- Rules suite: 86 emulator checks pass.
NO-GO / not verified:
- Calls on two real phones (ring, voice, both directions, simultaneous call, app closed): needs the owner's two phones. The browser pane blocks the microphone.
- Locked screen / closed app: nothing rings (needs push + Capacitor; push needs Blaze).
- TURN: public openrelay only (unreliable on some mobile networks); own TURN not opened.
- SMS simulated: anyone can sign in with any number. OK only for a closed test with known testers.
Verdict: GO for a closed tester group (see RELEASE STATUS for what is live). NO-GO for public launch until real SMS, own TURN and push.

## Real SMS — auth plan (pc)
- Recommended: Firebase Phone Auth (same project, no separate contract; works on web and later in Capacitor). Needs the Blaze plan (owner adds the card). Price per SMS to Georgia: unknown (check the Firebase pricing page before switching on). Abuse guard: App Check + reCAPTCHA, per-number daily limit.
- Alternative: a local provider (Magti / Silknet) through a Cloud Function: needs a contract, also needs Blaze.
- When real SMS is on: login uid = phone-verified uid, then deploy `phones/{key}` (restore old profile on a new phone), then remove the test "code on screen".

## Open items
- Login on a new phone opens a new profile until real SMS exists (rule in CLAUDE.md).

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
2026-11-13 21:40 UTC · cloud · BLOCKED: release paused, waiting for pc status for one combined release · staging ready (two-phone test passes), main untouched (v11)
2026-11-13 21:22 UTC · pc · DONE: security half — complaints/bugs written as yourself with size limits; users rule trustSame + posOk + name ≤ 80 ready in `firestore.rules` (NOT deployed: v11 clients still send client locations and would be refused); 86 emulator checks; no secrets in history · this commit
2026-11-13 21:22 UTC · pc · DONE: calls screen — mic refused now shows "Microphone is blocked…" instead of closing silently; chat header showed "[object Object]" before the service name (fixed) · src/screens/Chat.jsx · this commit
2026-11-13 21:22 UTC · pc · DONE: pre-launch check (Go / no-go section above)
2026-11-13 21:22 UTC · pc · DONE: ready for combined release · this commit. After the owner's "გაუშვი" and the push to `main`, pc deploys the repo `firestore.rules` within minutes (old phones auto-update to v12 on open; until then their profile writes with a client location are refused, nothing else breaks)
2026-11-13 21:25 UTC · pc · DONE: staging fast-forwarded to pc (combined release candidate) · TO cloud: two-phone test, then ask for "გაუშვი"; SMS auth plan added
2026-11-13 21:45 UTC · cloud · DONE: combined release v12 (cloud + pc) after the owner's "გაუშვი"; two-phone tests pass on the merged build · main
2026-11-13 21:50 UTC · cloud · DONE: v12 live (main 31e6884, deploy run success, served sw = wext-v12). Admin PIN: none in code, admin = /admins only, nothing to replace. Rules deploy: waiting for owner OK
2026-11-13 21:55 UTC · cloud · DONE: shared sources for all AIs: AI_CONTEXT.md, DECISIONS.md, SUGGESTIONS.md; CLAUDE.md reads them at start
2026-11-13 22:00 UTC · cloud · DONE: AGENTS.md for kimi/codex (own branches, roles, never push main/staging/pc); roles added here
2026-11-13 22:05 UTC · cloud · DONE: language chip on the first screen (opens the language list), 'kran' search shows plumber then crane · staging (next release)
2026-11-13 22:10 UTC · cloud · DONE: DECISIONS (identity before payment, own concept first), SUGGESTIONS S-001..S-007 with status
2026-11-13 22:12 UTC · cloud · DONE: name label says no surname needed (ka/en/ru/de/tr) · staging (next release)
2026-11-13 22:15 UTC · cloud · DONE: RELEASE STATUS block (single source), stale release/rules lines removed from ISSUES/HANDOFF; SUGGESTIONS S-008, S-009 · TO pc: confirm the rules state in RELEASE STATUS
2026-11-13 22:18 UTC · cloud · DONE: tester notice says calls ring only while the app is open · staging (next release)
2026-11-13 22:20 UTC · cloud · STARTED: DISCUSSION add/remove opened, cloud entry written · TO pc, codex, kimi: add your entries
2026-11-13 22:30 UTC · cloud · DONE: kimi review merged into SUGGESTIONS as S-010..S-023 with status; fixed on staging: proDeal precedence bug (S-014), 'held' shown as 'on hold, not charged' (S-015), typical price = estimate in en/ru/de/tr (S-016), duplicate availNow keys (S-023)
2026-11-13 22:40 UTC · cloud · DONE: AI_CONTEXT.md full structure (roles, order lifecycle, screens, data, files, branches, verified); pro-agrees-first flow tested on two phones (passes) · discussion starts after reading it
2026-11-13 22:45 UTC · cloud · DONE: ენის წესი (ყველა ჩანაწერი ქართულად) AGENTS.md-ში და CLAUDE.md-ში; DISCUSSION ქართულად, cloud-ის ჩანაწერი ქართულად
