# Maad (مَعاد)

Hackathon MVP for the Qassim Entrepreneurship Forum, Track 3 (Sustainability & Circular Economy). Wire laundry hangers are scanned at home, usable ones return to laundries, damaged ones are sold to steel factories as scrap.

## Product rules (fixed, never change without the owner's approval)

Roles: Consumer, Laundry, Factory, plus a public Impact Dashboard (no login).

Consumer
- Home feed of nearby laundry requests: quantity needed, reward, progress (e.g. 140 of 200).
- "I have hangers" starts a scan first, then suggests laundries.
- Scanning is a live video feed. Every hanger gets a bounding box and a fitness score /100 from five criteria: frame straightness, hook integrity, rust, coating peel, breaks.
- Score >= 80 usable (to laundry), < 80 recyclable (to factory). Tapping a hanger shows the criteria breakdown.
- Live counter, then auto-lock with a "verified" moment. Multiple batches add up.
- Usable hangers go in a green carton, damaged ones in a grey carton.
- Delivery: drop off in person, or hand over with the next laundry order.
- Receipt: booking details plus the user's single loyalty QR. Timeline: booked → awaiting drop-off → received → reward credited. Bookings expire after 48h and the quantity returns to the request.
- Entry (owner decision, final UX pass): first launch shows a welcome page (one line + three steps: scan, hand over, becomes steel) and "who are you?" (consumer, laundry, factory, plus an impact link). Then a frictionless simulated sign-in: consumer = phone + self-filling OTP (any number works) + pick a Buraydah neighborhood (nearby requests depend on it); laundry/factory = business sign-in with credentials prefilled. After that the app opens straight into the last role; each role's settings has "switch account". "Reset demo" brings the welcome page back, and demo story jumps bypass sign-in.
- No personal demo name anywhere; greet by time of day.
- No nearby requests: "notify me when a nearby laundry needs hangers".

Rewards
- Usable hangers earn laundry coupons. Damaged hangers earn fewer points. The laundry funds both.
- Wallet: coupons with expiry dates, redeemed by the laundry scanning the QR.
- Loyalty pass: tier (bronze/silver/gold), balance and the single QR for drop-offs and redemptions. Personal impact (lifetime hangers, kg, points, next tier) lives in the return history (owner decision, final UX pass).
- Shareable impact card after every return. Full return history. "Donate your points" with a trees counter (visual only).
- Consumers never see per-hanger halala values, only points and coupons.

Laundry
- Posts a request: quantity, reward template, publish. No duration; auto-closes when reached; acceptance automatic within remaining need.
- Drop-off: staff scan the QR, tap "received" (optional "count looks off" flag), keep the green carton, drop the grey one in the Maad box. No sorting.
- Dashboard: hanger stock, monthly savings, box fill level with estimated SAR value.
- Box full: scrap listing goes to factories automatically, damaged intake pauses, consumers are routed elsewhere for damaged hangers; usable flow continues.
- Setting "accept usable hangers only".
- Each laundry sells its own scrap and is paid individually.

Factory
- Map of full boxes with quantity and the factory's price per kg.
- Approves a single pickup round grouping nearby ready boxes.
- Enters actual weight at pickup; each laundry paid separately.
- Supply Certificate per shipment: quantity, source laundries, date, purity % from scan data.

Impact Dashboard: total hangers, kg steel diverted, laundry savings SAR, live activity ticker, quality distribution, common defects, neighborhood leaderboard.

## Forbidden
- Any mention of plastic hangers in the UI. The scanner silently ignores them.
- Carbon/CO2 figures, "ESG", "Scope 3".
- Real laundry business names. Fictional laundries in real Buraydah neighborhoods.
- Subscriptions, payments, billing logic.

## Engineering conventions
- Arabic only, RTL, mobile-first. Western digits. Copy is warm, natural Saudi Arabic, short and friendly.
- No code comments.
- All economic figures live in `src/config/economics.ts`. App settings in `src/config/app.ts`.
- Domain logic is pure and lives in `src/domain`. UI never mutates state directly; it calls store actions that call domain services.
- The scan module (`src/scan`) is behind the `HangerDetector` interface. Implementations: scripted (deterministic demo), heuristic (canvas CV), onnx (plug-in for the trained model).
- The demo story must be deterministic. "Reset demo" restores seed data.
- Product mode is the default: no demo wording in the UI, scanner uses the real camera. Demo controls (director bar, stage mode, recorded-video source, reset) appear only with `?demo=1` or Shift+D.
- Numbers must agree across screens; every visible control must work.
- Log every product/engineering decision in `DECISIONS.md` with one line of reasoning.

## Commands
- `npm run dev` / `npm run dev:https` (phone camera needs HTTPS)
- `npm run build`, `npm test` (vitest), `npm run e2e` (playwright demo story)
