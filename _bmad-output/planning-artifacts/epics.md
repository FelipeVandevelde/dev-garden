---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-bmad-first-project-2026-08-23/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad-first-project-2026-08-22/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad-first-project-2026-08-22/EXPERIENCE.md
---

# bmad-first-project - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad-first-project (Astro Personal Portfolio & Study Hub Engine), decomposing the requirements from the PRD, UX Design contract, and Architecture specifications into implementable stories.

## Source References

This epic breakdown derives from and must remain consistent with:
- [PRD](../prd.md) — Functional requirements FR-1 through FR-15, NFRs, and success metrics
- [Architecture Spine](../architecture/architecture-bmad-first-project-2026-08-23/ARCHITECTURE-SPINE.md) — Architectural decisions AD-1 through AD-10
- [UX Design](../ux-designs/ux-bmad-first-project-2026-08-22/DESIGN.md) — Design tokens and component specifications
- [UX Experience](../ux-designs/ux-bmad-first-project-2026-08-22/EXPERIENCE.md) — Interaction patterns and accessibility contracts

## Epic List

### Epic 1: Engine Foundation, Shell & Monochromatic Theming
A visitor or developer lands on the site and navigates a brutalist, hyper-technical monochromatic shell across `pt-BR` and `en-US`, switches instantly between all 4 theme modes (Dark, Light, HC-Dark, HC-Light) with zero FOUC, navigates via global keyboard shortcuts (`g h`, `g p`, `g g`, `g r`, `t t`, `t l`), and forks the project to configure their complete identity in `site.config.ts` with 100% static edge export.
**FRs covered:** FR2, FR3, FR14, FR15 (and ARCH-1, ARCH-7, ARCH-8, UX-DR1, UX-DR2, UX-DR3, UX-DR10, UX-DR11)

### Epic 2: About Hub, Competency Constellation & Live Activity
Technical recruiters and hiring managers (Lucas) evaluate the author's background, interact with the RPG Tech Skill Constellation (clicking nodes to highlight domain connections with 25% background dimming and full keyboard accessibility), and review verified recent public GitHub commits aggregated at build time without client tokens or rate-limit failures.
**FRs covered:** FR4, FR5 (and UX-DR7)

### Epic 3: Flagship Project Showcase & Repositories Catalog
Visitors review production-grade engineering case studies featuring live links and deep 4-tier Curator Notes (*Context*, *Architecture & Choices*, *Key Trade-offs*, *Lessons Learned*), explore sandbox repositories with live build-time GitHub stats (stars, forks, open issues, topics), and filter projects and repos with zero runtime latency.
**FRs covered:** FR6, FR7, FR8 (and UX-DR5)

### Epic 4: Digital Garden Pipeline & Secure Obsidian Ingestion
Knowledge seekers (Elena) read and navigate interconnected study notes authored in Markdown/MDX with Obsidian `[[wikilinks]]`, callouts (`[!NOTE]`, `[!TIP]`), maturity indicators (`[SPROUT]`, `[GROWING]`, `[EVERGREEN]`), debounced hover preview popovers, and curated Maps of Content (MOC) pathways. Meanwhile, template authors (Marcus) safely keep unfinished or personal notes in `_private/` and `draft: true` knowing the build pipeline guarantees zero private content leaks.
**FRs covered:** FR9, FR10, FR12, FR13 (and ARCH-2, ARCH-3, ARCH-4, ARCH-9, UX-DR4, UX-DR6)

### Epic 5: Visual Knowledge Graph & Global Command Palette
Readers discover concept relationships using an interactive 2D force-directed canvas graph with direct hover zoom (automatically swapping to an accessible, categorized hierarchical HTML list on mobile <768px), and instantly search across all projects, garden notes, and repositories or trigger theme/locale switches via the centralized `Cmd+K` / `Ctrl+K` Command Palette powered by Pagefind static chunk indexing (<50ms response).
**FRs covered:** FR1, FR11 (and ARCH-5, ARCH-6, ARCH-8, UX-DR8, UX-DR9)

