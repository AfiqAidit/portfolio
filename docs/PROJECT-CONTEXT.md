# Portfolio — project context

Paste this file into any AI assistant (coding or not) so it understands the project before helping.

## Who

- **Owner:** Muhammad Afiq Aidit Bin Mohd Ariff ("Afiq Aidit"), Software Engineer based in Hulu Langat, Selangor, Malaysia
- **Contact shown on site:** email only, `afiqariff9314@gmail.com`
- **Background:** Java/Spring Boot backends, Laravel, NestJS, Next.js, and GIS (Leaflet, OpenLayers, GeoServer, PostgreSQL)

## Goal

A personal portfolio website that looks attractive but stays readable for recruiters. The owner wants the **website finished first**, then improves it step by step (screenshots, side project demos, custom domain).

## Page structure

1. **Hero** — name, title, one-line tagline
2. **About me** — two short paragraphs
3. **Work experience** — basics only: role, company, dates, one-line summary, tech chips. Full detail lives on `/resume`
4. **Education** — UKM (Computer Science, CGPA 3.86, Dean's List x6), UiTM Foundation (CGPA 4.00), plus university/SIG activities
5. **Side projects** — small self-built versions of what the owner did at each previous company, made with open data so visitors can try them. First one: an interactive GIS map (inspired by Puncak Tegap) with standard mapping features
6. **Skills** — grouped list
7. **Know me better** — personal, non-work content ("enough about work and code")

## Work history (for reference)

| Company | Role | Period |
|---------|------|--------|
| Selangkah Ventures | Full Stack Developer | Aug 2025 – present |
| Puncak Tegap | GIS Developer / Full Stack Developer | Nov 2024 – Aug 2025 |
| Elcorp Technology | Back-end Developer (contract) | Feb – May 2024 |
| Finexus International | Back-end Developer (internship) | Sep 2023 – Jan 2024 |

Company work is under NDA-style constraints: describe it at a high level, never show real company or patient data.

## Where content lives

All text is in `src/content/`:

| File | What to edit |
|------|--------------|
| `profile.ts` | Name, title, tagline, About paragraphs, email |
| `experience.ts` | Jobs: `summary` + `stack` (portfolio), `highlights` (resume) |
| `education.ts` | Degrees and university/SIG activities |
| `side-projects.ts` | Side projects, features, status, later `image` and `href` |
| `skills.ts` | Skill groups |
| `personal.ts` | "Know me better" facts and `interests` (hobbies) |

## Writing personal content with another AI

The "Know me better" section currently has only facts the owner has confirmed (location, languages, school leadership roles, UKM programming club). Hobbies/interests are empty and hidden until filled.

When helping write it: ask the owner questions, use only what they tell you, keep each item short (one sentence), friendly, and professional enough for recruiters. Output in this shape so it can be pasted into `personal.ts`:

```ts
facts: [
  { label: "Short label", value: "One sentence." },
],
interests: ["Hobby one", "Hobby two"],
```

## Design rules

- Light and dark mode; sky accent; subtle motion only (GSAP hero + scroll reveal); respects reduced-motion
- No splash/"ENTER" screen, no heavy 3D
- Layout previews `/style/classic` and `/style/bento` are kept for the owner to compare; the switcher bar will be hidden before launch

## Tech and deploy

- Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, GSAP, next-themes
- Repo: `github.com/AfiqAidit/portfolio` → Vercel project `afiqdev` → `https://afiqdev.vercel.app`. Pushing to `main` redeploys
- Personal GitHub uses its own SSH key (`~/.ssh/id_ed25519_github_personal`); the company GitLab key is separate

## Roadmap

1. Finish website content and layout (now)
2. Build side project demos, starting with the GIS map
3. Add redacted screenshots
4. Final: hide layout switcher, SEO metadata, PDF resume, custom domain
