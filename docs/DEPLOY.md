# Deploy portfolio: GitHub + custom domain

You already know **VPS flow** (public IP → DNS A record → nginx → `git pull`).  
For a **Next.js** portfolio, the common path is **Git push → host builds for you** (no nginx on your side).

## Recommended: GitHub + Vercel (fits Next.js)

| Step | VPS (what you know) | GitHub + Vercel |
|------|---------------------|-----------------|
| Code | `git pull` on server | `git push` to GitHub |
| Build | You run build on server | Vercel runs `npm run build` automatically |
| HTTPS | Certbot on nginx | Vercel provides free SSL |
| DNS | A record → your IP | CNAME or A → Vercel |

### 1. Create a GitHub repository

1. [github.com/new](https://github.com/new): name e.g. `portfolio`, **Public** (for contribution graph if you want).
2. Do **not** commit `.env` or secrets.

From your machine:

```bash
cd /Users/Rauf/Documents/Selangkah/Portfolio
git remote add origin git@github.com:YOUR_USERNAME/portfolio.git
git add .
git commit -m "Initial portfolio site"
git push -u origin main
```

Use a GitHub-linked email on commits if you want them on your profile graph:

```bash
git config user.email "YOUR_GITHUB_EMAIL@..."
```

(Repo-local config only. Do not change global git config unless you intend to.)

### 2. Deploy on Vercel (free tier)

1. Sign in at [vercel.com](https://vercel.com) with **GitHub**.
2. **Add New Project** → import your `portfolio` repo.
3. Framework: **Next.js** (auto-detected). Build command: `npm run build`. Output: default.
4. Deploy. You get `https://portfolio-xxx.vercel.app`.

Every `git push` to `main` redeploys (like CI + auto `git pull` + build, but managed).

### 3. Custom domain (your personal URL)

1. Buy a domain (Namecheap, Cloudflare Registrar, Google Domains successor, etc.), or use a domain from GitHub if you purchased one there.
2. In **Vercel** → Project → **Settings → Domains** → add `afiq.dev` (example) and `www`.
3. Vercel shows DNS records. At your registrar:

   - **Root** `@`: often `A` to Vercel’s IP **or** `ALIAS`/`ANAME` if supported  
   - **www**: `CNAME` → `cname.vercel-dns.com`

4. Wait for DNS (minutes to 48h). Vercel issues HTTPS automatically.

You do **not** need nginx or a VPS for this stack unless you choose self-hosting later.

### Alternative: GitHub Pages

GitHub Pages is great for **static HTML**. Next.js needs **static export** (`output: 'export'`) and skips some features. Prefer **Vercel** for this project unless you want Pages-only.

### Alternative: Your VPS + nginx (familiar path)

1. Install Node 20+, clone repo, `npm ci && npm run build`.
2. Run app with **PM2**: `pm2 start npm --name portfolio -- start` (Next listens on 3000).
3. nginx reverse proxy to `localhost:3000`, Certbot for SSL.
4. DNS **A record** → VPS IP.

You maintain updates with `git pull && npm ci && npm run build && pm2 restart portfolio`.

---

## Checklist before first deploy

- [ ] `npm run build` passes locally
- [ ] No secrets in repo
- [ ] Resume/content reviewed
- [ ] Optional: add screenshots under `public/projects/` and set `image` in `featured-work.ts`

## After deploy

- Test light/dark mode and `/resume`
- Open site on mobile
- Add domain to LinkedIn when ready
