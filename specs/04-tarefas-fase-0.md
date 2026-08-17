# Tarefas — Fase 0: Fundação

> Objetivo da fase: base técnica de pé — projeto, banco com schema + auditoria, login e camada de repositório — pronta para a Fase 1 (Núcleo OS). Nada de regras de negócio de OS aqui além do necessário para provar a fundação.
>
> Convenção: código e banco em **inglês** (RNF-07). Cada tarefa tem critério de aceite verificável. Ordem reflete dependências.

## T-00 — Ferramental e repositório ✅
- [x] Inicializar repositório git.
- [x] Configurar `.gitignore` (node_modules, `.env`, build).
- [x] Definir gerenciador de pacotes (pnpm 11.22.0 via corepack) e Node LTS (`.nvmrc` → 24).
- **Aceite**: ✅ `git status` limpo com estrutura inicial; segredos fora do versionamento.

## T-01 — Scaffolding do frontend (Vite + React + TS + PWA) ✅
- [x] Criar app Vite com template `react-ts` (React 19, Vite 8, TS 6).
- [x] Adicionar `vite-plugin-pwa` (manifesto + service worker; sem offline de dados ainda).
- [x] Configurar path alias (`@/`), lint (oxlint, já no template) + Prettier.
- **Aceite**: ✅ dev responde 200 (`main.tsx`); `pnpm build` passa e gera SW+manifest; ícones PNG 192/512 e manifesto válido (instalável).
- **Depende de**: T-00.

## T-02 — UI base (Tailwind + shadcn/ui) ✅
- [x] Instalar e configurar Tailwind CSS (v4, plugin `@tailwindcss/vite`, CSS-first).
- [x] Inicializar shadcn/ui (estilo `base-nova`, base UI + Base UI primitives); componentes: button, input, label, card, table, dialog, sonner.
- [x] Tema (cores neutras + fonte Geist) e suporte claro/escuro via `next-themes` (`attribute="class"`).
- **Aceite**: ✅ página de exemplo em `src/App.tsx` renderiza componentes estilizados; verificado no browser em claro e escuro; toast e dialog funcionam.
- **Depende de**: T-01.
- **Nota**: o wrapper `form` (react-hook-form) foi **adiado para a Fase 1**, onde os formulários reais são construídos — o estilo `base-nova` usa Base UI e não traz o `form` clássico via CLI. Dependências já instaladas: `react-hook-form`, `zod`, `@hookform/resolvers`.

## T-03 — Layout responsivo (shell mobile + desktop) ✅
- [x] Shell `AppLayout` com navegação por contexto: barra inferior no mobile (campo) e sidebar no desktop (escritório); Toaster global.
- [x] Roteamento (React Router 7, `createBrowserRouter`) com rotas placeholder: `/ordens`, `/clientes`, `/financeiro`, redirect `/` → `/ordens`, 404.
- **Aceite**: ✅ verificado no browser — mobile (375px) mostra barra inferior, desktop (1280px) mostra sidebar; navegação entre rotas funciona (Ordens ↔ Clientes) com item ativo destacado.
- **Depende de**: T-02.

## T-04 — Projeto Supabase e conexão ✅ (local) / 🟡 nuvem pendente
- [x] Stack Supabase LOCAL (self-hosted via `supabase start`, Docker) rodando; conexão verificada.
- [ ] Criar projeto na NUVEM Supabase (free tier) para produção. — **ação do usuário** (opcional; local já funciona)
- [x] `.env.example` + cliente Supabase tipado (`src/lib/supabase.ts`), validação de env (`src/lib/env.ts`), typagem (`src/vite-env.d.ts`), placeholder de tipos do banco (`src/lib/database.types.ts`).
- [x] Documentar setup no `README`.
- **Aceite**: ✅ app conecta ao Supabase e `getSession` retorna sem erro — verificado contra a stack LOCAL na T-07.
- **Depende de**: T-01.

## T-05 — Schema e migrations (modelo de dados) ✅
- [x] Migration `supabase/migrations/20260817000001_initial_schema.sql` com enum `service_order_status`.
- [x] Tabelas em inglês: `client`, `service_order`, `service_order_item`, `trip`.
- [x] Colunas de auditoria em `client` e `service_order` (`created_at`/`updated_at`/`created_by`/`updated_by`).
- [x] FKs, `service_order.number` único, cascades (item/trip), `on delete restrict` em client com OS, checks (não-negativos).
- [x] Índices por `client_id`, `status`, `opened_at`, `paid`, `order_id`.
- [x] Tipos TS gerados do schema em `src/lib/database.types.ts` (cliente Supabase agora tipado).
- **Aceite**: ✅ migration aplica limpa em Postgres 16; testes confirmaram defaults (city=Timbó, status=open, paid=false, discount=0, opened_at=hoje), unicidade de `number`, `restrict` (bloqueia excluir client com OS) e cascade (excluir OS remove itens+trips).
- **Depende de**: T-04.
- **Aplicar no projeto** (após criar o Supabase e `supabase link`): `pnpm dlx supabase db push`. Regenerar tipos: `pnpm dlx supabase gen types typescript --project-id <id> > src/lib/database.types.ts`.
- **Nota**: `created_by`/`updated_by` recebem `default auth.uid()` (auditoria via default no insert + trigger no update, T-06); RLS na T-08.