---

## Epic 1: Engine Foundation, Shell & Monochromatic Theming

Set up the greenfield Astro 5.3+ project, decoupled `site.config.ts` configuration engine, FOUC-free 4-mode monochromatic CSS tokens system, responsive base shell with focus-guarded keyboard shortcuts, bilingual i18n routing (`en` / `pt-BR`), and 100% static build export.

### Story 1.1: Greenfield Project Setup & Centralized Configuration Contract (`site.config.ts`)

As a developer / template forker,
I want a strongly typed configuration contract in `src/site.config.ts` validated with Zod,
So that I can customize author identity, metadata, navigation, locales, and feature flags in one file with zero engine code modification.

**Acceptance Criteria:**

**Given** a fresh Astro 5.3+ project with TypeScript strict mode enabled
**When** `src/site.config.ts` is created and imported across layouts
**Then** it exports a Zod schema `siteConfigSchema` and validated default configuration object with author profile, social links, navigation menu, default locale (`en`), supported locales (`['en', 'pt-BR']`), and theme defaults
**And** running the build with an invalid `site.config.ts` throws a clear Zod validation error identifying the failing field

### Story 1.2: FOUC-Free 4-Mode Monochromatic Theming Engine & Design Tokens

As a site visitor,
I want a zero-FOUC 4-mode monochromatic theme engine supporting Dark, Light, High-Contrast Dark (21:1), and High-Contrast Light (21:1),
So that I can read content comfortably with verified WCAG AAA accessibility across any lighting condition.

**Acceptance Criteria:**

**Given** `src/styles/tokens.css` with CSS custom properties for standard Dark (`#000000`/`#121212`), Light (`#FFFFFF`/`#F4F4F6`), High-Contrast Dark (21:1 text, `#FFFF00` focus), and High-Contrast Light (21:1 text, `#000000` focus)
**When** a user loads any page or reloads the browser
**Then** a synchronous blocking `<head>` inline script evaluates `localStorage` (with automatic in-memory fallback via a `safeStorage` wrapper) and applies `data-theme` before DOM paint with zero flash of unstyled content
**And** cycling themes via the UI or `t t` shortcut updates `data-theme` and persists the selection in `safeStorage`
**And** all contrast ratios meet or exceed 7:1 for standard modes and 21:1 for high-contrast modes
**And** native text `::selection` and keyboard `:focus-visible` states are explicitly styled across all 4 modes to guarantee legibility

### Story 1.3: Responsive Global Shell, Header, Status Footer & Global Keyboard Shortcuts

As a keyboard-focused reader or recruiter,
I want a responsive brutalist terminal shell with navigation headers, status footer, and global keyboard shortcuts (`g h`, `g p`, `g g`, `g r`, `t t`, `t l`, `Esc`),
So that I can navigate across core surfaces rapidly while keeping shortcut execution blocked when focused inside text inputs.

**Acceptance Criteria:**

**Given** the base layout (`BaseLayout.astro`) and header/footer shell components
**When** a user presses `g h`, `g p`, `g g`, or `g r` while not focused on an `<input>` or `<textarea>`
**Then** the browser navigates immediately to the Home, Projects, Garden, or Repositories surface respectively
**And** when focus is within an `<input>`, `<textarea>`, `contenteditable` element, element with `role="textbox"`, or active modal, single-key navigation shortcuts are strictly ignored
**And** the footer renders git build hash, timestamp, and RSS link with pure planar borders (zero drop shadows)
**And** responsive breakpoints (`sm`, `md`, `lg`) govern layout shifts to prevent horizontal scrolling on mobile
**And** a strict Z-Index scale (Base 1, Popover 100, Modal 200) governs all elevation
**And** `@media (prefers-reduced-motion: reduce)` disables all transition animations, hover delays, and popover transitions for vestibularly sensitive users

### Story 1.4: Bilingual Internationalization Routing (pt-BR / en-US) & Fallback Engine

