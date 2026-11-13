# WEXT — notes for every Claude working on this repo

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

## Stack
React 18 + Vite 5 PWA (`base: './'`). State: `src/store.js` (useSyncExternalStore, `api` facade). Firebase (project `wext-af650`, Firestore europe-west3, Spark plan, anonymous auth) in `src/cloud.js`; `CLOUD` mode when config exists. Calls: WebRTC with Firestore signalling, STUN + public TURN.
Local test: `npm run build && cd dist && python3 -m http.server 4321`.
**Testing on live Firebase:** use geolocation far from Georgia (10,10 or -20,-20) and fresh fake numbers (5550002xx–5550004xx; never 555999000/555777888) — real users live in Telavi; never send requests/calls to them (incident 2026-11-13, see HANDOFF.md §9).
**Release state:** live = `main` b568622 (sw `wext-v7`). `staging`/`pc` hold unreleased work waiting for Alexander's "გაუშვი" (see HANDOFF.md §3); next sw version `wext-v8`.

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
Groups/services in `src/data.js` (`GROUPS`, `CATEGORIES` with `g`). ავტო = car wash, body repair (მეთუნუქე/ჟესტიანშიკი), mechanic, tow, tire, battery, fuel.
Each service has a typical price (`TYPICAL`) and its own example text (`NOTE_PH`).

## Design
Yellow (#FFC21A) page, black hero card, white rounded tiles, bottom tab bar: client = მთავარი / ხელოსნები / შეტყობინებები / პროფილი; work = მთავარი / სტატისტიკა / შეტყობინებები / პროფილი (stats show no money). Activity + payments live in Profile. **Icon style #10**: Phosphor fill glyphs (MIT) tinted per group on a pale tint (`src/icons.js`):
handy #E8780C orange · road #D7263D red · ride #0F9488 teal · clean #1E6FE0 blue · move #C98700 gold · land #1F9A4E green · machine #6A4BE0 purple. Every service has an exact metaphor (no generic/basket icons).
iPhone: status bar `black-translucent`, layout uses `--safe-t`. Sound: unlock on first tap, ringtones via `<audio>` (works with silent switch). No vibration on iOS.

## Languages
Auto from phone, change only in Profile → Language (searchable). ka, en, ru, de, tr in `src/i18n.js`; uk, hy, az, es, fr, ar (RTL), zh in `src/locales/*.json`. New keys: add ka/en/ru at least.

## Admin
Online: admins are uids listed in Firestore `/admins/{uid}` (added by hand in the console); open by tapping the version line in Profile 5×. The old client-side PIN path is for offline demo only and should be removed; real admin auth is TODO. Tabs: stats + demand, users (block, no-deal flags), complaints, prices, bugs.

## Pending / next
Real SMS login · push notifications (sound when app closed) · real payments (TBC/BOG) · stricter Firestore rules · real admin auth · own TURN server · per-service working hours.
