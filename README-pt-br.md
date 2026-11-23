# DevGarden

> 🇺🇸 [Read in English](./README.md)

Um template de portfólio e jardim digital feito com Astro e Preact. Ele vem em inglês e português (`en`/`pt-br`) e inclui wikilinks e callouts no estilo do Obsidian, um grafo de conhecimento interativo, uma paleta de comandos e temas monocromáticos WCAG AAA.

**Demo:** [dev-garden.vercel.app](https://dev-garden.vercel.app). Ela mostra o perfil fictício "Jane Doe" e as notas de `sample-vault/`.

## Primeiros passos

1. Crie a sua cópia:
   - **Use this template** no GitHub cria um repositório limpo, com histórico novo. Nele não dá para trazer atualizações futuras do template com um merge normal.
   - **Clone ou fork** mantém o histórico, então você pode trazer atualizações depois (veja [Mantendo sua cópia atualizada](#mantendo-sua-cópia-atualizada)):
     ```bash
     git clone https://github.com/FelipeVandevelde/dev-garden.git meu-portfolio
     ```
2. Instale e rode:
   ```bash
   cd meu-portfolio
   npm install
   cp .env.example .env
   npm run dev
   ```
   O `.env` padrão lê as notas de `sample-vault/`, então o jardim não fica vazio na primeira execução.

## Deixe com a sua cara

Todos os dados pessoais ficam nestes arquivos, assim as mudanças de código do template entram na sua cópia sem mexer neles:

| Arquivo | O que mudar |
|---|---|
| `src/site.config.ts` | `author.name`, `author.githubUsername` (mostra seus commits públicos mais recentes na página inicial), `brand` (rótulo do cabeçalho), `siteUrl` (também o `site` do Astro), `social`, `githubRepositories` |
| `src/content/profile/en.json`, `pt-br.json` | Nome, cargo, bio, princípios e as `metrics` da página inicial |
| `src/content/projects/en/`, `pt-br/` | Estudos de caso de projetos, um arquivo JSON por projeto |
| `src/data/skills.ts` | Nós e ligações da constelação de habilidades |
| `src/data/github-mock.json` | Commits de exemplo, mostrados enquanto `githubUsername` não está definido ou o GitHub está fora do ar |
| `sample-vault/` | Notas de exemplo; aponte `VAULT_REPO` ou `LOCAL_VAULT_PATH` para o seu próprio vault |

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento, com recarga das notas do vault local |
| `npm run build` | Checa os tipos (`astro check`), gera `dist/`, indexa a busca com o Pagefind e grava `dist/vault-sync.json` |
| `npm run preview` | Serve `dist/` localmente |
| `npx vitest run` | Testes unitários |
| `npx playwright test` | Testes end-to-end sobre `dist/`. Gere o build com o vault de exemplo antes: `LOCAL_VAULT_PATH=sample-vault USE_REMOTE_VAULT=false npm run build` |

## Variáveis de ambiente

| Variável | Para que serve |
|---|---|
| `GH_PAT` | Token do GitHub para um vault remoto e a página de repositórios. Repositórios públicos não precisam de escopos; um vault privado precisa de `Contents` somente leitura (fine-grained) ou `repo` (classic). |
| `VAULT_REPO` | `owner/repo` do repositório no GitHub com o seu vault do Obsidian |
| `LOCAL_VAULT_PATH` | Pasta local do vault, usada no lugar de `VAULT_REPO` quando existe (padrão: `../vault-obsidian`) |
| `USE_REMOTE_VAULT` | `true` força o uso de `VAULT_REPO` mesmo quando a pasta local existe |
| `VAULT_SYNC_INTERVAL_MS` | Frequência com que `npm run dev` e `npm start` procuram commits novos no vault remoto (padrão `60000`) |
| `DEPLOY_HOOK_URL` | Deploy hook opcional que `npm start` e `npm run sync:vault` chamam quando o vault muda |

Sem vault local e sem `VAULT_REPO`, o build funciona do mesmo jeito; o jardim só fica vazio.

## Escrevendo notas

O vault é organizado por idioma na raiz. Subpastas viram cards de pasta no jardim:

```text
/
├── en/
│   ├── digital-gardening.md
│   └── guides/
│       └── writing-notes.md
└── pt-br/
    ├── jardim-digital.md
    └── guias/
        └── escrevendo-notas.md
```

**Frontmatter:**

- `title` (texto): aparece nos cards e nas prévias; o padrão é o nome do arquivo
- `status` (texto): `sprout`, `growing` ou `evergreen`; qualquer outro valor conta como `sprout`
- `draft` (booleano): `true` deixa a nota fora do build
- `date`, `updated` (datas, opcionais)

```yaml
---
title: "Jardim Digital"
status: "evergreen"
date: 2026-01-12
---
```

**Wikilinks:** `[[Nome da Nota]]`, `[[pasta/nome-da-nota]]` ou `[[Nome da Nota|rótulo próprio]]`. Os links casam com o nome do arquivo, sem diferenciar maiúsculas nem acentos, então `[[Sites Estáticos]]` encontra `sites-estaticos.md`. Um link para uma nota que não existe aparece como um esboço. O grafo de conhecimento é montado a partir desses links durante o build (`src/utils/graph.ts`).

**Callouts:** sintaxe do Obsidian, como `> [!note]`, `> [!tip] Título` ou `> [!warning]`.

## Deploy na Vercel

O site é totalmente estático, então não precisa de adapter do Astro.

1. Importe o repositório em [vercel.com/new](https://vercel.com/new). A Vercel detecta o Astro, e o `vercel.json` define o comando de build e a pasta de saída.
2. Adicione as variáveis de ambiente: `GH_PAT`, `VAULT_REPO` e `USE_REMOTE_VAULT=true`. Para uma demo com as notas de exemplo, use `LOCAL_VAULT_PATH=sample-vault` no lugar.
3. Coloque a URL da Vercel em `siteUrl`, no `src/site.config.ts`.
4. Para reconstruir o site quando você enviar notas, crie um Deploy Hook (Project → Settings → Git → Deploy Hooks). Salve-o como o secret `VERCEL_DEPLOY_HOOK_URL` no repositório do vault e adicione este workflow lá, em `.github/workflows/trigger-vercel-deploy.yml`:

   ```yaml
   name: Trigger portfolio rebuild

   on:
     push:
       branches: [main]
       paths:
         - '**.md'
     workflow_dispatch:

   jobs:
     deploy-hook:
       runs-on: ubuntu-latest
       timeout-minutes: 2
       steps:
         - name: Call Vercel Deploy Hook
           env:
             HOOK_URL: ${{ secrets.VERCEL_DEPLOY_HOOK_URL }}
           run: |
             if [ -z "$HOOK_URL" ]; then
               echo "VERCEL_DEPLOY_HOOK_URL secret is not set; skipping."
               exit 0
             fi
             curl -fsS -X POST "$HOOK_URL"
   ```

   O hook por push é usado porque o plano gratuito da Vercel roda cron jobs no máximo uma vez por dia.

### Hospedagem própria

`npm start` gera o build se precisar, serve o site com `astro preview` e consulta `VAULT_REPO` a cada `VAULT_SYNC_INTERVAL_MS`. Quando o vault tem um commit novo, ele reconstrói o site e chama `DEPLOY_HOOK_URL`, se definido. `npm run sync:vault` faz essa checagem uma vez.

## Mantendo sua cópia atualizada

Se você clonou ou fez fork do template, adicione-o como remote:

```bash
git remote add upstream https://github.com/FelipeVandevelde/dev-garden.git
git fetch upstream
```

No primeiro merge, mantenha os seus arquivos pessoais para que os dados de exemplo do template não os substituam:

```bash
git merge --no-commit upstream/main
git checkout HEAD -- src/content/profile src/site.config.ts README.md README-pt-br.md
git commit
```

Depois disso, `git merge upstream/main` traz só as mudanças novas do template.

## Estrutura do projeto

```text
src/
├── content/      # perfil e projetos (JSON) + loaders das coleções (config.ts)
├── pages/        # rotas dos dois idiomas
├── components/   # componentes Astro e Preact
├── plugins/      # plugins remark: wikilinks, callouts
├── data/         # constelação de habilidades, commits de exemplo
└── site.config.ts
sample-vault/     # notas fictícias usadas pela demo e pelos testes e2e
scripts/          # vault-sync-server.mjs (hospedagem própria e carimbo do build)
tests/, e2e/      # testes unitários (Vitest) e end-to-end (Playwright)
```

## Licença

[MIT](./LICENSE)
