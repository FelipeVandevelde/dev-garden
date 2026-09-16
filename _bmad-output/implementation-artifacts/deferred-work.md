# Deferred Technical Debt & Bugs

## UI & Navigation (Header, Palette, Shortcuts)

- [ ] Missing tests for GitHub API, themes, search, localization, popover, curator notes, callout roles.
- [ ] The Curator Notes section in projects/[slug].astro lacks conditional rendering around the h2 header.
- [ ] The JS theme logic in Header.astro defaults to Dark if no attribute is found, contradicting tokens.css.
- [ ] The __fallbackStorage object used for the theme toggle lacks initialization logic on page load.
- [ ] The tokens.css file changes --focus-color to #000000 (identical to light theme text).

## Graph & Visualization (KnowledgeGraph, Constellation)


## Content & Markdown (Remark, Plugins, Note Layout)


## Build, SEO & Architecture

- [ ] Missing automated tests across all UI components and API fetchers

## Testing & Tooling
- [ ] content/config.ts: Missing content collection Zod schema tests risks late build failures
- [ ] remark-wikilinks.js: Missing AST transformation tests risks exposing private slugs to public registry
- [ ] site.config.ts: Missing Zod schema tests risks invalid configs breaking i18n routing silently

- [ ] The tokens.css file reduces HC-Dark text color contrast from #FFFF00 to #FFFFFF.
- [ ] prefers-reduced-motion applies transition: none !important

## UX/UI Alignment Discrepancies (Mockup vs Implementation)
- [ ] **Make custom media queries globally available across all CSS files.** (Source: spec-dg-16-responsive-zindex.md) - *Evidence: The @custom-media queries are defined locally in 	okens.css, meaning they won't automatically be available in other CSS files or Astro component styles unless postcss-custom-media is configured with an importFrom option.*

- [ ] **Add E2E tests for mobile viewport layouts and custom media transpilation.** (Source: spec-dg-16-responsive-zindex.md) - *Evidence: No E2E or CSS build tests exist to ensure the final built CSS correctly transpiles @media (--breakpoint-md) and that the mobile layout applies.*

- [ ] **Add visual regression tests for z-index layering of graph canvas and popovers.** (Source: spec-dg-16-responsive-zindex.md) - *Evidence: No tests cover the correct stacking context or visibility of UI elements relying on the new --z-base and --z-popover variables.*
- [ ] **Add E2E tests covering sequential Constellation node clicks and visual state resets** (Source: spec-dg-17-fix-constellation-node-multi-select-collisions.md) - *Evidence: Missing verification for graph reset on sequential node clicks, which could lead to undetected visual regressions.*
- [ ] **Optimize Constellation.astro script memory allocation and state encapsulation** (Source: spec-dg-17-fix-constellation-node-multi-select-collisions.md) - *Evidence: Review noted connectedNodeIds = new Set() allocation on every click instead of .clear(), and module-level ctiveNode leakage if multiple instances render.*
- [ ] **Add data validation to Constellation node clicks** (Source: spec-dg-17-fix-constellation-node-multi-select-collisions.md) - *Evidence: The code does not validate whether the provided id actually exists in the imported 
odes data structure before assigning it.*
- [ ] **Add E2E tests for the filter empty state** (Source: spec-dg-18-garden-popover-empty-state-fixes.md) - *Evidence: A regression gap where the empty state visibility toggling could be broken without failing any tests.*
- [ ] **Add E2E tests for the popover hide animation cancellation** (Source: spec-dg-18-garden-popover-empty-state-fixes.md) - *Evidence: Rapid re-hovering behavior lacks test coverage, leaving the debounce timer fix unverified.*
- [ ] **Add DOM assertions for the visually hidden screen-reader badges** (Source: spec-dg-18-garden-popover-empty-state-fixes.md) - *Evidence: Missing verification that the .sr-only element exists and is populated with the correct status text.*
- [ ] **Add UI component tests for CommandPalette backdrop dismissal** (Source: spec-dg-19-implement-command-palette-fallback-states.md) - *Evidence: Click boundaries are not covered by automated tests.*
- [ ] **Add UI component tests for CommandPalette async search feedback** (Source: spec-dg-19-implement-command-palette-fallback-states.md) - *Evidence: Missing verification that the loading indicator is displayed while search results are pending.*- source_spec: _bmad-output/implementation-artifacts/spec-1-css-framework-theme-foundation.md
  summary: Convert theme and high-contrast toggle spans to native button elements to support keyboard activation.
  evidence: Review flagged that spanning with role="button" breaks Enter/Space key activation without custom event listeners, and they lack aria-pressed attributes.
- source_spec: _bmad-output/implementation-artifacts/spec-1-css-framework-theme-foundation.md
  summary: Refactor noscript style block to use a CSS class instead of inline styles to satisfy strict CSP configurations.
  evidence: Review flagged that the inline <style> block within the <noscript> element may violate strict Content Security Policy disallowing unsafe-inline.
- source_spec: _bmad-output/implementation-artifacts/spec-1-ux-curator-notes-and-garden-badges.md  
  summary: GardenCard and ProjectCard contain extensive inline styles that should be moved to a scoped <style> block.  
  evidence: Identified by review loop; GardenCards curator-tag uses large inline style attributes.  
  
- source_spec: _bmad-output/implementation-artifacts/spec-1-ux-curator-notes-and-garden-badges.md  
  summary: Add QA Automation tests asserting the DOM structure of Garden Badges and Curator Notes.  
  evidence: Identified by review loop; no E2E tests currently verify that these specific CSS classes and glyphs render correctly.  
 
