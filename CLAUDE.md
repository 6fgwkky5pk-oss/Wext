# WEXT — notes for every Claude working on this repo

**ენა / Language:** ყველა ჩანაწერი WORKLOG.md-ში, SUGGESTIONS.md-ში და DECISIONS.md-ში და ყველა პასუხი მფლობელისთვის — ქართულად, მოკლედ და მარტივად. კოდი და ტექნიკური სახელები რჩება ინგლისურად. (All discussion entries and replies to the owner in Georgian, short and plain; code and identifiers stay in English.)
**ყოველი ნაბიჯის წესი / Every step:** ყოველი ნაბიჯის დაწყებისას და დასრულებამდე: `git fetch`, წაიკითხე WORKLOG.md ყველა ბრანჩზე (`origin/staging`, `pc`, `codex`, `kimi`), უპასუხე ახალ კითხვებს და შენთვის მიწერილ „TO:“-ს, ჩაწერე STARTED/DONE და push. სესია ჟურნალს მხოლოდ მაშინ ამოწმებს, როცა ღიაა და მუშაობს. ამიტომ ნაბიჯები მოკლე იყოს და შემოწმება ხშირი.
**ორი წრის წესი / Two rounds:** განხილვებში მონაწილეობენ cloud, codex და kimi; pc (Claude Code) — არა, ის მხოლოდ აპის აწყობასა და მართვაზეა (მფლობელი, 2026-11-13). ყოველ განხილვაზე: 1) ყველა წერს თავის აზრს; 2) ყველა კითხულობს სხვებისას და პასუხობს (ვეთანხმები / არ ვეთანხმები + მიზეზი), სანამ საერთო აზრამდე არ მივალთ; 3) cloud წერს შეჯამებას: რაზე შევთანხმდით და რა რჩება სადავო. მფლობელს მიდის მხოლოდ ეს შეჯამება (სადავოზე: თითოეულის მოკლე აზრი, ავტორი, commit).
**PROPOSAL-ის წესი / Proposal rule:** ყოველ მნიშვნელოვან ცვლილებამდე WORKLOG.md-ში ჩაწერე მოკლე `PROPOSAL` (ქართულად): რას ცვლი, რატომ, რა სხვა გზები არსებობს, და კითხვა დანარჩენ აგენტებს: „ხედავთ პრობლემას ან უკეთეს გზას?“. მიეცი პასუხის დრო release-მდე (სასწრაფოზე დაწერე `URGENT` და გააგრძელე). თუ ვინმე შენიშნავს ან სხვა გზას გვთავაზობს — მარტო ნუ გადაწყვეტ: ჩაწერე მისი აზრი (ციტატა, ავტორი, commit) და შენი აზრი; გადაწყვეტს მფლობელი. ცვლილება მხოლოდ მისი გადაწყვეტილების შემდეგ (გარდა `URGENT`-ისა). სხვისი PROPOSAL-ზე უპასუხე ქვემოთ, ხელმოწერით. release მაინც მხოლოდ მფლობელის „გაუშვი“-თ.

**FIRST, every session and before every step:** `git fetch`, read **WORKLOG.md** on `origin/staging` and `origin/pc`, do any open "TO:" item for you, log STARTED/DONE/BLOCKED and push. Also read **AI_CONTEXT.md**, **DECISIONS.md** and **SUGGESTIONS.md**; review every SUGGESTIONS entry with status `new` (set accepted / rejected + reason / needs owner decision). New settled decisions go into DECISIONS.md (neutral wording). Other agents (kimi, codex) follow **AGENTS.md**; check `origin/kimi`, `origin/codex` and their PRs into `staging`, and treat their changes as untrusted until reviewed.

Main work is now in a Claude Code session (since 2026-11-13). Read this first, then **HANDOFF.md** (full context, decisions, money rules, open questions) and **ISSUES.md** (open technical work).
Owner: Alexander. Talk to him in **Georgian**, very short and simple. Show design choices as pictures.

