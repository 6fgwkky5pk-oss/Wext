# WEXT — full hand-off (written 2026-11-13 by cloud Claude)

Read this first, then `CLAUDE.md` (short rules) and `ISSUES.md` (open technical work).
Owner: **Alexander**. Talk to him in **Georgian**, short and simple. Show design choices as pictures, not long text.
The repo is **public**, so it holds no passwords, PINs, keys or real phone numbers. Where secrets live is listed in §4.

---

## 1. What WEXT is

- **Product:** a "call a pro now" app. A worker turns on the **green** button when free. A client sees free workers nearby, books one, and pays only a small **booking fee** to WEXT. The job itself is paid directly between client and worker (cash or transfer). WEXT never handles the job money.
- **Groups (7):**

  | Group | Services |
  | --- | --- |
  | ხელოსანი (handyman) | plumber, electrician, appliance repair, handyman, painter, tiler, carpenter, locksmith |
  | ავტო (car) | car wash, body repair, mechanic, tow, tyre, battery, fuel delivery |
  | გამაყოლე (ride-along) | free seats in cars going somewhere |
  | დალაგება (cleaning) | home, office, windows |
  | გადაზიდვა (moving) | truck with driver, movers |
  | მიწის სამუშაო (land work) | harvest, digging, garden, firewood |
  | ტექნიკა (machinery) | tractor, excavator, crane |

- **Name:** WEXT. Trademark and domains (`wext.ge`, `getwext.com`) are **not registered yet**; Alexander will do it.
- **Launch market:** Telavi, Georgia. It must *feel global* from day one: never write "pilot" or "test city" in the UI.
- **Next markets (code-ready):** `src/data.js` `REGIONS` has Georgia (GEL ₾), Turkey (TRY ₺) and Germany (EUR €) with currency picked by GPS. UI has 12 languages.
- **Global plan (agreed direction, no dates set):**
  1. Telavi.
  2. The rest of Georgia (Tbilisi, Batumi, Kutaisi).
  3. Nearby countries with the same need: Turkey, Armenia, Azerbaijan, Ukraine.
  4. EU (Germany first).

  Same app and model everywhere. Only the prices and the payment provider change per country.
- **Platforms:** today a PWA (install from the link). Later, the same code is wrapped with Capacitor for Google Play and the App Store.

## 2. Agreed decisions (all made with Alexander)

| Date | Decision |
| --- | --- |
| 2026-11-11 | Build for web and mobile both (PWA first). |
| 2026-11-13 | **One model everywhere:** green = available; client books; booking fee only. The old dated "need people"/projects board was removed from the UI. |
| 2026-11-13 | **One account = client and worker.** Top switch `კლიენტი / მუშაობა`. Green stays on while browsing as client, and offers arrive on any screen. With green off, offers come as an SMS-style banner; accepting turns green on. Registering as a worker turns green on. |
| 2026-11-13 | **Brigades:** request toggle "1 კაცი / ბრიგადა"; brigade shows as "brigade, N people" and pays a higher fee. |
| 2026-11-13 | **Fees:** promo 1₾ with 5₾ crossed out and a real end date; brigade 3₾; ride 1₾ per seat; all admin-editable; surge on shortage with an admin cap. One payment = up to 3 contacts in the same category within 24 h. |
| 2026-11-13 | **No guarantee deposit.** |
| 2026-11-13 | **Fee is decided only by system facts.** A refund happens automatically only if there was no contact: no call over 20 s, no chat reply from the pro, no GPS "arrived". The buttons "შევთანხმდით / ვერ შევთანხმდით" (agreed / no deal) do **not** refund. Disputes go to complaint → admin. Repeat "no deal" users are flagged in admin. |
| 2026-11-13 | **No-show:** accepted but no "arrived" within 1 h. 3 no-shows = block. |
| 2026-11-13 | **No fake pros, fake activity or fake "busy" messages.** Use the honest "🔔 notify me when someone is free". (Alexander once asked for "many registered pros" to be shown; this was declined.) |
| 2026-11-13 | **Simplifications:** one main button per screen, voice note, photo, typical price per service, one-tap call, voice search, "repeat last pro", large-text mode. |
| 2026-11-13 | **Category order:** ხელოსანი (hero card), ავტო, გამაყოლე, დალაგება, გადაზიდვა, მიწის სამუშაო, ტექნიკა. After that, sorted by real demand (`stats/cats`), with გამაყოლე always in the top 3. Services inside a group are also sorted by demand. |
| 2026-11-13 | **Icons:** style **#10**. Alexander called earlier sets "childish" and picked #10 out of 10 options. Every service has an exact metaphor (no basket for appliance repair). |
| 2026-11-13 | **Each service has its own example text** in the request form (`NOTE_PH`). |
| 2026-11-13 | **One phone number = one profile** (last 9 digits). The same number on a new or lost phone opens the same profile, with accounts merged. |
| 2026-11-13 | **Workers may pick unlimited services** across categories (e.g. car wash by day, electrician by evening). |
| 2026-11-13 | **Distances must be accurate:** live GPS, metres under 1 km, "?" when unknown. |
| 2026-11-13 | **Auto-update:** open apps reload themselves on a new release; nothing to do on the phone. |
| 2026-11-13 | **iPhone:** app colour under the Dynamic Island; sound must work (silent switch too). |
| 2026-11-13 | **Deploy rule:** nothing goes live without Alexander's own "გაუშვი". |
| 2026-11-13 | **Green toggle only in work mode** (hidden from client home). |
| 2026-11-13 | **Bottom menu:** client = მთავარი / ხელოსნები / შეტყობინებები / პროფილი; work = მთავარი / სტატისტიკა / შეტყობინებები / პროფილი. Activity and payments move into Profile. Stats show **no money** (Alexander picked "option 2, no income"). A red dot on the top switch means news in the other mode. |
| 2026-11-13 | **Calls work order:** own TURN → Web Push → Capacitor (details in `ISSUES.md`). |
| 2026-11-13 | **Main work moves to a new Claude Code session.** Cloud Claude stops touching the code until told. |

