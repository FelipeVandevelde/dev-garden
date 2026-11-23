# DevGarden

> 🇧🇷 [Leia em Português (pt-BR)](./README-pt-br.md)

A portfolio and digital garden template built with Astro and Preact. It ships in English and Portuguese (`en`/`pt-br`) and includes Obsidian-style wikilinks and callouts, an interactive knowledge graph, a command palette, and monochrome WCAG AAA themes.

**See it live:** [dev-garden-portfolio.vercel.app](https://dev-garden-portfolio.vercel.app) is a real portfolio built from this template ([source](https://github.com/FelipeVandevelde/dev-garden-portfolio)), with its notes coming from an Obsidian vault on GitHub. This repository ships a fictional "Jane Doe" profile and the sample notes in `sample-vault/`; run it locally to see them.

## Getting started

1. Create your copy:
   - **Use this template** on GitHub gives you a clean repository with a fresh history. You can't pull later template updates into it with a normal merge.
   - **Clone or fork** keeps the history, so you can pull updates later (see [Keeping your copy up to date](#keeping-your-copy-up-to-date)):
     ```bash
     git clone https://github.com/FelipeVandevelde/dev-garden.git my-portfolio
     ```
2. Install and run:
   ```bash
   cd my-portfolio
   npm install
   cp .env.example .env
   npm run dev
   ```
   The default `.env` reads the notes in `sample-vault/`, so the garden isn't empty on first run.

## Make it yours

All personal data lives in these files, so code changes from the template merge into your copy without touching them:

| File | What to change |
|---|---|
| `src/site.config.ts` | `author.name`, `author.githubUsername` (shows your latest public commits on the home page), `brand` (header label), `siteUrl` (also Astro's `site`), `social`, `githubRepositories` |
| `src/content/profile/en.json`, `pt-br.json` | Name, title, bio, principles, and the home page `metrics` |
| `src/content/projects/en/`, `pt-br/` | Project case studies, one JSON file per project |
| `src/data/skills.ts` | Nodes and links of the skills constellation |
| `src/data/github-mock.json` | Sample commits, shown while `githubUsername` is unset or GitHub is unreachable |
| `sample-vault/` | Sample notes; point `VAULT_REPO` or `LOCAL_VAULT_PATH` at your own vault instead |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with live reload of local vault notes |
| `npm run build` | Type checks (`astro check`), builds to `dist/`, indexes search with Pagefind, and writes `dist/vault-sync.json` |
| `npm run preview` | Serves `dist/` locally |
| `npx vitest run` | Unit tests |
| `npx playwright test` | End-to-end tests against `dist/`. Build with the sample vault first: `LOCAL_VAULT_PATH=sample-vault USE_REMOTE_VAULT=false npm run build` |

## Environment variables

| Variable | Purpose |
|---|---|
| `GH_PAT` | GitHub token for a remote vault and the repositories page. Public repositories need no scopes; a private vault needs read-only `Contents` (fine-grained) or `repo` (classic). |
| `VAULT_REPO` | `owner/repo` of the GitHub repository that holds your Obsidian vault |
| `LOCAL_VAULT_PATH` | Local vault folder, used instead of `VAULT_REPO` when it exists (defaults to `../vault-obsidian`) |
| `USE_REMOTE_VAULT` | `true` forces `VAULT_REPO` even when the local folder exists |
| `VAULT_SYNC_INTERVAL_MS` | How often `npm run dev` and `npm start` check the remote vault for new commits (default `60000`) |
| `DEPLOY_HOOK_URL` | Optional deploy hook that `npm start` and `npm run sync:vault` call when the vault changes |

With neither a local vault nor `VAULT_REPO`, the build still works; the garden is just empty.

## Writing notes

The vault is organized by language at the root. Subfolders become folder cards in the garden:

```text
/
├── en/
│   ├── digital-gardening.md
│   └── guides/
│       └── writing-notes.md
└── pt-br/
    ├── jardim-digital.md
    └── guias/
        └── escrevendo-notas.md
```

**Frontmatter:**

- `title` (string): shown on cards and previews; defaults to the file name
- `status` (string): `sprout`, `growing` or `evergreen`; anything else counts as `sprout`
- `draft` (boolean): `true` keeps the note out of the build
- `date`, `updated` (dates, optional)

```yaml
---
title: "Digital Gardening"
status: "evergreen"
date: 2026-01-12
---
```

**Wikilinks:** `[[Note Name]]`, `[[folder/note-name]]` or `[[Note Name|custom label]]`. Links match file names, ignoring case and accents, so `[[Sites Estáticos]]` finds `sites-estaticos.md`. A link to a missing note renders as a stub. The knowledge graph is built from these links at build time (`src/utils/graph.ts`).

**Callouts:** Obsidian syntax, such as `> [!note]`, `> [!tip] Title` or `> [!warning]`.

## Deploy to Vercel

The site is fully static, so it needs no Astro adapter.

1. Import the repository at [vercel.com/new](https://vercel.com/new). Vercel detects Astro, and `vercel.json` sets the build command and output folder.
2. Add the environment variables: `GH_PAT`, `VAULT_REPO` and `USE_REMOTE_VAULT=true`. For a demo with the sample notes, set `LOCAL_VAULT_PATH=sample-vault` instead.
3. Set `siteUrl` in `src/site.config.ts` to your Vercel URL.
4. To rebuild when you push notes, create a Deploy Hook (Project → Settings → Git → Deploy Hooks). Save it as the `VERCEL_DEPLOY_HOOK_URL` secret in your vault repository, and add this workflow there as `.github/workflows/trigger-vercel-deploy.yml`:

   ```yaml
   name: Trigger portfolio rebuild

   on:
     push:
       branches: [main]
       paths:
         - '**.md'
     workflow_dispatch:

   jobs:
     deploy-hook:
       runs-on: ubuntu-latest
       timeout-minutes: 2
       steps:
         - name: Call Vercel Deploy Hook
           env:
             HOOK_URL: ${{ secrets.VERCEL_DEPLOY_HOOK_URL }}
           run: |
             if [ -z "$HOOK_URL" ]; then
               echo "VERCEL_DEPLOY_HOOK_URL secret is not set; skipping."
               exit 0
             fi
             curl -fsS -X POST "$HOOK_URL"
   ```

   A push hook is used because Vercel's free plan runs cron jobs at most once a day.

### Self-hosting

`npm start` builds the site if needed, serves it with `astro preview`, and checks `VAULT_REPO` every `VAULT_SYNC_INTERVAL_MS`. When the vault has a new commit, it rebuilds and calls `DEPLOY_HOOK_URL` if set. `npm run sync:vault` runs that check once.

## Keeping your copy up to date

If you cloned or forked the template, add it as a remote:

```bash
git remote add upstream https://github.com/FelipeVandevelde/dev-garden.git
git fetch upstream
```

The first time you merge, keep your own personal files so the template's sample data doesn't replace them:

```bash
git merge --no-commit upstream/main
git checkout HEAD -- src/content/profile src/site.config.ts README.md README-pt-br.md
git commit
```

After that, `git merge upstream/main` only brings in new template changes.

## Project structure

```text
src/
├── content/      # profile and projects (JSON) + collection loaders (config.ts)
├── pages/        # routes for both languages
├── components/   # Astro and Preact components
├── plugins/      # remark plugins: wikilinks, callouts
├── data/         # skills constellation, sample commits
└── site.config.ts
sample-vault/     # fictional notes for local development and the e2e tests
scripts/          # vault-sync-server.mjs (self-hosting and build stamp)
tests/, e2e/      # Vitest unit tests, Playwright end-to-end tests
```

## License

[MIT](./LICENSE)
