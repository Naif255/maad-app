# Decisions log

One line of reasoning per decision. Newest at the bottom of each phase.

## Approved with the owner (pre-build)

- One QR per user: the receipt shows booking details plus the single loyalty QR. Fewer codes, same rule.
- Drop-off confirmation is one tap "received", with an optional "count looks off" flag. Answers fraud questions without adding sorting work.
- Plastic hangers are invisible: detectors may classify them, the tracker drops them before counting, and no UI text mentions them.
- Location is Buraydah (Qassim), real neighborhood names, fictional laundries.
- All economic figures live in `src/config/economics.ts`. Consumers only see points and coupons, never halala values.
- Primary demo setup is a single laptop in stage mode. Phone + sync server only if everything else is solid.
- Western digits everywhere.

## Phase 1

- Stack: Vite + React 19 + TypeScript (strict), Tailwind v4, Motion, Zustand with persist. Fast to build, pure client, camera APIs in the browser.
- HashRouter, so a static deploy needs no rewrite rules.
- The "backend" is pure domain functions in `src/domain/services.ts` operating on a cloned `Db`, called only from store actions. It can be swapped for a real API later without UI changes.
- Cross-tab sync uses the `storage` event and rehydration, so `/impact` in a second window updates live on the same machine.
- Seed data comes from a fixed-seed PRNG (mulberry32, seed 20261012) over 90 days, so every reset produces the same data.
- IDs come from a counter in the db (`seq`), not random values, so the demo story yields identical IDs and booking codes on every run.
- Story numbers: Nada request is 140/200 with 12 reserved by another user; Nada's box starts at 395/400, so the 6 damaged hangers from the story fill it; the Rifq and Dana boxes are already listed, so the factory round groups 3 boxes.
- Demo scan source is a procedurally rendered "video" (canvas), used until `public/media/sample.mp4` exists. It has ground truth, so the scripted detector gives exactly 14 usable / 6 recyclable / 2 ignored every run.
- Video fallback: if `appConfig.sampleVideoUrl` serves a video, it is used. If a sibling `.json` annotation exists, detections are scripted from it (deterministic); otherwise the heuristic detector runs on the video.
- Detector interface `HangerDetector.detect(frame) → Detection[]` with bbox, material, confidence and optional criteria. Three implementations: scripted, heuristic (canvas CV: local-contrast threshold, dilation, connected components, thin-shape filter), and onnx (loads onnxruntime-web from CDN only when `onnxModelUrl` is set).
- ONNX output contract assumed for the team's model: `[1, N, 11]` rows of `cx, cy, w, h, conf, plastic_prob, straightness, hook, rust, coating, breaks` (criteria as 0–1). Documented here because code has no comments.
- When a detector returns no criteria (heuristic), criteria come from a deterministic profile table keyed by batch and track order. A real model replaces this automatically.
- Fitness score: weighted criteria (straightness .25, hook .25, rust .2, coating .1, breaks .2), with caps: a break below 50 caps the score at 55, a hook below 40 caps it at 60. A broken hook or wire can never pass, no matter how clean the rest is.
- "Defect" for stats means a criterion below 70.
- Auto-lock: at least 2.5s scanning, at least one confirmed hanger, 1.8s with no new confirmation, and the source not still moving. Plus a quiet "done? lock now" link for live camera use.
- A track is confirmed after 6 consecutive matched frames, which avoids flicker counts.
- Usable hangers earn 5 points each plus coupons; damaged earn 2 points each. Points drive tier and balance; coupons come from the request's reward template.
- Coupons use a per-user, per-laundry carry-over (stamp-card style): 14 hangers against "per 10" gives 1 coupon and carries 4. No hanger is wasted.
- Tiers by lifetime hangers: bronze 0, silver 150, gold 400.
- Usable hangers are allocated greedily across at most 2 open requests (preferred first, then nearest). Leftovers are shown as "keep them, we'll notify you".
- Damaged hangers go to the first leg's laundry if its box accepts them; otherwise to the nearest accepting laundry (a second receipt leg, same QR).
- A box counts as full at capacity (400 hangers ≈ 16.8 kg). A booking accepted before the box filled may overfill it slightly, which is physically fine.
- Listing purity is the weighted average of scan material confidence from the box's recent bookings.
- Factory round proposal: all listed boxes within 9 km of the box nearest the factory.
- Payout per laundry is actual kg × factory price/kg, rounded to halalas.
- Certificate numbers continue the seeded series `MAAD-YYYY-00NN`.
- OTP is simulated: the demo phone types itself and the code "arrives" as an in-app SMS banner and autofills. Any 10-digit number works; an unknown number creates a new user.
- The demo persona is "Reem" in Al-Safra with 8 past returns (silver tier, 690 points, 3 trees donated).
- Map is a stylized SVG with approximate relative neighborhood positions, not geographic. It works offline and looks intentional.
- Fonts are self-hosted via Fontsource (Readex Pro variable, IBM Plex Sans Arabic), so they work offline.
- Stage mode (≥1100px wide): director bar, phone frame, and live impact panel side by side. Below that width, the app runs full screen with a floating role switcher.
- Director keyboard shortcuts: Shift+R resets the demo; Alt+1..4 switches roles.
- "+48h" in the director advances a demo clock offset and expires bookings, to show the expiry rule live.
- Synthetic scene keeps hangers inside the central crop so no detection lands off screen on a phone-shaped viewport.
- The impact "kg diverted" counter shows one decimal, so a single return visibly moves it.
- Mood board lives in-app at `#/brand` and uses the real tokens and components.

