# Clinic booking and queue demo: build spec

Handoff for the chat (or person) building the second side project. Read `docs/PROJECT-CONTEXT.md` first for who the owner is and how the site works. The first side project (`/demos/gis-map`, code in `src/components/demos/gis-map/`) is the reference for structure, page layout, and the home card preview.

## Why this exists

The portfolio's **Side projects** section shows small, self-built versions of the kind of systems the owner worked on at each employer. This one is inspired by his current role at **Selangkah Ventures** (backends for a health app and clinic management systems).

It is deliberately **one small slice**, not a copy of a real system: a patient books an appointment, a live queue shows who is being served, and clinic staff call the next patient. A visitor should understand it and try it in about two minutes.

## Hard rules

- **NDA safe.** Nothing from Selangkah or any real product: no names, logos, colours, screens, flows, wording, or data. Write everything from scratch with a generic design. The clinic, doctors, and patients are fictional
- **Never use em dashes (—) or en dashes (–)** in any text, comments, or docs. Use `-`, `:`, or a full stop
- **Next.js 16 has breaking changes.** Read the relevant guide in `node_modules/next/dist/docs/` before writing Next code (see `AGENTS.md`)
- Do not invent personal facts about the owner
- Stack stays: Next.js App Router, TypeScript, Tailwind v4, Framer Motion (light UI only), `lucide-react` icons. **No new dependencies** unless the owner agrees
- Keep portfolio copy in `src/content/`; demo seed data lives with the demo
- Commits: short message, owner as the only author, **no `Co-authored-by` or "Made with Cursor" trailers**

## Decisions (owner's picks)

| Topic | Decision |
|---|---|
| Clinic type | General clinic (GP) |
| Language | English only |
| Data | Each visitor gets their own sandbox in the browser (`localStorage`). No server, no database. "Reset demo" button |
| Live updates | Screens sync across browser tabs (e.g. staff in one tab, queue display in another) |

## The fictional clinic

- Name: **"Demo Family Clinic"** (clearly fictional; show a small "Demo, fictional data" badge on every screen)
- Hours: 9:00 to 13:00 and 14:00 to 18:00, Monday to Saturday
- Rooms: **Room 1** and **Room 2**, each with one fictional doctor (e.g. "Dr. Lim", "Dr. Farah"). No surnames that could match real people
- Services, with an average consult length used for wait estimates:

| Service | Avg minutes |
|---|---|
| General consultation | 10 |
| Follow-up | 7 |
| Medical check-up | 15 |
| Vaccination | 5 |

## Screens

Routes under `/demos/clinic-queue`:

| Route | Who | What it does |
|---|---|---|
| `/demos/clinic-queue` | Visitor | Overview: one line on what the demo is, three cards that open each screen (with a hint "open these in separate tabs to see live sync"), **Load sample day**, **Auto-play**, **Reset demo** |
| `/demos/clinic-queue/book` | Patient | Book a slot, then see "My ticket" |
| `/demos/clinic-queue/display` | Waiting room TV | Big "Now serving" per room and the next few numbers |
| `/demos/clinic-queue/staff` | Clinic staff | Check in, add walk-ins, call next, finish, no-show |

All pages share a slim header like `src/app/demos/gis-map/page.tsx` (back link to the portfolio, title) plus a small tab bar to switch screens.

### 1. Book (patient)

- Step 1: pick a service. Step 2: pick a date (today plus the next 6 clinic days) and a 15 minute slot. Full slots are disabled (capacity: one booking per room per slot, so 2 per slot). Past slots today are disabled
- Step 3: name (required) and phone (optional, Malaysian format hint like `012-345 6789`). Show "Don't enter real personal details. Data stays in your browser."
- Confirm creates a booking with a reference code (e.g. `DFC-7K2Q`)
- **My ticket** view: booking details, status, and once checked in today: queue number, position, people ahead, estimated wait, live. Cancel button while still booked. Remember the visitor's own ticket ids in `localStorage` so it survives refresh

### 2. Display (waiting room)

- Large, readable from a distance: per room "Now serving **A012**" and the doctor's name
- "Next" list of the following 4 to 6 numbers
- When a number is called, highlight it briefly (Framer Motion). Optional chime, **off by default** with a toggle (browsers block autoplay sound)
- Clock in the corner. Works full screen; no scrolling at 1080p
- Respect `prefers-reduced-motion`

### 3. Staff

- **Today's list** tabs: Booked (not arrived), Waiting, In consultation, Done / No-show
- **Check in** a booking: gives it a queue number and puts it in Waiting
- **Add walk-in**: name + service, gets a walk-in number straight into Waiting
- Per room: **Call next** (takes the first Waiting patient), **Recall** (re-announce), **Finish**, **No-show**
- Small stats strip: waiting now, served today, average wait so far
- No login. Show a note: "In a real system this screen is behind staff login."

## Queue rules

