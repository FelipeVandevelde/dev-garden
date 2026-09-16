---
title: 'Story 9.1: UX Curator Notes and Garden Badges'
type: 'feature'
created: '2026-09-15'
status: 'done'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Dev-Garden portfolio implementation has drifted from the brutalist Figma mockups. `ProjectCard` is missing Curator Notes (architecture, trade-offs, lessons), and `GardenCard` displays raw text brackets instead of the correct css pill badges and brutalist geometric symbols.

**Approach:** Inject the Curator Notes conditionally on the `ProjectCard.astro` component using scoped styles to achieve the double-borders and dashed repeating gradients per the Figma design. Update `GardenCard.astro` to use the `.badge` CSS classes from `tokens.css` with the Brutalist unicode symbols (◌, ◐, ●).

## Boundaries & Constraints

**Always:** Strictly map the CSS constraints to the `Figma Design Handoff Blueprint` (Tradeoffs use a double border via inset box shadow; Lessons use a repeating linear gradient dashed border).
**Ask First:** If the Zod schema requires any modification to parse the CuratorNotes fields.
**Never:** Refactor `tokens.css` logic (leave it for Story 2 CSS Token Alignment). Apply scoped `<style>` for the Curator Notes directly in `ProjectCard.astro`.

</frozen-after-approval>

## Code Map

- `src/components/ProjectCard.astro` -- Add conditional rendering block for `project.curatorNotes`, mapping the 3 types (architecture, tradeOffs, lessonsLearned) with specific inline/scoped styles.
- `src/components/GardenCard.astro` -- Replace `[{status.toUpperCase()}] <span aria-hidden="true">{icon}</span>` with brutalist badges: `<span class="badge badge-{safeStatus}">...</span>`.
- `src/content/config.ts` -- Check to ensure `curatorNotes` fields match our usage (already verified: context, architecture, tradeOffs, lessonsLearned).

## Tasks & Acceptance

**Execution:**
- [x] `src/components/ProjectCard.astro` -- Add the HTML and scoped CSS to render `project.curatorNotes` (architecture, tradeOffs, lessonsLearned) directly inside the card -- To align with the CuratorCallout Figma components.
- [x] `src/components/GardenCard.astro` -- Refactor the `curator-tag` div to output the Brutalist `GardenBadge` HTML structure instead of raw text brackets -- To align with Figma.

**Acceptance Criteria:**
- Given a project with curator notes, when rendered on the project list page, then Architecture, Trade-offs, and Lessons learned appear with their respective brutalist borders and glyphs.
- Given a garden note, when rendered in a card, then its status badge appears as a bordered pill (dotted, dashed, or solid) with the appropriate brutalist symbol (◌, ◐, ●).

## Design Notes

```css
/* Figma TradeOff Double-Border (inset shadow handles inner border) */
border-left: 3px solid var(--border-focus);
box-shadow: inset 5px 0 0 -3px var(--bg-color), inset 7px 0 0 -3px var(--border-focus);

/* Figma Lessons Dashed Border */
border-left: none;
background-image: repeating-linear-gradient(to bottom, var(--border-focus) 0px, var(--border-focus) 5px, transparent 5px, transparent 9px);
background-size: 3px 100%;
background-repeat: no-repeat;
background-position: left center;
padding-left: 19px;
```

Brutalist symbols to use for GardenCard:
- sprout: `◌`
- growing: `◐`
- evergreen: `●`

## Verification

**Commands:**
- `npm run build` -- expected: successfully builds without Astro validation errors.
  
## Suggested Review Order  
  
**UI Components**  
  
- Curator notes UI layout, conditional rendering, and glyphs  
  [ProjectCard.astro:24](../../src/components/ProjectCard.astro#L24)  
  
- Scoped CSS with Figma formula borders and gradients  
  [ProjectCard.astro:49](../../src/components/ProjectCard.astro#L49)  
  
- Brutalist unicode status badges for garden elements  
  [GardenCard.astro:8](../../src/components/GardenCard.astro#L8)  
  
**Configuration**  
  
- Exclude artifacts folder to fix astro check build  
  [tsconfig.json:33](../../tsconfig.json#L33) 
