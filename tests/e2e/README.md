# End-to-end checks (Firebase emulator only — never live)

1. Emulator: `npx firebase emulators:start --project wext-af650` with `firebase.json` = `{"firestore":{"rules":"firestore.rules"},"emulators":{"firestore":{"port":8080},"auth":{"port":9099},"ui":{"enabled":false},"singleProjectMode":true}}`.
2. Emulator build: temporarily add `emulator: true,` as the first key of `src/firebase-config.js`, `npx vite build --outDir /tmp/dist-emu --emptyOutDir`, then restore the file (never commit it). Check the bundle contains `127.0.0.1`.
3. Serve: `cd /tmp/dist-emu && python3 -m http.server 4322`.
4. Clear data before a run: `curl -X DELETE "http://127.0.0.1:8080/emulator/v1/projects/wext-af650/databases/(default)/documents"`.
5. Run:
   - `node tests/e2e/bots-isolation.cjs` — bots are shown but never get an order/call/chat; a real pro does. Must end with `RESULT: ALL PASS`.
   - `OUT=/tmp/ov node tests/e2e/overlap-audit.cjs` — ~40 screens on 375×667 and iPhone 13, ka + ru; prints COVER / CLIP / OUT / TXT findings and saves screenshots. `COVER … by .top/.ell«Title»` at the end of a scroll is the sticky header (expected); everything else must be empty.
Fake phone numbers only (5550002xx–5550004xx).