- Numbers: **A001...** for appointments (assigned at check-in), **W001...** for walk-ins. Reset per day
- Order of the Waiting list: checked-in appointments whose slot time has arrived go first, in slot order; then everyone else by arrival time. Keep this rule in one function with a short comment
- Status flow: `booked` → `waiting` (checked in or walk-in) → `called` → `in-consultation` → `done`. Side exits: `cancelled` (from booked), `no-show` (from booked or called)
- "Call next" sets `called`; the first click of "Start" (or calling again after a set time) moves to `in-consultation`. Keep it simple: one click from called to in-consultation is fine
- Estimated wait for a patient = sum of the average minutes of everyone ahead of them in Waiting, plus the remaining time of current consultations, divided by the number of open rooms. Round up to 5 minutes. Show "about 15 min", never a fake exact time

## State and tab sync

- One pure, framework-free module for the logic (e.g. `src/components/demos/clinic-queue/queue-store.ts`): types, reducer-style actions (`book`, `cancel`, `checkIn`, `addWalkIn`, `callNext`, `start`, `finish`, `noShow`, `reset`, `loadSample`), selectors (`waitingList`, `positionOf`, `estimatedWait`)
- Persist to `localStorage` under one versioned key (e.g. `clinic-demo:v1`). Validate on load; if the shape is wrong, reset instead of crashing
- Sync tabs with `BroadcastChannel` (fallback: the `storage` event). React side: a small hook using `useSyncExternalStore`
- **Hydration:** `localStorage` does not exist on the server. Render a skeleton until mounted, or mark the interactive parts as client-only, so there are no hydration mismatches
- Dates: store ISO strings; "today" uses the visitor's local time
- **Load sample day:** creates about 12 bookings across today's slots, checks some in, adds 2 walk-ins, so every screen has something to show
- **Auto-play** (overview toggle): every few seconds simulate the clinic: check someone in, call next, finish a consult, occasionally add a walk-in. Stops on toggle off, on Reset, and when the tab is hidden. This makes the display screen move on its own for visitors who don't want to click

## Where things go

```
src/app/demos/clinic-queue/page.tsx           Overview (server page + client parts)
src/app/demos/clinic-queue/book/page.tsx      Patient
src/app/demos/clinic-queue/display/page.tsx   Waiting room display
src/app/demos/clinic-queue/staff/page.tsx     Staff
src/app/demos/clinic-queue/layout.tsx         Shared header + screen tabs
src/components/demos/clinic-queue/            Client components, queue-store.ts, seed data
```

- Each page exports metadata (title like "Clinic queue demo: Staff"). Add the four routes to `src/app/sitemap.ts`
- Pages are small server components that render client components

## Wiring it into the portfolio

Add an entry in `src/content/side-projects.ts`:

- `id: "clinic-queue"`, `inspiredBy: "Selangkah Ventures"`, generic title (e.g. "Clinic booking and live queue")
- Description must say it is a simplified, fictional demo, e.g. "A simplified clinic booking and live queue system with fictional data, showing the kind of patient and staff flows I build."
- `status: "in-progress"` while building, `"live"` when done; `href: "/demos/clinic-queue"`
- `features` and `stack` honest to what was built (stack likely: Next.js, TypeScript, React, BroadcastChannel)

**Home card preview:** use the existing `preview` slot on `SideProjectCard` (see `GisMapCardPreview`). Make a lightweight animated mini "Now serving" board that cycles fake numbers. No `localStorage`, no heavy imports, `prefers-reduced-motion` shows a static frame. Whole preview links to `/demos/clinic-queue`. Wire it in `src/components/shared/sections.tsx` and `src/components/bento/BentoHome.tsx` like the GIS preview.

## Design

Match the site (see `.cursor/rules/portfolio-design.mdc`):

- Tokens from `src/app/globals.css`: `bg-background`, `bg-card`, `border-border`, `text-muted-foreground`, accent blue and cyan
- **Dark mode:** the site's dark `--card` is almost transparent. That's fine on the dark page, but check every panel has enough contrast. Any panel over an image or busy background needs a solid surface (see the `.dark .gis-map-root` override in `src/components/demos/gis-map/gis-map.css`)
- Status colours: waiting (blue), called (amber), in consultation (cyan), done (green), no-show/cancelled (muted or red). Use text labels as well as colour
- Rounded cards, small mono labels for numbers and times, big tabular numbers on the display screen (`tabular-nums`)
- Mobile first for Book and Staff; Display targets a landscape screen but must not break on a phone
- Accessibility: real buttons and labels, keyboard reachable, `aria-live="polite"` for "Now serving" and the patient's position

## Done when

- [ ] Book, Display, Staff, and the overview work on desktop and phone, light and dark
- [ ] Booking a slot, checking in, calling, and finishing all update the other open tabs within a second
- [ ] Load sample day, Auto-play, and Reset demo work; a refresh keeps state
- [ ] No hydration warnings in the console; a corrupted `localStorage` value resets instead of crashing
- [ ] "Demo, fictional data" badge on every screen; nothing resembles a real product
- [ ] Home card added with a lazy, light preview; status honest
- [ ] `npx eslint src`, `npx tsc --noEmit`, `npm run build` all pass
- [ ] No em dashes anywhere (`rg "—|–" src docs`)
- [ ] Committed in sensible batches, no co-author trailers, pushed to `main` (Vercel redeploys)
