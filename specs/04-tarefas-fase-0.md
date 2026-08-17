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

## T-04 — Projeto Supabase e conexão 🟡 (código pronto; pende chaves)
- [ ] Criar projeto no Supabase (free tier). — **ação do usuário**
- [x] `.env.example` + cliente Supabase tipado (`src/lib/supabase.ts`), validação de env (`src/lib/env.ts`), typagem (`src/vite-env.d.ts`), placeholder de tipos do banco (`src/lib/database.types.ts`).
- [x] Documentar setup no `README`.
- **Aceite**: app conecta ao Supabase; chamada de saúde/sessão retorna sem erro. → **pendente**: exige o projeto criado e o `.env` preenchido; será exercido na T-07 (`getSession` no login).
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
- **Nota**: RLS e triggers de auditoria ainda **não** aplicados — T-08 e T-06.

## T-06 — Triggers de auditoria
- [ ] Trigger/`default` para `created_at`/`updated_at`.
- [ ] Preencher `created_by` (imutável) e `updated_by` com o usuário autenticado (`auth.uid()`), via trigger ou na camada de aplicação.
- **Aceite**: inserir e atualizar um registro de teste preenche corretamente os 4 campos; `created_by` não muda em update.
- **Depende de**: T-05.

## T-07 — Autenticação (usuário único)
- [ ] Habilitar Supabase Auth (e-mail/senha).
- [ ] Provisionar o usuário operador.
- [ ] Tela de login/logout; guarda de rotas (redireciona não autenticado).
- [ ] Persistência de sessão.
- **Aceite**: sem login não acessa áreas internas; login válido entra; logout encerra sessão.
- **Depende de**: T-04, T-03.

## T-08 — Row Level Security (RLS)
- [ ] Ativar RLS em todas as tabelas.
- [ ] Políticas: apenas usuários autenticados leem/escrevem (modelo de usuário único; preparado para multiusuário futuro).
- **Aceite**: requisição sem sessão é negada; com sessão é permitida. Verificado em teste manual.
- **Depende de**: T-05, T-07.

## T-09 — Camada de repositório (RNF-03)
- [ ] Definir interfaces: `ClientRepository`, `ServiceOrderRepository` (com itens e trips), agnósticas de backend.
- [ ] Tipos de domínio (TypeScript) espelhando o modelo.
- [ ] Implementação Supabase das interfaces.
- [ ] Ponto único de injeção (a UI depende da interface, nunca do Supabase direto).
- **Aceite**: um smoke test cria e lê um `client` pela interface, sem a UI conhecer o Supabase.
- **Depende de**: T-05, T-06.

## T-10 — Verificação da fundação (fim da fase)
- [ ] Fluxo ponta a ponta manual: login → criar `client` via repositório → registro aparece com auditoria preenchida → logout bloqueia acesso.
- [ ] `README` com passos de setup (env, migrations, rodar dev).
- **Aceite**: todos os aceites acima verdes; fundação pronta para Fase 1.
- **Depende de**: T-01..T-09.

## Definição de Pronto da Fase 0
- App PWA roda e é instalável, responsivo (mobile/desktop).
- Banco com schema completo em inglês, auditoria e RLS ativos.
- Login funcional protegendo as rotas.
- Camada de repositório isolando o Supabase, provada por smoke test.
- Setup documentado no `README`.
