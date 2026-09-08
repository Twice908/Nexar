# Employee Carpool MVP — Build Specification

**Purpose of this file:** Feed this directly to an AI coding model (Claude Code / Cursor / similar) to scaffold and build the MVP. Scope is deliberately narrow — one residential cluster to one workspace cluster — no multi-city, no on-demand rides, no payments beyond cost display.

---

## 1. Core Concept

A single fixed **Residential Cluster (R)** and a single fixed **Workspace Cluster (W)**. The system groups exactly **4 verified employees** per trip based on:

1. Home address proximity within R (geo-clustered)
2. Same/overlapping office entry time window (e.g. ±15 min)
3. Same office building/campus within W

One of the 4 is assigned/opts in as the **Car Owner (driver)**. The other 3 are **Riders**. The driver picks up all 3 riders (or one shared pickup point if closer), then drops all riders at **one single drop point** inside W such that no rider walks more than **3–5 minutes** from that drop point to their actual office entrance. The driver then parks/proceeds to their own office.

This is a **recurring daily/weekly matching model**, not on-demand ride-hailing.

---

## 2. Hard Constraints (do not violate in design)

- Group size is fixed at **4** (1 driver + 3 riders). Do not build variable group sizes for MVP.
- Only **one/two drop point** per group inside W — not per-person drop-offs. Compute this point so every rider's walk ≤ 3–5 minutes.
- Only **one/two pickup point** per group inside R if riders don't share exact proximity — not per-person pickups, unless riders are on the direct path (see routing note in Section 5).
- No cash payment flow. No "hire or reward" mechanic. No ride-credit/free-ride wallet in MVP (per legal caution below).
- No open marketplace — every user must be verified against the employer/workplace before matching.
- Single R↔W pair only. Do not build multi-cluster expansion logic yet — but do not hardcode values in a way that blocks adding a second cluster pair later (keep R and W as data, not constants).

---

## 3. Legal Guardrails to Bake Into the Product (non-negotiable for MVP)

Reference: India's Motor Vehicles Act treats a private car earning money for carrying passengers as commercial transport requiring a permit. Carpooling stays legal only when it is **genuine cost-sharing among people already making the trip**, with **no profit** to the driver.

- Show a **transparent, auto-calculated cost-per-trip** (fuel + toll ÷ 4, or similar simple formula) visible to all 4 group members every trip. This creates an auditable "no profit" trail.
- **Do not implement** any "free ride" / "reward ride" / credit-banking system in this MVP. Do not build a wallet, points ledger, or barter-for-rides feature. If asked to add this later, it requires legal sign-off first — leave a clearly marked extension point in the code but no working feature.
- Every user must complete **workplace verification** (see Section 6) before they can be matched — this keeps the pool to "verified colleagues," not the open public.
- Store only what's needed for matching and safety (approximate home zone, not exact home address, for anyone other than the matched group).

---

## 4. Roles

### Driver(we won't call them a driver instead we'll use product based names as Nexar and Nexirian for passanger) (Car Owner)
- Opts in as driver for a given day/week (recurring toggle, not per-trip booking).
- Sees: rider names (first name + photo), pickup order, single drop point, per-rider approx. pickup zone, live trip status.
- Cannot see riders' exact home address — only a pinned approximate zone/landmark.

### Rider(Nexirian) (Passenger)
- Requests a seat for a recurring commute window.
- Sees: driver name, photo, car model + plate (last 4 digits only shown pre-trip; full plate shown once matched/confirmed for safety), pickup point/time, drop point, live location during active trip.
- Cannot see the driver's or other riders' exact home address.

---

## 5. Minimal Interface — Field List (keep both screens deliberately sparse)

### Driver view (per active trip)
| Field | Shown |
|---|---|
| Rider name (first name only) + photo | Yes |
| Pickup point (pin/landmark, not full address) | Yes |
| Pickup order (1, 2, 3) | Yes |
| Single drop point (map pin inside W) | Yes |
| Trip status (upcoming / in-progress / completed) | Yes |
| Cost-per-trip breakdown | Yes |
| Rider phone (masked/in-app call only) | Yes |

### Rider view (per active trip)
| Field | Shown |
|---|---|
| Driver name + photo | Yes |
| Car model + last 4 digits of plate | Yes (full plate after first confirmed trip) |
| Pickup point + estimated pickup time | Yes |
| Drop point + walk distance to own office entrance | Yes |
| Live trip status / location during trip | Yes |
| Cost-per-trip breakdown (own share only) | Yes |
| Driver phone (masked/in-app call only) | Yes |

