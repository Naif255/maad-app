# مَعاد · Maad

Closing the loop on laundry wire hangers. Consumers scan hangers with the camera; usable ones go back to laundries, damaged ones become steel scrap for factories.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run dev:https    # for phone camera access over LAN
npm test             # domain unit tests
npm run e2e          # full 2-minute demo story in Playwright (screenshots in test-results/shots)
npm run build
```

## Demo

The full presenter run sheet is in [DEMO.md](DEMO.md).

Open on a laptop at ≥1100px wide for stage mode: director bar, phone, and live impact panel.

- Roles: Consumer, Laundry, Factory, Impact (top bar, or Alt+1..4)
- Story chips 1–7 jump to each step
- "Reset demo" (Shift+R) restores seed data; the story is deterministic
- "Demo video / Camera" toggles the scan source
- "48h" advances the clock to show booking expiry
- Brand mood board: `#/brand`
- Phone + laptop: run `npm run dev:https` and open `https://<lan-ip>:5173/?sync=1#/c` on both. State syncs over the dev server's websocket (dev mode only)

## Scan module

`src/scan` exposes `HangerDetector` and `FrameSource`. To plug in the trained model, set `onnxModelUrl` in `src/config/app.ts` (output contract in DECISIONS.md). Drop a recorded clip at `public/media/sample.mp4` to replace the synthetic demo video. An optional `sample.json` annotation next to it makes the video run deterministic.

## Config

- `src/config/economics.ts`: hanger weight, scrap price, new hanger price, points, box capacity, tiers
- `src/config/app.ts`: threshold, expiry, scan timings, criteria weights, video path
