# Controle de Ordens de Serviço

App para controlar ordens de serviço (Beto Sistemas de Segurança), substituindo o processo de papel + planilha.

> **Convenção de idioma**: código-fonte e banco de dados em **inglês**; documentação de domínio e UI em português. Ver `specs/`.

## Documentação (SDD)

- [`specs/01-especificacao.md`](specs/01-especificacao.md) — especificação funcional
- [`specs/02-plano-tecnico.md`](specs/02-plano-tecnico.md) — plano técnico e viabilidade
- [`specs/03-modelo-dados.md`](specs/03-modelo-dados.md) — modelo de dados
- [`specs/04-tarefas-fase-0.md`](specs/04-tarefas-fase-0.md) — tarefas da Fase 0

## Stack

React + Vite + TypeScript (PWA) · Tailwind + shadcn/ui · Supabase (Postgres + Auth) · pdfmake

## Requisitos de ambiente

- Node LTS (ver `.nvmrc` → 24)
- pnpm (via `corepack enable pnpm`)

## Setup

```bash
corepack enable pnpm
pnpm install
pnpm dev        # servidor de desenvolvimento
```

Outros scripts:

```bash
pnpm build         # type-check + build de produção (gera PWA)
pnpm preview       # serve o build de produção
pnpm lint          # oxlint
pnpm format        # prettier --write
pnpm test:e2e      # testes end-to-end (Playwright) — ver seção abaixo
```

## Supabase

O app fala com a API do Supabase (Auth + PostgREST + RLS). Há dois modos de
rodar o backend — **o código e as migrations são idênticos nos dois**, então
dá para começar local e migrar para a nuvem só trocando o `.env`.

### Opção A — Self-hosted local (Docker, sem nuvem)

Requer Docker. Sobe a stack Supabase completa (Postgres, Auth, PostgREST,
Studio) e aplica as migrations automaticamente:

```bash
pnpm dlx supabase start      # sobe a stack e aplica as migrations
pnpm dlx supabase status     # mostra API URL, anon key e Studio URL
```

Preencha o `.env` com os valores locais (ver `.env.example`):

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key do `supabase status`>
```

Crie o usuário operador pelo Studio (`http://127.0.0.1:54323` →
Authentication → Add user) ou pela admin API. Pare a stack com
`pnpm dlx supabase stop`. Os dados persistem em volumes Docker.

> Para um servidor permanente/endurecido (ex.: um LXC no Proxmox), use a
> **Opção C** abaixo.

### Opção B — Nuvem (produção gerenciada)

1. Crie um projeto em [supabase.com](https://supabase.com) (free tier).
2. Em **Project Settings > API**, copie a **Project URL** e a chave **anon / publishable**.
3. Preencha o `.env`:

   ```bash
   cp .env.example .env
   # VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY do projeto
   ```

4. Crie o usuário operador no dashboard (Authentication → Add user).

**Migrar do local para a nuvem**: troque as duas variáveis do `.env`, faça
`supabase link` + `db push` (abaixo) e crie o usuário no dashboard. Nada de
código muda.

### Opção C — Produção self-hosted (servidor próprio, ex. LXC no Proxmox)

Stack completa em Docker Compose (Postgres, Auth, PostgREST, gateway, Studio
e o build do frontend) pronta pra rodar num servidor seu, fora da nuvem.
Veja [`docker/README.md`](docker/README.md) — inclui notas de configuração
do LXC, geração de chaves, criação do usuário operador e operação do dia a
dia (backup, atualização, logs). Mesmas migrations de `supabase/migrations/`,
aplicadas automaticamente na subida.

O cliente tipado fica em `src/lib/supabase.ts`; a app fala com ele apenas
pela camada de repositório (T-09). Sem as chaves, funcionalidades que usam
o Supabase lançam um erro claro pedindo para preencher o `.env`.

## Testes E2E (Playwright)

Cobrem os 7 critérios de aceite do MVP (`specs/01-especificacao.md` §10),
rodando contra um Supabase local de verdade (sem mocks) e o usuário
operador único já existente (Setup, Opção A ou C acima).

```bash
pnpm exec playwright install --with-deps chromium   # uma vez só
E2E_EMAIL=seu@email.com E2E_PASSWORD=sua-senha pnpm test:e2e
```

Pré-requisitos: Supabase local rodando e `pnpm dev` (o `webServer` do
Playwright sobe sozinho se não estiver rodando, ou reusa se já estiver).
Sem reset de banco entre execuções — cada teste usa nomes/campos com uma
tag única pra não colidir com dados acumulados.

## Banco (migrations e tipos)

Schema versionado em `supabase/migrations/`. Depois de criar o projeto e
vincular (`pnpm dlx supabase link --project-ref <ref>`):

```bash
pnpm dlx supabase db push   # aplica as migrations no projeto
# regenerar os tipos após mudanças de schema:
pnpm dlx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
```
