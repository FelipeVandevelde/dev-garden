# DevGarden

A portfolio and content project using Astro and Preact. Supports English and Portuguese (`en`/`pt-br`) locales, with custom Markdown plugins (wikilinks, callouts).

## Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and configure your `GH_PAT`.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Configuring the Obsidian Vault (Remote Content)

This project uses a custom Astro loader (`githubGardenLoader`) to fetch your digital garden notes directly from a remote GitHub repository containing your Obsidian vault.

### 1. GitHub Personal Access Token (GH_PAT)

To avoid GitHub API rate limits and to access private repositories, you must provide a GitHub Personal Access Token.

1. Go to your GitHub account settings > Developer settings > Personal access tokens > Tokens (classic) or Fine-grained tokens.
2. **For public repositories:** A token with no scopes is sufficient (it just increases your rate limit).
3. **For private repositories:** Generate a token with the `repo` scope (Classic) or read-only access to `Contents` (Fine-grained).
4. Add the token to your local `.env` file:
   ```env
   GH_PAT=github_pat_1234567890
   ```

### 2. Vault Structure & Localization

The remote loader expects your Obsidian vault to be organized by locale at the root level. The supported locales are `en` (English) and `pt-br` (Portuguese).

Example Vault Structure:
```text
/
├── en/
│   ├── my-first-note.md
│   └── web-development/
│       └── css-tricks.md
├── pt-br/
│   ├── minha-primeira-nota.md
│   └── web-development/
│       └── dicas-de-css.md
```

### 3. Note Formatting (Frontmatter)

Notes should contain valid YAML frontmatter. The loader uses this metadata to build the knowledge graph and render the pages.

**Supported Frontmatter Properties:**
- `title` (string): The title of the note. If omitted, the filename is used.
- `status` (string): The maturity status of the note. Accepts `sprout`, `seedling`, or `evergreen`. Defaults to `sprout`.
- `draft` (boolean): Set to `true` to exclude the note from production builds. Defaults to `false`.

**Example:**
```yaml
---
title: "My First Note"
status: "seedling"
draft: false
---

# Hello World

This is a digital garden note. I can link to other notes using wikilinks like [[CSS Tricks]].
```

### 4. Wikilinks & Connections

You can use standard Obsidian wikilinks (`[[Note Name]]` or `[[Folder/Note Name]]`) to link notes together. 
During the build step, the `generate-graph.js` script maps these connections to build the interactive 2D Knowledge Graph.