As a bilingual reader or international recruiter,
I want seamless `en` and `pt-BR` routing with route context preservation and content fallback banners,
So that I can view UI chrome and content in my preferred language without broken links or 404 errors.

**Acceptance Criteria:**

**Given** the bilingual routing setup with Astro i18n
**When** the user toggles language via the header toggle or `t l` shortcut on `/projects`
**Then** the URL updates to the corresponding localized path (e.g. `/pt/projetos`) while maintaining route context
**And** all system labels, buttons, and navigation adapt immediately to the selected locale
**And** if a digital garden note exists only in one language, it renders in that language with a top language banner (`[ORIGINAL_LANG: EN // NOTA DISPONÍVEL APENAS EM INGLÊS]`) rather than throwing a 404 or build failure
**And** `npm run build` outputs a static `dist/` directory ready for edge deployment

---

## Epic 2: About Hub, Competency Constellation & Live Activity

Build the Home / About Hub landing page, Profile Content Collection (`src/content/profile/`), interactive RPG Tech Skill Constellation with monochromatic active states and domain filtering, and the build-time GitHub commit activity aggregator with rate-limit fallback.

### Story 2.1: Author Profile Content Collection & About Hub Page

As a tech recruiter or visitor,
I want to read the author's biography, background, core principles, and verified contact links on the Home hub,
So that I can immediately understand their seniority, engineering philosophy, and focus.

**Acceptance Criteria:**

**Given** `src/content/profile/` managed via Astro Content Collection with Zod schema (name, title, bio, principles, socialLinks)
**When** visiting `/` (or `/[lang]/`)
**Then** the About Hub renders the hero banner, technical bio, and quick navigation flags with 100% monochromatic styling conforming to WCAG AAA contrast
**And** all data is derived strictly from content collections and `site.config.ts` with zero hardcoded author credentials

### Story 2.2: Interactive RPG Tech Skill Constellation Component

As Lucas (Tech Recruiter / Engineering Manager),
I want an interactive node-link skill constellation grouped by domain (Frontend, Backend, Architecture, DevOps) that toggles active states and filters related content,
So that I can evaluate candidate competencies interactively with complete keyboard accessibility.

**Acceptance Criteria:**

**Given** the RPG Tech Skill constellation component rendered on the About Hub
**When** a user clicks an inactive skill node
**Then** the node toggles to an inverted solid fill (`#FFFFFF` in Dark / `#000000` in Light), connected wirelines illuminate, unrelated nodes dim to 25% opacity, and the page filters associated case studies and garden notes
**And** clicking the active node again or pressing `Esc` deselects it and resets the view
**And** clicking a new node while another is already selected immediately clears the previous selection to prevent collision
**And** keyboard users can navigate nodes via `Tab` / Arrow keys and select/deselect with `Space` or `Enter`
**And** `@media (prefers-reduced-motion: reduce)` disables pulse animations and node transitions

### Story 2.3: Build-Time GitHub Activity & Commit Stream Aggregator

As a hiring manager or peer developer,
I want to see recent public GitHub commits and repository activity aggregated at build time,
So that I have transparent proof of active development without client-side API rate limits or exposed access tokens.

**Acceptance Criteria:**

**Given** the build-time GitHub integration in the static generation pipeline
**When** `astro build` executes
**Then** it fetches recent public commits for the author's configured repositories via GitHub API and emits static activity markup
**And** if the GitHub API rate limit is exceeded or offline, the build falls back gracefully to cached/mock commit data without failing the build
**And** zero client-side API requests or access tokens are present in the client JavaScript bundle
**And** a default mock data fixture ships with the template so the first-ever build succeeds even when no local cache exists and the GitHub API is unreachable
**And** production deployments support configurable CRON or webhook triggers to periodically re-build for data freshness

---

## Epic 3: Flagship Project Showcase & Repositories Catalog

