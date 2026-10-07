# Portfolio: project context

Paste this file into any AI assistant (coding or not) so it understands the project before helping.

## Who

- **Owner:** Muhammad Afiq Aidit Bin Mohd Ariff ("Afiq Aidit"), Software Engineer based in Hulu Langat, Selangor, Malaysia
- **Contact shown on site:** email `afiqariff9314@gmail.com` and LinkedIn
- **Background:** Java/Spring Boot backends, Laravel, NestJS, Next.js, and GIS (Leaflet, OpenLayers, GeoServer, PostgreSQL)

## Goal

A personal portfolio website that looks attractive but stays readable for recruiters. The owner wants the **website finished first**, then improves it step by step (screenshots, side project demos, custom domain).

## Writing style

**Never use em dashes (—) or en dashes (–).** Use a plain hyphen `-`, a colon, or a full stop instead. The owner feels em dashes make text look AI-written.

## Page structure

1. **Hero:** name, title, tagline with a rotating topic word, key stats
2. **About me:** two short paragraphs
3. **Work experience:** basics only: role, company, dates, one-line summary, tech chips. Full detail lives on `/resume`
4. **Education:** UKM (Computer Science, CGPA 3.86, Dean's List x6), UiTM Foundation (CGPA 4.00), plus university/SIG activities
5. **Side projects:** small self-built versions of what the owner did at each previous company, made with open data so visitors can try them. First one: an interactive GIS map (inspired by Puncak Tegap) with standard mapping features
6. **Skills:** grouped list
7. **Know me better:** personal, non-work content ("enough about work and code")

## Work history (for reference)

| Company | Role | Period |
|---------|------|--------|
| Selangkah Ventures | Full Stack Developer | Aug 2025 - present |
| Puncak Tegap | GIS Developer / Full Stack Developer | Nov 2024 - Aug 2025 |
| Elcorp Technology | Back-end Developer (contract) | Feb - May 2024 |
| Finexus International | Back-end Developer (internship) | Sep 2023 - Jan 2024 |

Company work is under NDA-style constraints: describe it at a high level, never show real company or patient data.

## Where content lives

All text is in `src/content/`:

| File | What to edit |
|------|--------------|
| `profile.ts` | Name, title, tagline (lead + rotating topics), stats, About paragraphs, email |
| `experience.ts` | Jobs: `summary` + `stack` (portfolio), `highlights` (resume) |
| `education.ts` | Degrees, CGPA, and university/SIG activities |
| `side-projects.ts` | Side projects, features, status, later `image` and `href` |
| `skills.ts` | Skill groups (arrays of items) |
| `personal.ts` | "Know me better": `thinking` quote and `facts` |

## Writing personal content with another AI

"Know me better" contains only what the owner has confirmed:

- **How he thinks:** stays open to other solutions and views, enjoys debating pros and cons to find the better option
- **Games:** Dota 2, Stardew Valley, Mobile Legends
- **Sports:** badminton
- Location, languages, school leadership roles, UKM programming club
- **Not included on purpose:** travel (he doesn't travel much)

When helping write more: ask the owner questions, use only what they tell you, keep each item short (one sentence), friendly, and professional enough for recruiters. Output in this shape so it can be pasted into `personal.ts`:

```ts
thinking: "One or two sentences about how he thinks or works with people.",
facts: [
  { icon: "gamepad", label: "Short label", value: "One sentence." },
],
```

Available icons: `gamepad`, `feather`, `map-pin`, `languages`, `award`, `graduation-cap`.

## Design rules

- Light and dark mode, following the device setting by default
- Confident blue accent with a cyan partner used only in gradients
- One signature animation in the hero (dot grid, drifting glows, rotating word); the rest is calm fade-up on scroll; respects reduced-motion
- No splash/"ENTER" screen, no heavy 3D
- Layout previews `/style/classic` and `/style/bento` are kept (URL only, hidden from search) for the owner to compare

## Tech and deploy

- Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, GSAP, next-themes
- Repo: `github.com/AfiqAidit/portfolio` → Vercel project `afiqdev` → `https://afiqdev.vercel.app`. Pushing to `main` redeploys
- Personal GitHub uses its own SSH key (`~/.ssh/id_ed25519_github_personal`); the company GitLab key is separate

## Roadmap

1. Website content and layout, SEO and link preview, layout switcher hidden (done)
2. Build side project demos. GIS map live at `/demos/gis-map` (done; spec `docs/GIS-DEMO-SPEC.md`, data notes `public/demos/gis-map/SOURCES.md`). Next: demos for the other employers
3. Add redacted screenshots
4. PDF resume, custom domain
