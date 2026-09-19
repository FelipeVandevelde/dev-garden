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
 
- source_spec: _bmad-output/implementation-artifacts/spec-2-css-token-alignment-hc-themes.md
  summary: Refactor inline styles in GardenCard.astro into CSS classes, using design tokens and logical properties.
  evidence: Review flagged hardcoded 16px magic numbers, mixing px and rem, and inline styles.

- source_spec: _bmad-output/implementation-artifacts/spec-2-css-token-alignment-hc-themes.md
  summary: Use a dedicated data attribute (e.g. data-high-contrast=true) instead of prefix matching [data-theme^=HC-].
  evidence: Review flagged the prefix matching as risky and brittle.

- source_spec: _bmad-output/implementation-artifacts/spec-3-component-architecture-optimization.md
  summary: Semantic HTML is missing in Header.astro; theme toggles use spans instead of native buttons.
  evidence: Review found theme toggles use <span role="button" tabindex="0"> instead of <button>, requiring manual JS keyboard event handling.

- source_spec: _bmad-output/implementation-artifacts/spec-3-component-architecture-optimization.md
  summary: window.__fallbackStorage is redundantly initialized in both ThemeInit.astro and Header.astro.
  evidence: Duplicated global state initialization creates unnecessary redundancy.

- source_spec: _bmad-output/implementation-artifacts/spec-3-component-architecture-optimization.md
  summary: Returning 
ull within the links.map loop in Constellation.astro renders empty placeholder nodes.
  evidence: SVG DOM is cluttered with empty elements; a .filter() should be used before mapping.

- source_spec: _bmad-output/implementation-artifacts/spec-3-component-architecture-optimization.md
  summary: The hardcoded language check in KnowledgeGraph.astro is tightly coupled.
  evidence: document.documentElement.lang === 'pt-br' ? '/pt-br' : '' is used instead of a centralized localized routing utility.

- source_spec: _bmad-output/implementation-artifacts/spec-3-component-architecture-optimization.md
  summary: Inline transition styles applied to SVG links in Constellation.astro.
  evidence: Missing class-based CSS extraction decreases maintainability.

- source_spec: _bmad-output/implementation-artifacts/spec-3-component-architecture-optimization.md
  summary: Constellation node click filtering is unverified by tests.
  evidence: e2e/constellation.spec.ts does not assert the visibility of .filterable-item elements.

- source_spec: _bmad-output/implementation-artifacts/spec-3-component-architecture-optimization.md
  summary: Theme toggle icon switching is unverified by tests.
  evidence: No e2e test clicks the theme buttons and asserts that the html data attribute changes and the correct icon becomes visible.

- source_spec: _bmad-output/implementation-artifacts/spec-3-component-architecture-optimization.md
  summary: Inline script fallback storage initialization is unverified.
  evidence: No test runs the application in a blocked-storage context to ensure inline scripts don't throw fatal exceptions.

- source_spec: _bmad-output/implementation-artifacts/spec-4-qa-automation-suite.md
  summary: Subsequent Garden badges lack aria-hidden span test assertions.
  evidence: e2e test only evaluates the first badge, potentially missing regressions in remaining badges.

- source_spec: _bmad-output/implementation-artifacts/spec-4-qa-automation-suite.md
  summary: Empty state rendering for Curator Notes is unchecked.
  evidence: e2e test checks the first element but could silently pass if the list is technically visible but empty.

- source_spec: _bmad-output/implementation-artifacts/spec-4-qa-automation-suite.md
  summary: Hardcoded setTimeout in pagefind intercept.
  evidence: Using 500ms timeout in Command Palette e2e test introduces unnecessary test execution delays instead of conditionally resolving.

- source_spec: _bmad-output/implementation-artifacts/spec-4-qa-automation-suite.md
  summary: E2E test files use brittle DOM/CSS selectors instead of accessibility locators.
  evidence: Tests heavily rely on CSS classes (e.g., .badge) and permissive URL regex, which makes them less resilient to UI refactoring.