No bios, no chat threads, no social features, no ratings-as-a-feed. Rating is a single 1–5 tap after trip completion, nothing else.

---

## 6. Verification (P0 — must exist before matching works)

- Phone number OTP verification.
- Work email verification (must match the one registered workplace domain for the pilot, e.g. `@company.com`).
- Basic profile: name, photo, home zone (dropped pin, stored as approximate zone not exact point), office entry time window, car details (driver only: model, plate, seats).

---

## 7. Matching Logic (MVP algorithm — keep simple, no ML)

1. Pull all verified users with an active recurring commute request in cluster R → W.
2. Bucket users by office entry time window (e.g. 30-min buckets).
3. Within each time bucket, cluster by home-zone proximity (simple radius/distance grouping — e.g. k-means or nearest-neighbor grouping into groups of 4 is enough; no need for route-optimization engines in MVP).
4. Within each group of 4, mark exactly one as driver (must have opted in as a car owner and have available seats ≥ 3); the rest are riders.
5. Compute **one pickup point**: geographic centroid of the 3 riders' home zones, snapped to a nearby recognizable landmark (not literally the centroid coordinates — round to nearest common point like a signal, gate, or shop).
6. Compute **one drop point** inside W: a point such that the maximum walking distance to any of the group's actual office entrances is ≤ 3–5 minutes (~250–400m). If no single point satisfies this for all 4, do not form the group — re-bucket.
7. If no valid group of 4 can be formed for a user, leave them unmatched for that day (MVP does not need groups smaller than 4 — but log unmatched users to size future clusters).

---

## 8. Trip Lifecycle (MVP states)

```
REQUESTED → MATCHED → CONFIRMED (both sides accept) → IN_PROGRESS → COMPLETED
                                                             ↓
                                                         CANCELLED (by driver or rider, with reason)
```

- Confirmation window: both sides must confirm the match by a cutoff time the night before (or morning of) — no live/instant booking in MVP.
- Cancellation by driver = auto-notify all 3 riders + attempt re-match if time allows, else mark trip failed for that day.
- Cancellation by a rider = notify driver, no re-match needed (driver still runs trip for remaining riders if ≥1 left, or cancels if 0 left).

---

## 9. Safety Features (P0, from prior research — keep minimal but present)

- Live location sharing during an active trip, visible to all 4 group members + an emergency contact each user can set.
- In-app "Report / Block" button on every trip (driver can report a rider, rider can report driver/co-rider).
- One-tap SOS during an active trip (sends location + trip ID to a stored emergency contact; SMS fallback if no internet).
- Admin-only dashboard to view flagged trips and suspend accounts (does not need to be polished for MVP — CLI or basic table view is fine).

---

## 10. Data Model (minimum viable tables)

- `users`: id, name, phone, work_email, verified_at, home_zone (lat/lng, rounded), office_entry_window, role_preference (driver/rider/both)
- `vehicles`: id, user_id (driver), model, plate_number, seats_available
- `trips`: id, date, group_id, driver_id, pickup_point, drop_point, status, cost_per_head
- `trip_members`: trip_id, user_id, role (driver/rider), pickup_order, confirmed_at
- `ratings`: trip_id, rater_id, ratee_id, score (1–5)
- `reports`: id, trip_id, reporter_id, reported_id, reason, status

---

## 11. Explicitly Out of Scope for MVP

- Payments/wallet/credits of any kind
- Multiple residential or workspace clusters
- Variable group sizes (only ever 4)
- Route optimization / live traffic-aware ETAs
- In-app chat (masked call only)
- Women-only matching toggle (flag as P1, add after MVP proves matching works — do build the `gender` field now so it's not a schema migration later)
- Employer HR dashboard/analytics (P1, add after pilot)
- Any AI/ML-based matching (simple radius/time-bucket grouping is sufficient for one cluster pair)

---

## 12. Suggested Build Order

1. Auth + verification (phone OTP + work email)
2. User profile + home zone pin + office entry time
3. Vehicle registration (driver flow)
4. Matching job (runs nightly, produces next day's groups of 4)
5. Trip confirmation flow (driver + 3 riders each confirm)
6. Driver view + Rider view (minimal fields from Section 5)
7. Live trip status + location sharing
8. Report/Block + SOS
9. Rating (post-trip, 1 tap)
10. Basic admin view for flagged trips

Build strictly in this order — do not start on Section 11's out-of-scope items until 1–9 work end-to-end for one real residential-to-workspace cluster pair.