# v18 — build spec for pc (Claude Code)

Owner approvals (thread, 2026-11-14 UTC): 13:26 "final update, launch with bots, people will test"; 13:31 "yes — prices like that for bots, then the average from real pros; you and kimi check, give it to Claude Code to build, quickly" (answer to the summary that listed items A–C below). Owner rule 13:16: pc builds and releases.
Already on `staging` (cloud, tested): bots for everyone (`config.bots`), overlap fixes, D-008 brigade. Base = `origin/staging` (≥ 5da0dbc).

## 0. Bots MUST be in v18 (owner 13:32, separate must-have)
Already coded on staging: `config.bots.on` absent = ON for everyone; cities tbs 120 · rst 70 · kut 100 · bat 100 · tel 30 · gor 30 · zug 30 · pot 20; marked 🤖, always busy, never dispatched. Do not change this default. After the release, check live: fresh browser, geolocation 41.7151,44.8271 (Tbilisi), register as a **client only** with a fresh fake number (5550004xx), never turn on work mode, never order or call; confirm 🤖 rows and „ბოტების აქტივობა“ on home, then log out; write the count in WORKLOG.

## A. Prices (D-009)
1. `TYPICAL` in `src/data.js` → these ranges (unit unchanged):
   cleaning [80,170,'m100'] · office [120,220,'m100'] · windows [6,12,'pc'] · plumber [30,70] · electric [20,45] · painter [7,18,'m2'] · tiler [15,35,'m2'] · movers [15,25,'h'] · cartruck [35,100] · tow [40,90] · excavator [70,130,'h'] · crane [90,140,'h'] · carwash [15,30]. All other services: unchanged.
2. Bots: every bot gets `prices[cat] = [x]` for each of its cats, `x` = random inside `typicalFor(cat)`, rounded to 5 (to 1 when the range top < 20).
3. Average from real pros (`typicalFor`): order = admin override (`config.typical`) → if ≥ 5 **real** pros (`!p.bot`) in `state.pros` have `prices[cat][0]` → `[p25, p75]` of those values (rounded like 2.) → else `TYPICAL`. Bots never count.

## B. Avatars (style C)
- Look: circle in the region colour, first letter of the name in white (as now), small white badge bottom-right with the region glyph. Glyph SVGs + colours: `docs/design/avatars-regions.html` (`S` + `GE`/`W` lists); Samegrelo = Dadiani palace variant A from `docs/design/avatar-samegrelo-dadiani.html` (wall #EFE6D2, dark #9C8A6A, windows #5B6B7F, bg #E3ECF6). Tbilisi = wooden balcony (`balcony`); one glyph per region, first listed one where two exist (Kakheti grape, Adjara wave, Svaneti tower, Samtskhe-Javakheti Vardzia).
- `user.avatar = { r: '<regionId>' }` (or null = plain letter as today). On first registration set it from the location (nearest region centre below); the person can change it: tap own avatar in Profile → sheet with all regions + foreign examples + "მხოლოდ ასო". Synced in `pushProfile` like other public fields (rules: allow the `avatar` map, max 1 key, string ≤ 12).
- Region centres (lat,lng): tbilisi 41.715,44.827 · kakheti 41.92,45.47 · imereti 42.27,42.70 · adjara 41.62,41.64 · samegrelo 42.51,41.87 · guria 41.94,42.04 · svaneti 43.04,42.73 · racha 42.52,43.13 · kvemo_kartli 41.55,44.99 · shida_kartli 41.98,44.11 · mtskheta 42.10,44.70 · samtskhe 41.64,42.99 · abkhazia 43.00,41.02. Outside Georgia → plain letter (foreign list is the same mechanism, add later).
- Bots: avatar by their city (tbs→tbilisi, rst→kvemo_kartli, kut→imereti, bat→adjara, tel→kakheti, gor→shida_kartli, zug→samegrelo, pot→samegrelo).

## C. New services (D-010)
- New group `tech`: ka „IT და ელექტრონიკა“, en "IT & electronics", ru "IT и электроника"; HUE #DB2777, TINT #FCE7F3; GROUP_ICON `desktop`. Order: after ტექნიკა.
- Services (id · ka/en/ru · Phosphor fill glyph · TYPICAL · PRICE_Q first line · NOTE_PH ka):
  - `computer` · კომპიუტერის ოსტატი / Computer repair / Компьютерный мастер · `desktop` · [30,60] · „1 გამოძახება (Windows, ვირუსი)“ · „ლეპტოპი ნელა მუშაობს, Windows თავიდან“
  - `phone` · ტელეფონის შეკეთება / Phone repair / Ремонт телефона · `device-mobile` · [30,80] · „სამუშაო, ნაწილის გარეშე“ · „ეკრანი გამიტყდა“
  - `wifi` · ინტერნეტი და Wi-Fi / Internet & Wi-Fi / Интернет и Wi-Fi · `wifi-high` · [30,50] · „1 გამოძახება“ · „Wi-Fi მეორე ოთახში არ იჭერს“
  - `tv` · ტელევიზორი და ანტენა / TV & antenna / ТВ и антенна · `television-simple` · [30,80] · „1 სამუშაო (დაკიდება/გამართვა)“ · „ტელევიზორი კედელზე დავკიდო“
  - `cctv` · ვიდეოკამერები / CCTV cameras / Видеокамеры · `security-camera` · [40,80,'pc'] · „1 კამერის მონტაჟი“ · „ეზოში 2 კამერა“
  - `aircon` (g handy) · კონდიციონერი / Air conditioner / Кондиционер · `snowflake` · [50,80] · „1 კონდიციონერის წმენდა“ · „კონდიციონერი ცუდად აგრილებს, წმენდა“
  - `assembly` (g handy) · ავეჯის აწყობა / Furniture assembly / Сборка мебели · `armchair+screwdriver` · [30,80] · „1 ნივთი (კარადა/საწოლი)“ · „IKEA-ს კარადის აწყობა“
  - `carpet` (g clean) · ხალიჩის რეცხვა / Carpet cleaning / Чистка ковров · `broom` (or another exact rug glyph) · [5,10,'m2'] · „1 მ² ხალიჩა“ · „2 ხალიჩა, 6 მ² ჯამში“
- Add `syn` words (ka + slang/ru: კომპი, ნოუთბუქი, ვინდოუსი, айфон, вайфай, ტელიკი, кондер …), en/ru names, a few other locales optional. Include the new services in bots (`seedPros`) so every city has some.
- Phosphor glyph paths (MIT) are added to `GLYPH` like the existing ones.

## C2. Small fixes from kimi's check (1090fc0)
- A real user's name may not start with 🤖 (strip it in `clean()` for names), so nobody looks like a bot.
- Sheet on short screens (≤ 660 px): keep the action buttons visible — make the sheet's last button row `position: sticky; bottom: 0` with the sheet background.

## D. Checks before release (all must pass, emulator only — see `tests/e2e/README.md`)
1. `npm run build` ok. 2. `tests/e2e/bots-isolation.cjs` → ALL PASS. 3. `tests/e2e/overlap-audit.cjs` → no findings except the sticky-header lines. 4. Manual look at 3 screenshots: new group tiles, avatar picker, a bot price in the list. 5. Firestore rules emulator suite still green.

## E. Release
`public/sw.js` → `const V = 'wext-v18'`; CLAUDE.md "Release state" → live = wext-v18 (bots for everyone, new IT group, avatars, prices), next wext-v19; `git checkout main && git merge --ff-only staging && git push`; verify `sw.js` on `gh-pages` shows wext-v18; WORKLOG DONE. Keep `prosOld` (remove in v19).
