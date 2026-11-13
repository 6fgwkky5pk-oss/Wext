# WEXT — brief for any AI (read this first)

You are helping develop **WEXT**, a mobile web app (PWA) that connects people who need a job done right now with nearby workers who are free right now. This file is self-contained and public. It holds no personal data and no secrets. Code: https://github.com/6fgwkky5pk-oss/Wext (branch `staging` = next version, `main` = live).

## The idea in one line
A worker turns a **green button** on when free. A client sees free workers nearby, books one, and pays only a small **booking fee**. The job itself is paid directly between them.

## Rules of the product
- **One account = client and worker.** A top switch: `კლიენტი / მუშაობა` (client / work). The green button is shown only in work mode.
- **One phone number = one person.**
- A worker may offer **any number of services** across categories. Optional typical prices per service.
- **Booking fee** only (promo 1₾ instead of 5₾; brigades 3₾; admin can change; surge with a cap). One payment = up to 3 contacts in that category within 24 h.
- **Refunds are decided only by system facts**: automatic refund if the worker never made contact (no call over 20 s, no chat reply, no arrival). Buttons like "we agreed / no deal" never refund; disputes go to a complaint and an admin.
- **Agreement needs both sides**: client and worker each press "შევთანხმდით" (we agreed).
- **No-show**: accepted but not arrived within 1 h. 3 no-shows = blocked.
- **Honesty**: no fake workers, no fake activity, no fake "busy" messages. If nobody is free: "notify me when someone is free".
- Categories (home order, then sorted by real demand): handyman, car services, ride-along, cleaning, moving, earthworks, machinery.
- Languages: Georgian first; English, Russian and more. Very short, simple words everywhere.
- Style: warm yellow page, black hero card, white rounded tiles, one main button per screen.

## How it is built
React 18 + Vite 5 PWA. Firebase (Firestore + anonymous auth) for data, strict security rules. Calls: WebRTC in the app (Firestore signalling, STUN + a public TURN).

## Current state (2026-11-13)
- Live version v12. A closed group of testers starts on 2026-11-14.
- **Simulated / not real yet:** SMS login (code shown on screen), payments (test mode, no card numbers asked), push notifications (nothing rings when the app is closed), own TURN server.
- Ratings and job counts are hidden from clients until the server counts them.

## Open questions (good places to help)
1. Real SMS login provider and how to stop abuse.
2. Payments with a Georgian bank (test → real).
3. Ringing on a locked phone (push + native wrapper).
4. Fair matching: who gets the offer first.
5. Wording: short, clear Georgian texts.

## Full structure, start to end

### Roles and account
One phone number = one account. Every account is a **client**; it becomes a **worker** too after the worker registration (services, optional prices, how they work). The top switch `კლიენტი / მუშაობა` changes mode; a red dot shows news in the other mode. A worker can stop working any time (the account stays a client).

### Order lifecycle (client ↔ worker)
1. **Search**: client types or speaks; search understands slang, Latin typing and typos, in any language. Or taps a category tile.
2. **Nearby free workers**: map + list of workers with the green button on, sorted by distance; first name, initials avatar, distance, optional price with level (affordable / average / a bit pricey). No phone number is ever shown.
3. **Booking fee**: client pays the fee (test mode now: no card, no money). The fee is **held**, not charged.
4. **Dispatch**: the request goes to the 3 nearest free workers (75 s window), then the radius grows 3 → 6 → 12 km. Workers with green off get an SMS-style banner. If nobody: "notify me when someone is free" (honest, no fake workers).
5. **Accept**: first worker to accept gets the job (transaction); the others see "taken by another worker".
6. **Contact**: in-app call (internet call) or chat. A call over 20 s, a chat reply or "arrived" counts as real contact → the held fee is **charged**.
7. **Worker steps**: "on my way" → "arrived" → "done".
8. **Agreement**: client and worker each press "შევთანხმდით"; it counts only when both did. Either side can press "ვერ შევთანხმდით" → closed; the other side is told.
9. **Finish**: worker presses "done" → client sees "the worker finished" with stars, or "not finished" with a text box (goes to admin as a complaint), or "later". No answer in 24 h = done.
10. **Rating**: only after the work is done. Stars and job counts are hidden from clients until the server counts them.
11. **Cancel**: client can cancel while searching (fee released if no contact).
12. **No-show**: accepted but not arrived within 1 h; 3 = blocked (server enforcement still open).
13. **Refunds**: only by facts (no contact → automatic). Buttons never refund; disputes → complaint → admin.

### Screens and bottom menu
- Client mode: **Home** (search, categories, nearby) · **My workers** (people I used, call again) · **Messages** · **Profile** (activity, payments, language, help, report a problem, stop working).
- Work mode: **Home** (active jobs with steps, green button, my services) · **Stats** (no money) · **Messages** · **Profile**.
- Full-screen: request tracking, chat, call, incoming offer, worker registration, admin (opened only for admin accounts).

### Data (Firebase, plain terms)
- `users/{id}`: public profile — first name, worker services/prices/type, worker position on a ~50 m grid (clients: none).
- `private/{id}`: phone number, readable only by its owner.
- `requests/{id}`: one order — category, note, client side, offered workers, accepted worker, steps, deal flags, rating. Readable only by its sides.
- `threads/{id}/msgs`: chat of one order. `calls/{id}`: call signalling between the two sides only.
- `config/main`: prices, promo, search words (admin writes). `stats`: demand counters. `complaints`, `bugs`: read by admin only. `admins/{id}`: admin list (set by hand).
- Login is anonymous Firebase auth + a simulated SMS code.

### Repo files
- `src/App.jsx` shell, tabs, notes · `src/store.js` app state and actions (`api`) · `src/cloud.js` Firebase reads/writes, listeners, calls · `src/payments.js` test payments · `src/data.js` categories, prices, slang search · `src/i18n.js` + `src/locales/*` texts · `src/icons.js` icons · `src/Map.jsx` map · `src/screens/` Onboarding, Client, Pro, Chat, Profile (+admin), Tabs, Projects (boards).
- `firestore.rules` security rules · `public/sw.js` service worker (version = release) · `.github/workflows/deploy.yml` deploy.
- Docs: AI_CONTEXT (this), DECISIONS, SUGGESTIONS, WORKLOG (status + RELEASE STATUS), AGENTS (rules for agents), CLAUDE/HANDOFF/ISSUES (technical).

### Branches and release
`main` = live (every push deploys). `staging` = next version (cloud Claude). `pc` = Claude Code. `kimi`, `codex` = review branches. Release only after the owner's explicit go; Firebase rules need a separate explicit OK.

### Verified / not verified
See WORKLOG.md → RELEASE STATUS. In short: order flow verified on two test browser phones and in the emulator; calls on real phones, locked-screen ringing, real SMS and real payments are not.

## How to give feedback
Write suggestions as short numbered points: **what**, **why**, **how to check it worked**. Do not invent facts about the code. Say when you are guessing. The owner pastes your answer into `SUGGESTIONS.md`; the developer AIs review each one and mark it accepted or rejected with a reason.

AI agents with repo access (Codex, Kimi Code): follow **AGENTS.md**.

Also read: `DECISIONS.md` (settled decisions; do not re-open them without a new reason) and `SUGGESTIONS.md`.