Create the Projects Content Collection (`src/content/projects/`), Flagship Showcase index and case study pages (`src/pages/projects/`), 4-tier Curator Notes drawer component, and Repositories Catalog (`src/pages/repos/`) with build-time GitHub repository stats ingestion.

### Story 3.1: Projects Content Collection Schema & Flagship Showcase Index

As a visitor or prospective client,
I want to browse a curated showcase of flagship engineering projects with demo links, tech stack badges, and production status tags,
So that I can evaluate real-world production systems and technical breadth.

**Acceptance Criteria:**

**Given** `src/content/projects/` validated via Zod schema (title, summary, date, stack, demoUrl, repoUrl, featured, curatorNotes)
**When** navigating to `/projects` (or `/pt/projetos`)
**Then** the projects showcase index displays flagship projects with production badges, tags, and direct links to case studies
**And** projects are categorized clearly to separate deep flagship case studies from sandbox repos (FR7)

### Story 3.2: Deep Case Study Pages with 4-Tier Curator Notes Drawer

As Lucas (Engineering Manager),
I want to open project case studies featuring structured Curator Notes (*Context*, *Architecture*, *Key Trade-offs*, *Lessons Learned*) with distinct border styling,
So that I can inspect the engineering depth, architectural trade-offs, and lessons behind each project.

**Acceptance Criteria:**

**Given** a project case study page rendered at `/projects/[...slug]`
**When** the user opens the case study and reviews Curator Notes
**Then** four distinct sections render with semantic border styling: Context & Motivation, `// [SYS_ARCH]` (3px solid left border), `// [TRADE_OFF]` (3px double left border), and `// [LESSONS]` (3px dashed left border)
**And** long-form architectural markdown and code blocks render with monospace headers and WCAG AAA contrast

### Story 3.3: Repositories Catalog with Build-Time GitHub Metadata & Tag Filtering

As a peer developer or open-source explorer,
I want an automated catalog of public repositories displaying stars, forks, open issues, primary language, and topic tags with instant filtering,
So that I can explore tools, libraries, and sandboxes without client-side latency.

**Acceptance Criteria:**

**Given** the repository slugs configured in `site.config.ts`
**When** the static site builds
**Then** it ingests GitHub metadata (stars, forks, open issues, primary language, topics) for each repo and renders `/repos` (or `/pt/repos`)
**And** users can filter repositories by primary language or topic tag with instant UI updates and zero network requests

---

## Epic 4: Digital Garden Pipeline & Secure Obsidian Ingestion

Create the Garden Content Collection (`src/content/garden/`), Remark wikilinks AST resolver, Rehype callouts transformer, maturity status filtering (`sprout`, `growing`, `evergreen`), debounced wikilink hover preview popovers, curated MOC pathways, and the strict build-time privacy quarantine boundary (`_private/`, `draft: true`) with CI audit script.

### Story 4.1: Build-Time Privacy Quarantine Boundary & Leak-Proof CI Audit

As Marcus (Template Forker / Vault Owner),
I want an absolute build-time quarantine filter that excludes `_private/` directories and `draft: true` files, backed by an automated CI audit script,
So that I can keep unreleased thoughts and private notes in my local vault without risking data leaks in production.

**Acceptance Criteria:**

**Given** content collections loader in `src/content/config.ts`
**When** `astro build` runs
**Then** any file within `_private/` or marked `draft: true` is strictly filtered out before AST transformation and page generation
**And** `audit-quarantine.js` executes against `dist/` in CI asserting zero quarantined slugs, search index entries, or sitemap references exist
**And** if any quarantined file is detected in `dist/`, the build immediately fails with a non-zero exit code

### Story 4.2: Remark Wikilinks Plugin, Slug Registry & Private Link Stubs

As an author writing in Obsidian,
I want `[[wikilink]]` and `[[wikilink|custom label]]` syntax to automatically resolve to valid relative web routes or safe non-navigable stubs,
So that my digital garden notes interlink seamlessly without breaking builds on unreleased notes.

**Acceptance Criteria:**

