---
name: 🤖 AI-Ready Task
about: A structured task template optimized for AI agents to pick up and execute.
title: "[TASK] "
labels: "🤖 AI Ready"
assignees: ''
---

### 🎯 Objective
(One sentence explaining what needs to be done. E.g., "Implement the dark mode toggle in the header.")

### 📋 Requirements / Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2

### 📁 Files to touch
(Give the AI a hint on where to look, e.g., `src/components/Header.astro` or `src/content/projects/en/`)

### 🚫 Non-Goals
(Crucial for AI: Tell it what NOT to do so it doesn't refactor unrelated things)
- Do not refactor the layout component.
- Do not add new NPM dependencies.

### 🧪 Definition of Done (How to verify)
(How can the AI or you test that this is complete?)
- [ ] `npm run build` succeeds without errors.
- [ ] Component renders correctly on mobile.
