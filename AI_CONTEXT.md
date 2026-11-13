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

## How to give feedback
Write suggestions as short numbered points: **what**, **why**, **how to check it worked**. Do not invent facts about the code. Say when you are guessing. The owner pastes your answer into `SUGGESTIONS.md`; the developer AIs review each one and mark it accepted or rejected with a reason.

Also read: `DECISIONS.md` (settled decisions; do not re-open them without a new reason) and `SUGGESTIONS.md`.