**Given** `src/plugins/remark-wikilinks.ts` integrated into `astro.config.mjs`
**When** a note contains `[[Note Name]]` or `[[Note Name|Alias]]`
**Then** valid public notes resolve to `<a href="/garden/note-name">Alias</a>`
**And** wikilinks pointing to missing or quarantined private notes render as `<span class="wikilink-stub">[🔒 private-concept 🔒]</span>` with a build warning logged, without crashing the build
**And** hovering over a wikilink-stub element displays a tooltip reading "Private or work-in-progress note" without triggering preview popovers or network requests

### Story 4.3: Obsidian Callouts, Maturity Status Badging & Garden Index Filtering

As Elena (Knowledge Seeker),
I want notes to display Obsidian callouts (`[!NOTE]`, `[!TIP]`, `[!WARNING]`) and monochromatic maturity badges (`[SPROUT]`, `[GROWING]`, `[EVERGREEN]`) with index filtering,
So that I can easily gauge note maturity and filter content by progress stage.

**Acceptance Criteria:**

**Given** `rehype-callouts.ts` and the garden collection schema
**When** rendering `.md` and `.mdx` notes
**Then** Obsidian callouts render with semantic monochrome borders and icons
**And** garden notes display maturity badges: `[SPROUT // SEED]` (1px dotted border), `[GROWING // EXPANDING]` (1px dashed border), or `[EVERGREEN // PRODUCTION]` (1px solid inverted border)
**And** maturity badge icons contain `aria-hidden="true"` and visually hidden text for screen readers
**And** the `/garden` index allows filtering and sorting notes by maturity status and last updated timestamp

### Story 4.4: Wikilink Hover Preview Popover & Maps of Content (MOC) Pathways

As a digital garden reader,
I want debounced hover preview popovers over wikilinks and structured Maps of Content (MOC) index notes with progressive learning steps,
So that I can preview interconnected concepts without losing my reading context and follow structured study pathways.

**Acceptance Criteria:**

**Given** a wikilink in note content
**When** hovering over the link for **200ms** (debounce guard)
**Then** a floating preview popover renders displaying note title, maturity badge, excerpt, and backlink count, with a **150ms** grace period on hover exit
**And** hover preview data (title, maturity badge, excerpt, backlink count) is sourced from lightweight JSON partials generated at build time, not from full-page document fetches
**And** popover positioning is viewport-aware: the card repositions when triggered near viewport edges to prevent off-screen rendering or unwanted scrolling
**And** the 200ms debounce timer is explicitly cleared if the user's cursor exits the trigger before the timeout finishes
**And** digital garden lists implement an empty state (`opacity: 0.5`, `// No data found`) when no notes match
**And** MOC notes render step-by-step reading pathways with estimated reading times and linked sub-topics

---

## Epic 5: Visual Knowledge Graph & Global Command Palette

Implement the build-time graph adjacency matrix builder (`/graph-data.json`), Dual-Surface 2D Knowledge Graph (Preact canvas island + semantic mobile HTML list fallback), Pagefind post-build search indexing, and centralized `Cmd+K` Command Palette island with fuzzy search, action commands, and keyboard focus trapping.

### Story 5.1: Build-Time Graph Adjacency Generator & Semantic Mobile Fallback List

As an accessible web reader or mobile user (<768px),
I want a pre-computed graph adjacency matrix emitted at build time and a semantic HTML fallback list of inbound/outbound backlinks,
So that I can explore note relationships on mobile and zero-JS environments with zero CPU throttling.

**Acceptance Criteria:**

**Given** the AST wikilink traversal during `astro build`
**When** the build completes
**Then** `dist/graph-data.json` is emitted containing all public note nodes and bidirectional link edges
**And** on viewports below 768px (or with JS disabled), the page server-renders an accessible `<nav class="graph-fallback">` listing incoming and outgoing note connections organized by topic

### Story 5.2: Interactive 2D Force-Directed Canvas Graph Island

