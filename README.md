# Afiq Aidit — Portfolio

Next.js portfolio — **motion-first** home with classic sections, light/dark mode, and HTML resume.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Routes

| Path | Purpose |
|------|---------|
| `/` | **Main site** — GSAP hero, bento project grid, full experience |
| `/resume` | Printable HTML resume |
| `/style/classic` | Archived classic layout |
| `/style/bento` | Archived bento layout |
| `/style/motion` | Redirects to `/` |

Theme toggle in the nav (respects system preference by default).

Content: `src/content/*.ts`