## 3. Release state (as of this hand-off)

- **Branches:**

  | Branch | Use |
  | --- | --- |
  | `main` | LIVE. A push deploys to GitHub Pages. |
  | `staging` | Shared work. |
  | `pc` | Claude Code. `pc` contains everything on `staging` plus Claude Code's own commits. |

- **Live (`main`) = b568622, service worker `wext-v7`.** It includes the gray-button fix, call glare fix, distance "?", Georgian wording fixes and `ISSUES.md`.
- **On `staging`/`pc`, NOT live, waiting for Alexander's "გაუშვი":**
  - 1ec0b69: green toggle hidden on client home.
  - 4d53c26: role fixes. Work-mode Activity shows the worker's jobs; job status is shown from the worker's side; the worker-settings row appears only for registered workers; agreed/no-deal statuses are shown.
  - e6264ac: new bottom menu, `src/screens/Tabs.jsx` (MyPros, ProStats), red dot on the top switch.
  - On `pc` only (Claude Code):
    - c094015: early ICE candidates kept, call released if it ended early, decline ends the callee.
    - bc70c15: texts in 5 languages, OpenStreetMap tiles, admin door via the server-side `admins` list, stricter `firestore.rules`.
    - e6ec955: verified prices in `ISSUES.md`.
- **Release steps:**
  1. Merge `pc` into `staging`.
  2. Bump `const V` in `public/sw.js` (next is `wext-v8`).
  3. `npm run build`.
  4. After the go, run `git checkout main && git merge --ff-only staging && git push`.

## 4. Services and accounts