## Phase 2

- Heuristic detector is validated against synthetic ground truth in e2e (≥75% recall). Plastic hangers are rejected by the thickness/fill shape filter and never counted.
- Camera path is tested with Chromium's fake media device. A camera failure automatically falls back to the demo video with a short copper notice, so the demo never dead-ends.
- With `?record=1`, the scanner can export the current run as `sample.json` (keyframed tracks plus criteria). Run the heuristic once on the real sample video, export, and drop the JSON next to the video; from then on the video replays identically.
- Live camera hint asks users to lay hangers flat on plain fabric, which matches what the heuristic detector (and most models) need.
- Scanner HUD overlays are click-through, so hangers under the gradient can still be tapped for their breakdown.
- Director bell toggle simulates "no nearby requests" to show the notify-me empty state on demand.
- Routing copy for a usable-only laundry reuses the "box not accepting right now" note, which stays true in both cases.

## Phase 3

- The synthetic source paints a new frame only when the scan engine asks for one, and scan state is committed with `flushSync`. Boxes and pixels always come from the same instant, so boxes sit exactly on the hangers even on slow devices.
- On phones (no stage), the role switcher is a small edge handle instead of a floating button, so it never covers content.
- Laundry box gauge redrawn as a drop box with a slot and a metallic fill level; the percentage stays legible at every level.
- Impact dashboard scales hero numbers and hides the logo on small screens; ticker lines wrap to two lines instead of truncating.
- Arabic number agreement handled in one place (`format.ts`): dual forms (علاقتين، نقطتين، ثوبين، قطعتين), plural 3–10, singular 11+.
- Laundry badge initials skip the definite article (الخزامى → خ).
- Mobile gallery spec (`e2e/gallery.spec.ts`) captures every main screen at 390×844 for visual review.

## Phase 4

- Production build verified offline: after one load, the PWA serves the app shell, fonts and the demo scan with the network off.
- Phone + laptop sync is opt-in (`?sync=1`) and rides on Vite's dev-server websocket via a tiny plugin, so it needs no extra infrastructure and no second server. Shared: db, demo clock, celebration, notify toggle. Per device: signed-in user, scan batches, scan source.
- The first device to join keeps its state; a newcomer adopts the existing state through a hello/reply handshake.
- A recorded sample video locks only after the clip ends (`busy()` until `ended`), so the real-video run is deterministic together with `sample.json`.
- `DEMO.md` is the presenter run sheet: setup, the timed 2-minute story, extra moments, failure recovery, and how to record the sample video.