As a desktop knowledge seeker (Elena),
I want an interactive 2D force-directed canvas graph with direct container hover zoom and node click navigation,
So that I can visually discover clusters of related concepts across the digital garden.

**Acceptance Criteria:**

**Given** the 2D Knowledge Graph Preact island (`client:visible`) on desktop viewports (>= 768px)
**When** viewing the graph
**Then** nodes are sized by connection density and clicking a node navigates directly to that note
**And** mouse wheel zoom/pan is active strictly when pointer is over the canvas container, instantly restoring normal body scroll when pointer exits
**And** resizing window below 768px unmounts the canvas and cleans up animation loops to prevent battery/CPU drain
**And** when the viewport crosses the 768px breakpoint (in either direction), any active graph state (selected node, zoom level) resets gracefully rather than being silently lost

### Story 5.3: Post-Build Pagefind Static Search Indexing Pipeline

As a developer / site builder,
I want static chunked search indexing via Pagefind executing post-build,
So that search indexes scale efficiently without shipping large JSON blobs on initial page load.

**Acceptance Criteria:**

**Given** `npm run build` static generation
**When** post-build step runs
**Then** Pagefind indexes compiled HTML in `dist/` generating chunked static search artifacts
**And** initial page load includes zero Pagefind JavaScript/WASM bundles (0KB baseline JS footprint)

### Story 5.4: Centralized Command Palette Island (`Cmd+K`) with Fuzzy Search & Action Dispatcher

As a power user, recruiter, or reader,
I want a centered modal Command Palette triggered via `Cmd+K` / `Ctrl+K` for fuzzy searching notes, projects, and repos, and instantly toggling themes and languages,
So that I can navigate and command the entire platform from the keyboard in <50ms.

**Acceptance Criteria:**

**Given** the Command Palette Preact island
**When** the user presses `Cmd+K` (macOS), `Ctrl+K` (Windows/Linux), or clicks the header search trigger
**Then** the palette modal opens in <50ms with focus trapped inside the monospace `>_` input
**And** typing queries performs fuzzy search across projects, garden notes, and repositories via lazy-loaded Pagefind WASM/JS API with highlighted query matches
**And** the palette displays a loading state (`>_ Searching...`) while waiting for async Pagefind results
**And** the palette provides quick action commands to switch themes (Dark, Light, HC-Dark, HC-Light) and toggle languages (`pt-BR` <-> `en`)
**And** pressing `Cmd+K` again, pressing `Esc`, or clicking the modal backdrop closes the modal and returns focus to previous trigger
**And** if Pagefind WASM or index chunks fail to load due to network error, the palette displays a clear error state with a retry action rather than hanging silently
**And** closing the palette (via `Cmd+K` toggle or `Esc`) returns keyboard focus to the element that was focused before the palette opened
**And** a visible search trigger icon in the header bar provides mobile and touch-device users access to the palette without requiring a hardware keyboard shortcut

## Epic 6: Technical Debt & i18n Refactoring

Consolidate duplicated page logic across bilingual routes by migrating to a shared UI component architecture.

### Story 6.1: Refactor UI Text and Abstract Duplicated Route Pages

As a developer,
I want to implement dynamic routing and abstract UI text,
So that I can eliminate duplicated route pages in English and Portuguese and avoid violating DRY principles.

**Acceptance Criteria:**
- Move all existing pages to src/pages/[...lang]/ and delete src/pages/pt-br/.
- Segregate src/content/garden/ and src/content/projects/ into en/ and pt-br/ subdirectories.
- Extract all hardcoded user-facing strings in the pages to src/i18n/ui.ts.
- The final URLs generated by the build must remain /garden and /pt-br/garden.

### Story 6.2: Graph Embed and UX Polish

As a site visitor,
I want the knowledge graph embedded directly into note layouts and properly inverted hover states,
So that I can seamlessly explore interconnected notes without losing context or accessibility contrast.

