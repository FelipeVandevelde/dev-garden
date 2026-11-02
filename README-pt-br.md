# DevGarden

> 🇺🇸 [Read in English](./README.md)

Um projeto de portfólio e jardim digital (Digital Garden) desenvolvido com Astro e Preact. Suporta os idiomas Inglês e Português (`en`/`pt-br`), com plugins Markdown customizados (wikilinks, callouts).

## Usando como Template de Portfólio

Se você deseja utilizar o **DevGarden** como base limpa para o seu próprio portfólio e jardim digital, utilize a branch **`template`**. Ela mantém a estrutura inicial limpa, pronta para você inserir as suas próprias informações.

1. **Clone diretamente a branch `template`:**
   ```bash
   git clone -b template https://github.com/FelipeVandevelde/dev-garden.git meu-portfolio
   cd meu-portfolio
   npm install
   ```
   *(Ou alterne para a branch em um repositório já clonado usando `git checkout template`)*

2. **Personalize com suas informações:**
   - **`src/site.config.ts`**: Atualize os dados de `author`, `siteUrl`, links em `social`, navegação e `githubRepositories`.
   - **`astro.config.mjs`**: Atualize a URL em `site` para o seu domínio de produção.
   - **`src/content/profile/en.json` & `src/content/profile/pt-br.json`**: Insira seu nome, cargo/título, bio e princípios de engenharia.
   - **`src/content/projects/en/` & `src/content/projects/pt-br/`**: Substitua os arquivos JSON de exemplo pelos seus próprios projetos e notas de curadoria (`curatorNotes`).
   - **`src/data/skills.ts`**: Personalize os nós e conexões da constelação interativa de habilidades.
   - **`src/content/config.ts`**: Aponte o `githubGardenLoader` (`repo`) para o seu próprio repositório do Obsidian no GitHub (ou configure `LOCAL_VAULT_PATH` no `.env`).

## Configuração de Desenvolvimento Local

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as Variáveis de Ambiente:**
   Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
   Abra o arquivo `.env` e configure o seu `GH_PAT`.

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

## Configurando o Vault do Obsidian (Conteúdo Remoto)

Este projeto utiliza um loader customizado do Astro (`githubGardenLoader`) para buscar as notas do seu jardim digital diretamente de um repositório remoto no GitHub contendo o seu vault do Obsidian (ou localmente via `LOCAL_VAULT_PATH`).

### 1. GitHub Personal Access Token (GH_PAT)

Para evitar limites de requisição (rate limits) da API do GitHub e acessar repositórios privados, você deve fornecer um Personal Access Token do GitHub.

1. Acesse as configurações da sua conta no GitHub: Settings > Developer settings > Personal access tokens > Tokens (classic) ou Fine-grained tokens.
2. **Para repositórios públicos:** Um token sem escopos especiais é suficiente (apenas para aumentar o limite de requisições).
3. **Para repositórios privados:** Gere um token com o escopo `repo` (Classic) ou acesso de leitura em `Contents` (Fine-grained).
4. Adicione o token ao seu arquivo `.env` local:
   ```env
   GH_PAT=github_pat_1234567890
   ```

### 2. Estrutura do Vault e Localização

O loader espera que o seu vault do Obsidian esteja organizado por idioma na raiz do diretório. Os idiomas suportados são `en` (Inglês) e `pt-br` (Português).

Exemplo de estrutura do Vault:
```text
/
├── en/
│   ├── my-first-note.md
│   └── web-development/
│       └── css-tricks.md
├── pt-br/
│   ├── minha-primeira-nota.md
│   └── web-development/
│       └── dicas-de-css.md
```

### 3. Formatação das Notas (Frontmatter)

As notas devem conter um frontmatter YAML válido. O loader utiliza esses metadados para construir o grafo de conhecimento e renderizar as páginas.

**Propriedades suportadas no Frontmatter:**
- `title` (string): O título da nota. Se omitido, o nome do arquivo será usado.
- `status` (string): O estágio de maturidade da nota. Aceita `sprout`, `seedling`/`growing` ou `evergreen`. O padrão é `sprout`.
- `draft` (boolean): Defina como `true` para excluir a nota das builds de produção. O padrão é `false`.

**Exemplo:**
```yaml
---
title: "Minha Primeira Nota"
status: "seedling"
draft: false
---

# Olá Mundo

Esta é uma nota do jardim digital. Posso criar links para outras notas usando wikilinks como [[Dicas de CSS]].
```

### 4. Wikilinks e Conexões

Você pode usar wikilinks padrão do Obsidian (`[[Nome da Nota]]` ou `[[Pasta/Nome da Nota]]`) para conectar notas entre si.
Durante a etapa de build, as conexões são mapeadas para construir o Grafo de Conhecimento 2D interativo.
