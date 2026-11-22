---
title: "Escrevendo Notas"
status: "evergreen"
date: 2026-04-08
---

# Escrevendo Notas

Cada nota é um arquivo Markdown dentro de uma pasta de idioma (`en/` ou `pt-br/`). Subpastas, como esta `guias/`, aparecem como cards de pasta no jardim.

O frontmatter aceita três campos:

- `title`: aparece nos cards e nas prévias; o padrão é o nome do arquivo
- `status`: `sprout`, `growing` ou `evergreen`; o padrão é `sprout`
- `draft`: defina como `true` para deixar a nota fora do build

Ligue notas com wikilinks, pelo nome ou com um rótulo próprio, como este link de volta para [[Jardim Digital|a página inicial do jardim]]. Um link para uma nota que não existe aparece como um esboço, assim fica fácil ver o que escrever a seguir.
