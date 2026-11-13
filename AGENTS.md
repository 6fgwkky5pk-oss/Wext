# AGENTS.md — rules for every AI agent in this repo (Codex, Kimi Code, others)

**ენა / Language:** ყველა ჩანაწერი WORKLOG.md-ში, SUGGESTIONS.md-ში და DECISIONS.md-ში და ყველა პასუხი მფლობელისთვის — ქართულად, მოკლედ და მარტივად. კოდი და ტექნიკური სახელები რჩება ინგლისურად. (All discussion entries and replies to the owner in Georgian, short and plain; code and identifiers stay in English.)
**ყოველი ნაბიჯის წესი / Every step:** ყოველი ნაბიჯის დაწყებისას და დასრულებამდე: `git fetch`, წაიკითხე WORKLOG.md ყველა ბრანჩზე (`origin/staging`, `pc`, `codex`, `kimi`), უპასუხე ახალ კითხვებს და შენთვის მიწერილ „TO:“-ს, ჩაწერე STARTED/DONE და push. სესია ჟურნალს მხოლოდ მაშინ ამოწმებს, როცა ღიაა და მუშაობს. ამიტომ ნაბიჯები მოკლე იყოს და შემოწმება ხშირი.
**ორი წრის წესი / Two rounds:** განხილვებში მონაწილეობენ cloud, codex და kimi; pc (Claude Code) — არა, ის მხოლოდ აპის აწყობასა და მართვაზეა (მფლობელი, 2026-11-13). ყოველ განხილვაზე: 1) ყველა წერს თავის აზრს; 2) ყველა კითხულობს სხვებისას და პასუხობს (ვეთანხმები / არ ვეთანხმები + მიზეზი), სანამ საერთო აზრამდე არ მივალთ; 3) cloud წერს შეჯამებას: რაზე შევთანხმდით და რა რჩება სადავო. მფლობელს მიდის მხოლოდ ეს შეჯამება (სადავოზე: თითოეულის მოკლე აზრი, ავტორი, commit).
**PROPOSAL-ის წესი / Proposal rule:** ყოველ მნიშვნელოვან ცვლილებამდე WORKLOG.md-ში ჩაწერე მოკლე `PROPOSAL` (ქართულად): რას ცვლი, რატომ, რა სხვა გზები არსებობს, და კითხვა დანარჩენ აგენტებს: „ხედავთ პრობლემას ან უკეთეს გზას?“. მიეცი პასუხის დრო release-მდე (სასწრაფოზე დაწერე `URGENT` და გააგრძელე). თუ ვინმე შენიშნავს ან სხვა გზას გვთავაზობს — მარტო ნუ გადაწყვეტ: ჩაწერე მისი აზრი (ციტატა, ავტორი, commit) და შენი აზრი; გადაწყვეტს მფლობელი. ცვლილება მხოლოდ მისი გადაწყვეტილების შემდეგ (გარდა `URGENT`-ისა). სხვისი PROPOSAL-ზე უპასუხე ქვემოთ, ხელმოწერით. release მაინც მხოლოდ მფლობელის „გაუშვი“-თ.

This repo is **public**. It is the WEXT app (React + Vite PWA, Firebase).

## At the start of every session
1. `git fetch`
2. Read, in this order: **AI_CONTEXT.md** (what the app is), **DECISIONS.md** (settled, do not re-open without a new reason), **WORKLOG.md** on `origin/staging` (who does what now, open TO: items), **SUGGESTIONS.md**, then **CLAUDE.md** and **ISSUES.md** for technical detail.
3. Add one line to WORKLOG.md on your own branch: `YYYY-MM-DD HH:MM UTC · <kimi|codex> · STARTED: what · files`. When finished: `DONE: what · commit`. If stuck: `BLOCKED: why`.

## Branches (strict)
- Work **only** on your own branch: Kimi → `kimi`, Codex → `codex` (create it from `origin/staging`). Push that branch to GitHub so the others can read your WORKLOG lines.
- **Never push** to `main` (live app), `staging` or `pc`. Never force-push.
- To propose code: open a pull request from your branch into `staging`, or write an entry in SUGGESTIONS.md. Then wait. Cloud Claude or Claude Code reviews it. Nothing goes live without the owner's own go.

## Open now
- **D-002 იკონები** (WORKLOG.md): 2 საუკეთესო მიმართულება ქართულად, ხელმოწერით, push შენს ბრანჩზე.
- **TO: Codex და Kimi Code:** შენი პასუხი აქ ჩაწერე ქართულად, შენი სახელით ხელმოწერილი, და push გაუკეთე მხოლოდ შენს ბრანჩს (`codex` ან `kimi`). არასდროს `main`-ს, `staging`-ს ან `pc`-ს.
- **DISCUSSION** (WORKLOG.md-ის თავში): ჯერ წაიკითხე AI_CONTEXT.md, მერე ქართულად ჩაწერე შენი ხელმოწერილი ჩანაწერი (5 დასამატებელი, 5 ამოსაღები/გასამარტივებელი, 1 ყველაზე დიდი რისკი ხვალინდელი ტესტისთვის), იგივე თქვი შენს სესიაში და push გაუკეთე შენს ბრანჩს.

## Your role
- **Kimi**: independent review and risk finding (security, privacy, money rules, wording, edge cases). Prefer findings over large rewrites.
- **Codex**: second code reviewer and tests (unit tests, two-user flow checks, build checks).
- **Cloud Claude** (`staging`) and **Claude Code** (`pc`) own the app code and decide what is merged.
- Your output is a suggestion until one of the owners has checked it.

## Never
- Write secrets, keys, passwords, PINs, phone numbers, user ids or real people's names anywhere (code, docs, WORKLOG, commits). WORKLOG holds neutral work status only.
- Change Firebase rules or the live database, or run anything against live data.
- Send requests, calls or messages to real users. Test only with the rules in CLAUDE.md ("Testing on live Firebase"), or better with the Firebase emulator.
- Re-open a decision from DECISIONS.md without a new reason written in SUGGESTIONS.md.

## Good finding format
Numbered points: **what** (file:line), **why it matters**, **how to check it is fixed**. Say when you are guessing.
