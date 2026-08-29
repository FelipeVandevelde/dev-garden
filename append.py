import os

review_order = '''
## Suggested Review Order

**Graph Extraction & Local Embedding**

- Encapsulates D3 logic and provides local filtering
  [KnowledgeGraph.astro:1](../../src/components/KnowledgeGraph.astro#L1)
- Injects the extracted graph component into the note layout
  [[slug].astro:34](../../src/pages/[...lang]/garden/[slug].astro#L34)
- Simplifies global graph page to just wrap the component
  [graph.astro:13](../../src/pages/[...lang]/graph.astro#L13)

**Navigation & UX Polish**

- Enforces strict High-Contrast color inversions on hover
  [	okens.css:218](../../src/styles/tokens.css#L218)
- Restores the HOME link to the navigation array
  [Header.astro:15](../../src/components/Header.astro#L15)
'''

spec_file = '_bmad-output/implementation-artifacts/spec-6-2-graph-embed-and-ux-polish.md'
with open(spec_file, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("status: 'in-review'", "status: 'done'")
c += review_order

with open(spec_file, 'w', encoding='utf-8') as f:
    f.write(c)