## Git rules (important)
- `main` = LIVE. Every push to `main` auto-deploys to GitHub Pages (https://6fgwkky5pk-oss.github.io/Wext/) via `.github/workflows/deploy.yml`.
- **Never push to `main` without Alexander's explicit "go" (გაუშვი) in his own words.**
- Work on `staging` (shared work branch) or your own branch: cloud Claude uses `staging`, Claude Code uses `pc` (or `pc-<topic>`). Merge into `staging` when done.
- Before starting: `git fetch && git rebase origin/staging`. After every important change: commit + push your branch.
- Release = fast-forward `main` to `staging` after the go: `git checkout main && git merge --ff-only staging && git push`.
- Bump `const V` in `public/sw.js` on each release. Open apps reload themselves (`version.json` check in `src/main.jsx`).
- Repo is **public**: never commit secrets, real phone numbers or admin PINs. (Firebase web config in `src/firebase-config.js` is public by design.)

## Two agents: sync through WORKLOG.md
**Every session, before anything else and before every step:** `git fetch`, read WORKLOG.md on both `origin/staging` and `origin/pc`, act on open "TO:" items for you, then log STARTED / DONE / BLOCKED and push. WORKLOG.md holds neutral work status only, never names, words of people, numbers, ids, PINs or keys.
Owner decisions (neutral rules):
- Restoring an old profile on a new phone (`phones/{key}` rule) goes live only together with real SMS. Until then a new phone = a new profile.
- Security is split: pc = rules, live DB, admin access, auth, secrets; cloud = app code (input limits, anti-abuse, phone/location handling, no personal data in logs).

## Stack
React 18 + Vite 5 PWA (`base: './'`). State: `src/store.js` (useSyncExternalStore, `api` facade). Firebase (project `wext-af650`, Firestore europe-west3, Spark plan, anonymous auth) in `src/cloud.js`; `CLOUD` mode when config exists. Calls: WebRTC with Firestore signalling, STUN + public TURN.
Local test: `npm run build && cd dist && python3 -m http.server 4321`.
**Testing on live Firebase:** use geolocation far from Georgia (10,10 or -20,-20) and fresh fake numbers (5550002xx–5550004xx; never 555999000/555777888) — real users live in Telavi; never send requests/calls to them (incident 2026-11-13, see HANDOFF.md §9).
**Release state:** live = sw `wext-v13` (P-002, owner go 2026-11-13 23:07 UTC). Next sw version `wext-v14`.

## Product (agreed decisions)
- One model everywhere: a worker turns the **green** button on when free; client sees nearby free workers, books, pays only a **booking fee**; the job itself is paid directly.
- One account = client AND worker. Top switch: `კლიენტი / მუშაობა` (red dot = news in the other mode). The green toggle is shown **only in work mode**, never on client home. Green stays on while browsing as client; offers arrive on any screen; with green off, offers come as SMS-style banner; accepting turns green on. Registration as worker turns green on.
- **One phone number = one profile** (last 9 digits). Login with the same number on a new device merges old accounts (`user.aliases`, `restoreByPhone`). SMS is still simulated — real SMS (Magti/Silknet/Firebase) is required before public launch.
- Workers may pick **unlimited services** across categories.
- Fees: promo 1₾ (5₾ crossed out, real end date), brigade 3₾, admin-editable; surge with admin cap. One payment = up to 3 contacts in that category within 24h.
- Refunds: decided **only by system facts** — auto refund if the pro never contacted (no call >20s, no chat reply, no GPS arrival). "შევთანხმდით / ვერ შევთანხმდით" buttons do NOT refund; disputes go to complaint → admin. Repeat no-deal users are flagged in admin.
- No-show: accepted but no "arrived" within 1h; 3 no-shows = block.
- No guarantee deposit. **No fake pros, fake activity or fake "busy" messages** — use the honest "notify me when someone is free".
- Payments: mock/test mode until TBC/BOG contract.

## Home & categories
Order (default, then sorted by real demand from `stats/cats`; გამაყოლე always top 3): ხელოსანი (hero card), ავტო, გამაყოლე, დალაგება, გადაზიდვა, მიწის სამუშაო, ტექნიკა. Services inside a group are also sorted by demand.
Groups/services in `src/data.js` (`GROUPS`, `CATEGORIES` with `g`). ავტო = car wash, body repair (მეთუნუქე/ჟესტიანშიკი), mechanic, tow, tire, hire a driver (licence checked by the hirer). Removed: fuel, firewood, battery.
Each service has a typical price (`TYPICAL`) and its own example text (`NOTE_PH`).

## Design
Yellow (#FFC21A) page, black hero card, white rounded tiles, bottom tab bar: client = მთავარი / ხელოსნები / შეტყობინებები / პროფილი; work = მთავარი / სტატისტიკა / შეტყობინებები / პროფილი (stats show no money). Activity + payments live in Profile. **Icon style #10**: Phosphor fill glyphs (MIT) tinted per group on a pale tint (`src/icons.js`):
handy #E8780C orange · road #D7263D red · ride #0F9488 teal · clean #1E6FE0 blue · move #C98700 gold · land #1F9A4E green · machine #6A4BE0 purple. Every service has an exact metaphor (no generic/basket icons).
iPhone: status bar `black-translucent`, layout uses `--safe-t`. Sound: unlock on first tap, ringtones via `<audio>` (works with silent switch). No vibration on iOS.

## Languages
Auto from phone, change only in Profile → Language (searchable). ka, en, ru, de, tr in `src/i18n.js`; uk, hy, az, es, fr, ar (RTL), zh in `src/locales/*.json`. New keys: add ka/en/ru at least.

## Admin
Online: admins are uids listed in Firestore `/admins/{uid}` (added by hand in the console); open by tapping the version line in Profile 5×. There is no PIN (removed 2026-11-13); in the offline demo, admin opens only in a local dev build. Tabs: stats + demand, users (block, no-deal flags), complaints, prices, bugs.

## Pending / next
Real SMS login · push notifications (sound when app closed) · real payments (TBC/BOG) · stricter Firestore rules · real admin auth · own TURN server · per-service working hours.