| Service | State | Where secrets/credentials live |
| --- | --- | --- |
| GitHub repo `6fgwkky5pk-oss/Wext` (public; old URL redirects) | Open | Alexander's GitHub account |
| GitHub Pages (live site https://6fgwkky5pk-oss.github.io/Wext/) | Open, deployed by `.github/workflows/deploy.yml` on push to `main` | Uses the built-in `GITHUB_TOKEN`; no extra secrets |
| Firebase project `wext-af650` (Firestore europe-west3, Anonymous Auth) | Open, **Spark (free) plan** | Alexander's Google account. The web config in `src/firebase-config.js` is public by design. |
| Firestore security rules | `firestore.rules` in the repo is the strict version. Whether it is **deployed** in the Firebase console is **unknown**: it was "any signed-in user can read/write" earlier. Check in console → Firestore → Rules. | Firebase console |
| Admin list | Server-side: documents in `/admins/{uid}`, created by hand in the Firebase console (on `pc`). The old client-side PIN still exists in the code for offline demo mode; it is weak and in a public repo, so treat it as known and remove it. | Firebase console |
| Domain `wext.ge` / `getwext.com` | **Not registered** | — |
| SMS (login codes) | **Not open.** The login code is simulated (banner auto-fills it). Options: Magti, Silknet, Firebase Phone Auth. | — |
| Payments (TBC / BOG) | **Not open, no contract.** Mock "test mode" in `src/payments.js`. | — |
| TURN server for calls | Free public `openrelay.metered.ca` (unreliable). Own TURN **not open**. | Must go in server/env settings only |
| Firebase Blaze (needed for Cloud Functions / push sender) | **Not open** | Alexander adds the card himself |
| Apple Developer ($99/yr), Google Play ($25 once) | **Not open** | Alexander |
| Map tiles | On `pc`: OpenStreetMap standard tiles. For real traffic, a paid or own tile provider is needed (the OSM tile policy limits heavy use). | — |

**Rule:** Alexander opens every paid account and enters the card himself. Keys go only into server or environment settings, never into chat or git.

## 5. Money rules

The currency is GEL (₾). USD values are approximate, at about 1₾ ≈ $0.37; check the rate before quoting.

| Item | Default | USD approx. | Where |
| --- | --- | --- | --- |
| Booking fee, individual (promo) | **1₾**, with 5₾ shown crossed out | ~$0.37 (promo), ~$1.85 (base) | `defaultConfig` in `src/store.js`, admin → prices |
| Promo end date | 2027-02-13 | — | admin-editable |
| Brigade booking fee | 3₾ | ~$1.10 | admin |
| Ride-along fee | 1₾ per seat | ~$0.37 | admin |
| Surge | ×1.3–1.5 on shortage, capped by admin (default cap ×2); modes off/auto/on | — | admin |
| Bundle | 1 payment = up to 3 contacts in the same category within 24 h | — | `activeBundle` |

**Flow** (`src/payments.js`, a provider interface): `preauthorize` (hold) → `capture` (charge) or `release` (return).

- **Capture** happens only on a real contact:
  - a call lasting over 20 s
  - a chat reply from the pro
  - the pro marked "arrived"
- **Release (automatic refund)** happens when there was no contact, the pro didn't show up (no arrival within 1 h), or nobody accepted.
  - A hold with no contact expires after 2 h.
- The buttons "შევთანხმდით / ვერ შევთანხმდით" never refund. Disputes go to a complaint, and an admin decides.
- **Penalties:** 3 no-shows block a worker. Repeat "no deal" users are flagged in admin. There is no deposit.
- **Job price:** paid directly to the worker. The app only shows a typical price range (`TYPICAL` in `src/data.js`).
- **Payments are mock** until the TBC/BOG contract. TBC Checkout / BOG Payments (manual capture) plug into `payments.js` via a server.

## 6. Design rules

- **Colours:**
  - page: yellow `#FFC21A`
  - hero card: black
  - tiles: white, rounded
  - bottom tab bar: black
- **Icons:** style #10. Phosphor *fill* glyphs (MIT), tinted per group on a pale tint (`src/icons.js`):

  | Group | Colour | Hex |
  | --- | --- | --- |
  | handy | orange | `#E8780C` |
  | road | red | `#D7263D` |
  | ride | teal | `#0F9488` |
  | clean | blue | `#1E6FE0` |
  | move | gold | `#C98700` |
  | land | green | `#1F9A4E` |
  | machine | purple | `#6A4BE0` |

- **Font:** system font stack (no web font). Large-text mode zooms 1.15×.
- **Logo:** text "WEXT" for now. There is no final logo or trademark yet, so ask Alexander.
- **Tone:** very short, warm, direct, "you" (შენ) form; one action per screen; honest (no fake activity).
- **iPhone:**
  - status bar `black-translucent`; layout uses `--safe-t`
  - sound unlocks on the first tap; ringtones play through `<audio>`
  - no vibration on iOS
- **Languages:**
  - Auto-detected from the phone. Changed only in Profile → Language, which is searchable.
  - The main 5 languages are ka, en, ru, de, tr, in `src/i18n.js`. Seven more (uk, hy, az, es, fr, ar RTL, zh) are in `src/locales/*.json`.
  - New keys need at least ka, en and ru; missing keys fall back to English.
  - Georgian must be natural. Alexander checks the wording: "მეკაფელე" was rejected and is now "კაფელის ოსტატი".

## 7. Roles: who sees what

- **Client** (everyone, by default):
  - Bottom menu: მთავარი / ხელოსნები (pros used before; call or book again) / შეტყობინებები (chats) / პროფილი.
  - Profile holds activity, payments, language, large text, install, bug report and logout.
  - Home has: group tiles, search with voice, "repeat last pro", active request bar, and a location warning.
  - The request form has: map, nearby list, typical price, voice, photo, note, and the request button. With nobody nearby, it shows the reason plus "notify me" or "turn on location".
- **Worker/pro** (a user with `pro.registered`; `role` is only the current view):
  - Work mode shows: the green toggle, my services chips, the offer card (75 s), job cards (call, chat, arrived, agreed/no deal, done) and the statistics tab (rating, jobs, done, no-shows, today, 7 days; no money).
  - Offers reach a registered worker in any view.
  - Types: individual, brigade (N people), company.
- **Driver (გამაყოლე):** any user can post a ride with free seats, and others book a seat (1₾). Screen `rides` (`src/screens/Projects.jsx`).
- **Admin:** a user listed in Firestore `/admins/{uid}` (on `pc`); opened by tapping the version line in Profile 5 times.
  - Tabs: stats + demand, users (block, no-deal flags, all services), complaints, prices, bugs.
  - Real admin auth is still TODO.

## 8. Done / half-done / not started

- **Done:** the PWA itself, live sync through Firebase, and dispatch with a growing radius (3 → 6 → 12 km) plus SMS-style offers to offline pros. Also done:
  - chat and in-app WebRTC calls
  - deal buttons, refunds by facts, complaints
  - admin panel
  - 12 languages
  - icons #10 and demand ordering
  - one number = one profile (merge)
  - unlimited services
  - live GPS
  - auto-update
  - iPhone status bar
  - honest notify-me
  - glare-free calls
  - new bottom menu (on staging)
- **Half-done:**
  - Calls: work in browsers. Sound on real iPhones and delays on mobile data have not been verified, and nothing rings when the app is closed or locked.
  - Firestore rules: the strict version is in the repo; its deployment is unconfirmed.
  - Admin auth: server list on `pc`, but the old PIN code path remains.
  - Map tiles provider.
- **Not started:**
  - real SMS
  - real payments
  - own TURN
  - Web Push
  - Capacitor apps
  - per-service working hours
  - domains and trademark
  - store listings
  - analytics
  - terms and privacy texts (the UI says "by continuing you agree", but there are no real documents yet)

## 9. Known bugs and incidents

- **Incident 2026-11-13, test traffic reached a real person.** A cloud test used old test phones near Telavi.
  - What happened: the real pro Kakha accepted a test request, and four test calls rang his phone, leaving "missed call" messages (18:55–18:57 UTC).
  - Why: the tests ran at a Telavi location on live Firebase, and dispatch picks the nearest real pros.
  - Cleanup: deleting the docs was refused, so they stayed.
  - Avoid it next time:
    - Test at geolocation `10,10` or `-20,-20`, with fresh fake numbers (`5550002xx`–`5550004xx`).
    - Never reuse `555999000` / `555777888`.
    - Never press call/send toward a pro that isn't a test account.
    - Better still: a separate Firebase test project or the emulator.
- **Gray request button** (fixed in v7): it showed when nobody offered the service nearby. Alexander saw it as "fuel gives no consent".
- **Duplicate job card** (fixed): older duplicate active jobs are marked `replaced`.
- **Open:** calls are sometimes late; sound on real iPhones is unverified; there is no ring with the app closed.
- **Open:** pros without real GPS show "?"; distances depend on phones allowing precise location.
- **Open:** the "call" button on the ხელოსნები tab reuses the old chat thread; check it works after a job is finished.
- **Data:** test users were moved to region `test`. A junk test ride "fd → hxbd" may still be visible.

## 10. Testing rules

- **Local:**
  1. `npm run build`
  2. `cd dist && python3 -m http.server 4321`
  3. Run Playwright (Chromium) with fake media flags.
- **Live Firebase is production, and real users live in Telavi.** Use only the test geolocations and fresh numbers listed in §9.
- **Better (not set up yet):** a second Firebase project `wext-test`, or the Firebase Emulator Suite, selected by an env variable.
- **What needs real phones** (Alexander tests with friends):
  - iPhone sound
  - call delays
  - locked screen
  - GPS accuracy in Telavi
- **Cloud container limits:** `github.io` and the map tile hosts are blocked from the cloud container; Firebase is reachable.

## 11. Open questions for Alexander

1. SMS provider: Magti, Silknet or Firebase Phone Auth? Who signs the contract?
2. Payment provider: TBC or BOG? Contract status, legal entity (company/IE), and who owns the merchant account?
3. Own TURN: Cloudflare TURN or your own VPS? Do you open it with the company card?
4. Firebase Blaze plan for push: yes or no, and is there a monthly budget limit?
5. Apple and Google developer accounts: when, and under which legal name?
6. Domains `wext.ge` / `getwext.com` and the trademark: registered yet?
7. Logo: keep the text "WEXT" or order a designer logo?
8. Final booking fee after the promo (5₾?), and the promo end date (now 2027-02-13)?
9. Terms of use and privacy policy: who writes them (lawyer)?
10. Next city or country after Telavi, and when?
11. Per-service working hours for workers: needed now or later?
12. Who besides you may be an admin?
