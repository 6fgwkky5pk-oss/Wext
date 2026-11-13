# WEXT

Installable PWA (React + Vite). Client “Call now”, project/field work with N people, ride-along seats, pro mode, chat, in-app call, test-mode payments, admin panel, 5 languages (ka, en, ru, de, tr).

- `npm run dev` · `npm run build`
- All data goes through `src/store.js` (`api`). The local adapter will be swapped for a realtime backend (Firebase) without UI changes.
- Payments: `src/payments.js` provider interface (preauth → capture/release); TBC/BOG plug in there. Currently test mode.
- Native apps later: wrap `dist/` with Capacitor.
- Admin: tap the version line in Profile 5 times.
