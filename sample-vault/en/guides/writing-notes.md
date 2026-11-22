---
title: "Writing Notes"
status: "evergreen"
date: 2026-04-08
---

# Writing Notes

Each note is a Markdown file inside a language folder (`en/` or `pt-br/`). Subfolders, like this `guides/` folder, show up as folder cards in the garden.

The frontmatter supports three fields:

- `title`: shown on cards and in previews; defaults to the file name
- `status`: `sprout`, `growing` or `evergreen`; defaults to `sprout`
- `draft`: set to `true` to keep a note out of the build

Link notes with wikilinks, either by name or with a custom label, like this link back to [[Digital Gardening|the garden's front page]]. A link to a note that doesn't exist renders as a stub, so it's easy to spot what to write next.
