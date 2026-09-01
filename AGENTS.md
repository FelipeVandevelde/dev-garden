<!-- bmad:context -->
<!-- Verified 2026-08-31 against f12ab69. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## DevGarden

A portfolio and content project using Astro and Preact. Supports English and Portuguese (`en`/`pt-br`) locales, with custom Markdown plugins (wikilinks, callouts).

## Policy

- Ask the user for permission before editing any file that is currently running or being served.
- Defer all final testing and project flow control to the user; never assume a task is verified until the user confirms it.
- Always invoke the `search_astro_docs` MCP skill before making changes to Astro configurations, layouts, or core pages.

## Where things are

- Content collections: `src/content/` (projects, garden, profile).
- UI Components: `src/components/`.
- Routing and pages: `src/pages/`.

## Running and verifying

- `npm run dev` starts the dev server and generates the graph data.
- `npm run build` runs Astro checks, builds the site, and generates the Pagefind search index.

<!-- /bmad:context -->

## Task Execution & Tracking (Custom Rules)

- **Project Board:** All project tasks and technical debt are tracked in GitHub Project 3.
- **Task Promotion:** When tackling a sub-task from an Epic, promote it to a standalone GitHub Issue using the `.github/ISSUE_TEMPLATE/task.md` template.
- **Spec Documents (BMad Way):** Before starting development on any complex feature or refactor (e.g., UI components with multiple bugs), first create a technical specification document in `_bmad/specs/`. This document must outline the problem, files touched, and the architectural approach. Link this spec in the GitHub Issue.