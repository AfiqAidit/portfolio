# GIS map demo: build spec

Handoff for the chat (or person) building the first side project. Read `docs/PROJECT-CONTEXT.md` first for who the owner is and how the site works.

## Why this exists

The portfolio's **Side projects** section shows small, self-built versions of what the owner did at each previous employer, made with **open data** so visitors can try them. This is the first one, inspired by his GIS work at **Puncak Tegap** (land administration web maps built with Leaflet/OpenLayers, GeoServer, PostgreSQL).

Right now the card on the home page says **"Planned"** and has no link. The goal is a working demo at `/demos/gis-map` plus a small live preview in that card.

## Hard rules

- **No Puncak Tegap or client data, code, styling, or screenshots.** Everything must be open data and written from scratch. It should show the *kind* of features he built, not copy the system
- **Never use em dashes (—) or en dashes (–)** in any text, comments, or docs. Use `-`, `:`, or a full stop
- **Next.js 16 has breaking changes.** Read the relevant guide in `node_modules/next/dist/docs/` before writing Next code (see `AGENTS.md`)
- Do not invent personal facts about the owner
- Stack stays: Next.js App Router, TypeScript, Tailwind v4, Framer Motion (light UI only). Map library: **Leaflet** (owner's main tool). Ask before adding other big dependencies
- Keep content in `src/content/`; don't hardcode portfolio copy in components

## Data (to be decided with the owner)

The map theme and dataset are **not decided yet**. Ask the owner before building. Options discussed:

1. **Selangor land administration**: state, district (daerah), and mukim boundaries with area and basic info. Closest to his eTanah/land admin work
2. **All of Malaysia**: state and district boundaries
3. **Bangi / Hulu Langat local**: boundaries plus points of interest from OpenStreetMap

Candidate open sources (check license and attribution before using):

- [geoBoundaries](https://www.geoboundaries.org/) (Malaysia ADM1/ADM2, CC BY 4.0)
- [OpenStreetMap](https://www.openstreetmap.org/) via Overpass or Geofabrik extracts (ODbL, requires "© OpenStreetMap contributors")
- [data.gov.my](https://data.gov.my/) for Malaysian attribute data (population etc.)

Data guidelines:

- Ship static **GeoJSON** in `public/demos/gis-map/` (no backend needed). Simplify geometry (e.g. mapshaper) so total data stays around **1-2 MB or less**
- Show attribution for every source in the map's attribution control
- Record each dataset's source, license, and date in a small `public/demos/gis-map/SOURCES.md`

## Features for version 1 (owner's picks)

| Feature | Notes |
|---|---|
| **Base map switcher** | At least streets (OSM), satellite (e.g. Esri World Imagery, with attribution), and a dark/light style matching the site theme |
| **Layer toggle + legend** | Turn each data layer on/off; legend shows colours/symbols for visible layers |
| **Click for details** | Popup or side panel with the feature's attributes (name, area, etc.) and highlight the selected shape |
| **Measure distance / area** | Click points to measure a line (km/m) or polygon (km²/ha); clear button |
| **Search a place** | Search features in the loaded layers by name first; optional place search via Nominatim (respect its usage policy, debounce, attribution) |
| **Live coordinates + locate me** | Show lat/lng under the cursor; "locate me" button using browser geolocation (handle permission denied gracefully) |

Not in version 1 (maybe later): drawing shapes and exporting GeoJSON.

## Where things go

```
src/app/demos/gis-map/page.tsx        Server page: metadata, layout, renders the client map
src/components/demos/gis-map/         Client components (Map, controls, panels)
public/demos/gis-map/*.geojson        Open data files
public/demos/gis-map/SOURCES.md       Data sources + licenses
```

- Leaflet touches `window`, so load the map in a **Client Component** with `next/dynamic` and `{ ssr: false }` (the `ssr: false` option only works inside Client Components; see `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`)
- Import Leaflet's CSS for the map; check marker icon paths work in production
- Page metadata: title like "GIS map demo", description mentioning open data and Leaflet. Add the route to `src/app/sitemap.ts`
- Page should use the site's `SiteNav` and a link back to the portfolio; the map can be full height below the nav

## Wiring it into the portfolio

In `src/content/side-projects.ts` for `id: "gis-map"`:

- Set `status` to `"in-progress"` while building, `"live"` when done
- Set `href: "/demos/gis-map"` (the card then shows "Open project")
- Update `features` and `stack` to match what was actually built (stay honest)

**Home page preview (owner said yes):** a small live map preview inside the GIS card on the home page that links to the full demo.

- Lazy: only load Leaflet when the card scrolls into view (dynamic import + IntersectionObserver or similar). The home page must not get heavier on first load
- Non-interactive in the card (no scroll-wheel zoom hijacking; the whole preview is a link to `/demos/gis-map`)
- Fixed aspect ratio (e.g. 16/10) with a skeleton while loading so the layout doesn't jump
- `SideProjectCard` currently supports an optional `image`; add an optional preview slot rather than a GIS-specific hack, so later side projects can use it too

## Design

Match the site (see `.cursor/rules/portfolio-design.mdc`):

- Tokens from `src/app/globals.css`: `bg-background`, `bg-card`, `border-border`, `text-muted-foreground`, accent `--accent` (blue) and `--accent-2` (cyan)
- Light and dark mode via `next-themes` (`class` on `<html>`). Map controls and panels follow the theme; the default base map can switch with the theme
- Controls: rounded cards (`rounded-2xl border bg-card`), small mono labels for coordinates and units
- Data layer colours: use the accent blue/cyan family with readable contrast in both themes
- Mobile: controls collapse into a bottom sheet or a menu; the map stays usable with touch
- Accessibility: controls are real buttons with labels, keyboard reachable; respect `prefers-reduced-motion` (no animated fly-to when reduced)

## Done when

- [ ] `/demos/gis-map` works on desktop and phone, light and dark
- [ ] All six version 1 features work
- [ ] Every dataset has attribution on the map and an entry in `SOURCES.md`
- [ ] Home card shows a lazy live preview and links to the demo; status updated honestly
- [ ] `npx eslint src`, `npx tsc --noEmit`, `npm run build` all pass
- [ ] No em dashes anywhere (`rg "—|–" src docs`)
- [ ] Committed in sensible batches and pushed to `main` (Vercel redeploys)