**Acceptance Criteria:**
- Extract the D3 graph visualization logic into a reusable <KnowledgeGraph /> Astro component.
- Embed <KnowledgeGraph /> into the .graph-placeholder container within src/pages/[...lang]/garden/[slug].astro.
- Modify the client-side D3 script to filter the global graph-data.json for local note context.
- Update src/styles/tokens.css to precisely mirror the CSS hover states for High-Contrast themes.

## Epic 7: Remote Content Loader for Obsidian Vault

Decouple the content from the core dev-garden repository by fetching it remotely at build time.

### Story 7.1: Astro Remote Content Loader

As a site builder,
I want an Astro Content Loader that fetches markdown from a remote GitHub repository,
So that my Obsidian vault content is decoupled from the main codebase.

**Acceptance Criteria:**
- Create githubGardenLoader in src/content/config.ts.
- Use GH_PAT for authentication to fetch recursively from the remote repository's en/ and pt-br/ folders.
- Gracefully handle empty repositories without crashing the build.

### Story 7.2: Knowledge Graph Integration

As a site visitor,
I want the Knowledge Graph to continue working with remotely loaded content,
So that I can visualize note relationships seamlessly.

**Acceptance Criteria:**
- Create an Astro API Endpoint (src/pages/graph-data.json.ts) to serve graph JSON directly from the collection.
- Extract Obsidian wikilinks ([[Note Name]]) from the raw Markdown body (entry.body) to create graph edges.
- Do not write back to public/graph-data.json during the Astro build.

## Epic 8: Technical Debt and Polish

Clean up the codebase for a warning-free build.

### Story 8.1: Technical Debt and Polish

As a developer,
I want to remove all unused imports and variables in Astro components,
So that I achieve a 100% warning-free build output.

**Acceptance Criteria:**
- Remove unused variables from CommandPalette.astro, GardenCard.astro, Header.astro, etc.
- Run 
pm run build and ensure the TypeScript checker reports 0 warnings and 0 errors.
  
## Epic 9: UX Polish and QA Automation  
  
Following the completion of the core engine and initial UX alignment, this epic resolves the 13 residual edge cases and quality gaps remaining in the backlog to fully align with the canonical Figma handoff. 
  
### Story 9.1: UX Curator Notes and Garden Badges  
  
As a site visitor,  
I want to see Curator Notes directly on project cards and view well-designed Garden Badges,  
So that I get immediate context about projects and note maturity without clicking through.  
  
**Acceptance Criteria:**  
- Implement Curator Notes on ProjectCard (Architecture, Trade-offs, Lessons).  
- Fix Garden Badge CSS per Figma handoff in GardenCard. 
  
### Story 9.2: CSS Token Alignment and HC Themes  
  
As a user requiring accessible themes,  
I want the High-Contrast text and focus colors to have maximum contrast,  
So that I can easily navigate the site regardless of my visual needs.  
  
**Acceptance Criteria:**  
- Fix --focus-color in tokens.css so it works in light mode.  
- Fix HC-Dark text contrast to #FFFF00 where required.  
- Ensure prefers-reduced-motion suppresses all animations globally.  
- Make PostCSS custom media breakpoints accessible across all CSS scopes. 
  
### Story 9.3: Component Architecture Optimization  
  
As a developer,  
I want the Constellation graph and Theme toggle to be optimized and bug-free,  
So that the site remains performant and does not flash incorrect themes on load.  
  
**Acceptance Criteria:**  
- Optimize memory allocations inside Constellation.astro.  
- Add data boundary validation for node selection.  
- Ensure Header.astro theme toggle synchronizes with __fallbackStorage perfectly on initial boot. 
  
### Story 9.4: QA Automation Suite  
  
As a developer,  
I want comprehensive Playwright E2E tests for remaining edge cases,  
So that we prevent future regressions in the UI.  
  
**Acceptance Criteria:**  
- Write Playwright tests for Command Palette async search feedback and backdrop dismissal.  
- Add DOM Assertions for visually hidden screen-reader badges.  
- Add automated coverage for GitHub API integration, localization paths, and Curator notes rendering. 
