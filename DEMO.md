# Demo run sheet (≈2 minutes)

## Setup A: one laptop (primary)

1. `npm run dev`, open `http://localhost:5173/?demo=1#/c` in Chrome at full screen (≥1100px wide shows stage mode). Without `?demo=1` the app runs as the plain product; Shift+D toggles demo controls at any time.
2. Press **إعادة العرض** (or Shift+R). Every run starts from the same data and ends with the same numbers.
3. Make sure **فيديو العرض** is selected (top bar). Use **الكاميرا** only if you want to scan real hangers live.

The phone frame is on the right, and the live Impact panel on the left reacts to every step.

## Setup B: real phone + laptop (optional)

1. `npm run dev:https`; note the Network URL (e.g. `https://192.168.x.x:5173`).
2. Laptop: open `https://<ip>:5173/?sync=1&demo=1#/c`. Phone (same Wi-Fi): open the same URL and accept the certificate warning.
3. Both show **متزامن**. The phone scans and books; the laptop plays laundry, factory and impact.

## The story

| # | Time | Click | Say |
|---|------|-------|-----|
| 1 | 0:00 | Consumer home, top card **مغسلة نَدى** (140 من 200) | "Nearby laundries post what they need. Nada needs 48 more hangers and pays in free ironing." |
| 2 | 0:15 | **افحص علاقاتك** | "Live video, not photos. Every hanger gets a box and a score out of 100 on five criteria." |
| 3 | 0:30 | Wait for the lock (≈8s), tap a grey box | "It locks itself when the count is stable. Tap any hanger: this one has a broken hook, so it goes to steel." Plastic hangers in the scene are silently ignored. |
| 4 | 0:45 | **كمّل للفرز** → **احجز التسليم** → **أسلّمها بنفسي** → **ثبّت الحجز** | "14 in the green carton for the laundry, 6 in the grey one for the factory. No forms, no login." |
| 5 | 1:00 | Receipt | "One personal QR for everything. 48 hours, then the quantity goes back to the laundry." |
| 6 | 1:10 | Top bar **المغسلة** → center tab **امسح** → pick the booking → **استلمت** | "Staff don't sort. Keep green, drop grey in the Maad box. The box just filled, so it went to factories automatically." |
| 7 | 1:25 | Top bar **المستهلك** | Reward lands: coupon + points. **شوف بطاقة أثرك** for the share card. |
| 8 | 1:35 | Top bar **المصنع** → **اعتمد جولة الاستلام** → **استلمت** ×3 → certificate | "One round, three nearby boxes, each laundry paid by actual weight. Every shipment gets a supply certificate with purity from scan data." |
| 9 | 1:55 | Top bar **الأثر** | "Everything you just saw, counted live, by neighborhood." |

Story chips 1–7 in the top bar jump straight to any step if you need to skip.

## Extra moments if asked

- **Expiry**: after booking, press **48 ساعة**. The receipt flips to expired and Nada's need goes back up.
- **No nearby requests**: the bell button in the top bar shows the "notify me" state.
- **Usable-only laundry**: Laundry → الإعدادات → toggle. Booking then routes the grey carton to another laundry.
- **Laundry posts a request**: Laundry → طلب جديد (quantity, reward template, publish).
- **Wallet**: consumer → المحفظة. Tilt-reactive loyalty pass, coupons with expiry, donate points for trees.
- **Brand**: `#/brand` shows the identity mood board.

## If something goes wrong

- Camera fails (demo mode): the scanner switches to the recorded video by itself and says so. Outside demo mode it shows a retry screen instead.
- Wi-Fi drops: the app is a PWA; after one load it runs fully offline, including the demo scan.
- State looks odd: **إعادة العرض**.

## Recording the real sample video

1. 10–15 s (the scan locks when the clip ends), phone held portrait, slow pan over 10–15 wire hangers on a plain light sheet, good light.
2. Save as `public/media/sample.mp4` (or set `sampleVideoUrl` in `src/config/app.ts`).
3. Open `/?demo=1#/c/scan?record=1`, let it lock, press **تصدير التعليقات**, and save the file as `public/media/sample.json`.
4. From then on the video replays with identical boxes and counts every run. Update the story numbers in `e2e/story.spec.ts` if the counts change.
