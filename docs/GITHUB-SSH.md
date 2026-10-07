# Personal GitHub SSH (company laptop)

Use a **separate key** for personal GitHub. Company GitLab keeps using `~/.ssh/id_ed25519`.

## 1. Generate personal key (one time)

Use your **personal email** (e.g. Gmail tied to GitHub):

```bash
ssh-keygen -t ed25519 -C "afiqariff9314@gmail.com" -f ~/.ssh/id_ed25519_github_personal
```

- Press Enter for passphrase (recommended) or empty for convenience on a trusted machine.
- This does **not** replace or delete your existing GitLab key.

## 2. Add public key to GitHub (AfiqAidit account)

```bash
pbcopy < ~/.ssh/id_ed25519_github_personal.pub
```

1. [github.com/settings/keys](https://github.com/settings/keys) (logged in as **AfiqAidit**)
2. **New SSH key** → paste → save

## 3. Test

```bash
ssh -T git@github.com
```

Expect: `Hi AfiqAidit! You've successfully authenticated...`

## 4. Push portfolio

```bash
cd ~/Documents/Selangkah/Portfolio
git push -u origin main
```

Remote stays: `git@github.com:AfiqAidit/portfolio.git`

## 5. Git **commit** email (this repo only)

SSH key email is just a label. **Commit author** is set per repo (not global):

```bash
cd ~/Documents/Selangkah/Portfolio
git config user.email "afiqariff9314@gmail.com"
git config user.name "Muhammad Afiq Aidit Bin Mohd Ariff"
```

Verify: `git config user.email` (no `--global`).

Also add `afiqariff9314@gmail.com` in GitHub → **Settings → Emails** and verify it so commits link to your profile.

Optional GitHub noreply: `ID+AfiqAidit@users.noreply.github.com` (from GitHub email settings).

## SSH config (already set)

| Host        | Key file                              | Use        |
|-------------|----------------------------------------|------------|
| `github.com` | `~/.ssh/id_ed25519_github_personal`   | Personal   |
| `gitlab.com` | `~/.ssh/id_ed25519`                  | Company    |

## Company policy

Some employers restrict personal keys or repos on work laptops. If IT has rules, follow them or use HTTPS + PAT only for personal pushes.
