# Motion lab demo: build spec

Handoff for the interactive hero demo inspired by creative agency sites (fluid cursor trails, grass that parts under the pointer). Read `docs/PROJECT-CONTEXT.md` first.

## Why this exists

A **Side projects** entry and route at `/demos/motion-lab`. It shows front-end craft (WebGL, shaders, interaction) without changing the calm GSAP home page at `/`.

## Hard rules

- **Main `/` stays CSS + GSAP only.** All Three.js / heavy WebGL lives under `/demos/motion-lab`
- **Never use em dashes (—) or en dashes (–)** in copy or comments
- **Not a clone** of emotion-agency.com: own palette tied to portfolio blue where possible, own copy, no stolen assets
- Respect **`prefers-reduced-motion`**: static hero, no sim loop
- Quality fallback on coarse pointer / low memory: fewer grass instances, lower fluid resolution

## Version 1 (shipped target)

| Layer | Behavior |
|-------|----------|
| Fluid | WebGL2 stable-fluids style dye; pointer splats purple/blue smoke; dissipates when idle |
| Grass | Instanced billboards; repel from cursor on ground plane; spring back |
| UI | Glass-style back link, hero line, stack chips in overlay |
| Card | `MotionLabCardPreview` on home Side projects grid |

## Stack

- Next.js App Router, TypeScript, Tailwind
- `three`, `@react-three/fiber` (this demo only)
- No GSAP required in v1

## Files

| Path | Role |
|------|------|
| `src/lib/motion-lab/fluid-sim.ts` | WebGL fluid simulation |
| `src/components/demos/motion-lab/*` | Canvas, grass scene, studio shell, card preview |
| `src/app/demos/motion-lab/page.tsx` | Route + metadata |
| `src/content/side-projects.ts` | Card content |

## Audio

Do **not** rip or host Emotion Agency files on their CDN paths, for example:

- `/audio/background/webm/main.webm` and `/audio/background/mp3/main.mp3`
- `/audio/background/.../lofi_loop`, `projects`
- `/audio/effects/.../transition`, `boom`, `typing`, `dial`, `knob_tick`

Their **UI** (what you pasted) is separate: `.header__sound`, `.sound-viz` with a `<canvas>` plus mute icon, and mobile `role="switch"` for Sound. That is layout and visualization, not the audio bytes.

Our demo plays only `public/demos/motion-lab/ambient.mp3` (Leberch, The Lonely Wind), looping, on by default. `createMotionLabAudio()` in `ambience.ts` plus `MotionLabSoundControl.tsx`.

## Identity

Green meadow (Malaysia-style lush grass), golden-hour light, pollen haze. Not a pixel clone of any agency site.