## T-06 — Triggers de auditoria ✅
- [x] Migration `20260817000002_audit_triggers.sql`: funções `set_audit_fields_on_insert`/`on_update` + triggers BEFORE em `client` e `service_order`.
- [x] `created_at`/`updated_at` setados por trigger; `created_by`/`updated_by` de `auth.uid()` no insert; `created_*` imutáveis e `updated_*` atualizados no update.
- **Aceite**: ✅ validado no Postgres — insert (usuário A) preencheu os 4 campos; update (usuário B) manteve `created_by`=A, mudou `updated_by`=B e `updated_at` > `created_at`.
- **Depende de**: T-05.

## T-07 — Autenticação (usuário único) ✅
- [x] Supabase Auth e-mail/senha (stack local self-hosted via `supabase start`).
- [x] Usuário de teste provisionado (`admin@local.test`) via GoTrue admin API. **Substituir pelo usuário real na nuvem.**
- [x] `AuthProvider`/`useAuth` (`src/lib/auth-context.tsx`), tela de login (`src/pages/login-page.tsx`, react-hook-form + zod), guarda `RequireAuth`, logout no shell.
- [x] Sessão persistida (localStorage) e `onAuthStateChange`.
- **Aceite**: ✅ verificado no browser — sem sessão redireciona a `/login`; login válido entra e vai a `/ordens`; sessão persiste; logout volta a `/login`.
- **Depende de**: T-04, T-03.
- **Nota**: verificado contra Supabase LOCAL (Docker). Migração à nuvem = trocar URL/anon key no `.env` + criar o usuário real no dashboard.

## T-08 — Row Level Security (RLS) ✅
- [x] Migration `20260817000003_rls.sql`: RLS ativo nas 4 tabelas + policies `for all to authenticated`; grants de tabela ao role `authenticated` (anon omitido = negado).
- **Aceite**: ✅ verificado via PostgREST — anon SELECT/INSERT → 401; authenticated INSERT → sucesso (`created_by` auto), SELECT → retorna linha.
- **Depende de**: T-05, T-07.

## T-09 — Camada de repositório (RNF-03) ✅
- [x] Interfaces `ClientRepository` e `ServiceOrderRepository` (CRUD + leitura de OS com itens/trips + `suggestNextNumber` RN-01), em `src/lib/repositories/`.
- [x] Tipos de domínio derivados do schema (`types.ts`).
- [x] Implementações Supabase (`SupabaseClientRepository`, `SupabaseServiceOrderRepository`).
- [x] Ponto único de injeção (`index.ts`) — UI depende da interface, nunca do Supabase direto.
- **Aceite**: ✅ smoke test no browser (autenticado) criou e leu um `client` pela interface, com `created_by` preenchido, sem tocar o Supabase direto; `suggestNextNumber()` retornou `1708a` (RN-01).
- **Depende de**: T-05, T-06.
- **Nota**: escrita aninhada de itens/trips na OS fica pra Fase 1 (junto do editor de OS).

## T-10 — Verificação da fundação (fim da fase) ✅ (local)
- [x] Fluxo ponta a ponta verificado no stack local: login → criar `client` via repositório → registro com auditoria (`created_by`) → RLS bloqueia anon → logout redireciona a `/login`.
- [x] `README` com setup (self-hosted local + nuvem, migrations, rodar dev).
- **Aceite**: ✅ verde no Supabase LOCAL. Fundação pronta para a Fase 1.
- **Pendente (nuvem)**: repetir a verificação contra o projeto Supabase da nuvem quando criado (troca de `.env` + `db push` + usuário real).
- **Depende de**: T-01..T-09.

## Definição de Pronto da Fase 0
- App PWA roda e é instalável, responsivo (mobile/desktop).
- Banco com schema completo em inglês, auditoria e RLS ativos.
- Login funcional protegendo as rotas.
- Camada de repositório isolando o Supabase, provada por smoke test.
- Setup documentado no `README`.
