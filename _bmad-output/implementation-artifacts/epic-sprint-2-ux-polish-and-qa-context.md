# Epic sprint-2-ux-polish-and-qa Context: UX Polish and QA Automation

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Following the completion of the core engine and initial UX alignment, this epic resolves the 13 residual edge cases and quality gaps remaining in the backlog to fully align with the canonical Figma handoff. This is the final polish step.

## Stories

- Story 1: UX Curator Notes and Garden Badges
- Story 2: CSS Token Alignment and HC Themes
- Story 3: Component Architecture Optimization
- Story 4: QA Automation Suite

## Requirements & Constraints

- **CAP-1**: Align Curator Notes and Garden Badges. Restore the missing Curator Notes (Architecture, Trade-offs, Lessons) to the `ProjectCard` list view. Fix Garden Badges (Sprout, Growing, Evergreen) to render with dashed/dotted CSS borders per the Figma handoff.
- **CAP-2**: CSS token alignment. Fix HC-Dark text contrast mapping, ensure `--focus-color` defaults correctly, apply `prefers-reduced-motion` strictly, and expose custom media queries globally.
- **CAP-3**: Component optimizations. Encapsulate `Constellation.astro` memory allocation. Synchronize `Header.astro` theme toggle with `__fallbackStorage` perfectly on initial boot.
- **CAP-4**: QA Automation. Write Playwright tests covering Command Palette interactions, screen-reader badges, API fetchers, and localization paths.
- All UX updates must strictly adhere to the provided Figma Design Handoff Blueprint for layout and CSS styles.
- QA tests must use the existing Playwright E2E framework.

## UX & Interaction Patterns

- **Curator Notes**: Must appear in the list view (ProjectCard) without requiring navigation. Trade-offs use a double-border inset shadow, Lessons use a repeating-linear-gradient dashed border.
- **Garden Badges**: Sprout uses a dotted border, Growing uses a dashed border, Evergreen uses a solid border.
- **HC Modes**: HC-Dark text contrast must map to `#FFFF00` where needed. `--focus-color` should not ruin Light mode text.
- **Animations**: `prefers-reduced-motion` must suppress ALL animations globally.
