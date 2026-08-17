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
```

Ícones do PWA são placeholders gerados por `node scripts/gen-placeholder-icons.mjs` — substituir por ícones reais depois.

## Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (free tier).
2. Em **Project Settings > API**, copie a **Project URL** e a chave **anon / publishable**.
3. Configure o `.env` (nunca versionado):

   ```bash
   cp .env.example .env
   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
   ```

O cliente tipado fica em `src/lib/supabase.ts`; a app fala com ele apenas
pela camada de repositório (T-09). Sem as chaves, funcionalidades que usam
o Supabase lançam um erro claro pedindo para preencher o `.env`.

> Migrations e tipos gerados do banco entram na T-05.
