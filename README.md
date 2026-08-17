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

> Em construção — passos completos serão adicionados conforme a Fase 0 avança (scaffolding, env do Supabase, migrations).

```bash
corepack enable pnpm
pnpm install
```
