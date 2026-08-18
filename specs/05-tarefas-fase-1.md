# Tarefas — Fase 1: Núcleo OS

> Objetivo: cadastrar clientes e criar/editar/listar ordens de serviço com itens,
> numeração automática (RN-01), total ao vivo (RN-03) e status. Escopo enxuto.
>
> **Fora desta fase** (vão para a Fase 2): deslocamentos, pagamento, desconto e
> garantia na UI, fluxo mobile de campo. Aqui o `desconto` entra no cálculo do
> total mas fica fixo em 0 (campo editável só na Fase 2).
>
> Convenção mantida: código/banco em inglês (RNF-07); domínio/UI em português.
> Cada tarefa tem critério de aceite verificável. Verificar no stack Supabase local.

## F1-01 — Fundamentos de dados e formulário ✅
- [x] TanStack Query instalado; `QueryClientProvider` em `main.tsx` (defaults: `staleTime` 30s, `retry` 1, sem refetch no foco). `src/lib/query-client.ts`.
- [x] Padrão de formulário: react-hook-form + zod + `FormField` (`src/components/form/form-field.tsx`, rótulo + controle + erro/dica); helper `getErrorMessage` (`src/lib/errors.ts`). Login refatorado para usar `FormField` (prova do padrão).
- **Aceite**: ✅ app sobe com os providers sem erro; formulário de login valida (erros "E-mail inválido"/"Informe a senha") e faz login. Hooks de query/mutation sobre os repositórios entram na F1-02 (provider já verificado).
- **Depende de**: Fase 0.
- **Nota**: TanStack Query adotado (cache + refetch após mutação + UX de loading).

## F1-02 — CRUD de Cliente (RF-01) ✅
- [x] Hooks de query/mutation sobre `clientRepository` (`src/features/clients/queries.ts`, invalidação em `['clients']`).
- [x] Página **Clientes**: listagem (TanStack Query) + busca por nome/telefone.
- [x] Criar/editar via `ClientFormDialog` (nome*, telefone, e-mail, endereço, bairro, cidade [default "Timbó"], referência); form no padrão F1-01.
- [x] Excluir com `ConfirmDialog`; trata `on delete restrict` (código 23503) com mensagem amigável, mantendo o diálogo aberto.
- **Aceite**: ✅ verificado no browser — criar (aparece na lista, cidade Timbó), buscar (filtra), editar (persiste; trigger de update roda), excluir (remove + toast), excluir cliente com OS → erro claro sem quebrar.
- **Depende de**: F1-01.
- **Extra**: `ConfirmDialog` reutilizável (`src/components/confirm-dialog.tsx`) — trata erro do `onConfirm` sem unhandled rejection.

## F1-03 — Escrita aninhada da OS no repositório (adiada da T-09) ✅
- [x] `ServiceOrderRepository.create(input, items)` e `update(id, changes, items?)` — `replaceItems` remove e reinsere com `position` sequencial (`items?` undefined mantém os itens).
- [x] Tipo `ServiceOrderItemInput`; `getById` já lê filhos ordenados por `position`.
- [x] Trips: interface preparada, sem UI (Fase 2).
- **Aceite**: ✅ smoke no browser — criar OS `1708a` com 2 itens (positions [1,2], total 192) e reler retorna ordenado; atualizar com 1 item substitui o conjunto (positions [1]).
- **Depende de**: Fase 0 (T-09).
- **Nota**: `replaceItems` não é atômico entre delete/insert (aceitável p/ 1 usuário); upgrade futuro = função RPC no banco.

## F1-04 — Criar/editar OS: cabeçalho e numeração (RF-02, RF-03, RF-07) ✅
- [x] Editor `OrderEditorPage` (rotas `/ordens/nova` e `/ordens/:id`); hooks de OS em `src/features/orders/queries.ts`.
- [x] Seleção de cliente (select nativo com options do `useClients`); número automático via `suggestNextNumber` (RN-01), **editável**; colisão (23505) tratada com aviso.
- [x] Data de abertura (default hoje), status (Aberta/Em andamento/Concluída), solicitação e relatório (textarea).
- **Aceite**: ✅ verificado — nova OS traz número sugerido (`1708b`) editável; criar persiste (created_by via trigger); número duplicado → "Já existe uma OS com esse número." e permanece na página; editar carrega e salva (status/relatório, trigger de update).
- **Depende de**: F1-01, F1-02, F1-03.
- **Nota**: usei `<select>`/`<textarea>` nativos estilizados (integram com `register`); botão "Nova OS" na página Ordens (lista completa é F1-06). Itens/total entram na F1-05 (create passa `items: []` por ora).

## F1-05 — Itens da OS e total ao vivo (RF-04, RN-03) ✅
- [x] Editor de itens com `useFieldArray`: adicionar/editar/remover (descrição, quantidade, preço unitário).
- [x] Total ao vivo (`OrderTotal` + `useWatch`): `Σ(qtd × preço) − desconto` (0 nesta fase), nunca negativo, formatado em BRL.
- [x] Salvar persiste itens via escrita aninhada (F1-03); edição carrega itens existentes.
- **Aceite**: ✅ verificado — 2 itens (97+95) → total R$ 192,00; remover recalcula para R$ 97,00; salvar persiste (1 item, position 1); reabrir carrega o item e o total.
- **Depende de**: F1-04.

## F1-06 — Listagem de OS (RF-09, parcial) ✅
- [x] `list()` do repositório enriquecido com nome do cliente (embed) e total calculado (`ServiceOrderListItem`).
- [x] Página **Ordens**: tabela com número, cliente, data (dd/mm/aaaa), status e total (BRL).
- [x] Busca por número/cliente + filtro por status; clique na linha abre o editor; excluir OS com `ConfirmDialog`.
- **Aceite**: ✅ verificado — lista mostra 3 OS reais com cliente e total corretos; filtro "Aberta" → só 1708z; busca "1708b" filtra; clique abre editor (`/ordens/:id`); excluir remove a linha.
- **Depende de**: F1-04, F1-05.

## F1-07 — Verificação da Fase 1
## F1-07 — Verificação da Fase 1 ✅
- [x] Banco local resetado limpo (`supabase db reset` + usuário de teste recriado); fluxo ponta a ponta refeito do zero pela UI: criar cliente (Condomínio Jardim) → criar OS (número sugerido `1708a`, 2 itens, total R$ 192,00) → OS aparece na lista com cliente e total corretos → editar (status → Concluída, remover item → total R$ 97,00, lista reflete) → excluir OS (lista some, "Nenhuma OS cadastrada.").
- [x] Conferido em mobile (375px) e desktop (1280px): editor de OS utilizável nos dois — campos full-width e bottom nav no mobile; itens cabem na largura (descrição um pouco estreita, polish futuro).
- **Aceite**: ✅ fluxo completo verde partindo de banco limpo; toda leitura/escrita passou pela camada de repositório (nenhum acesso direto ao Supabase fora dela).
- **Depende de**: F1-01..F1-06.

## Definição de Pronto da Fase 1 ✅
- [x] Clientes: CRUD completo com busca.
- [x] OS: criar/editar com número automático (RN-01), itens e total ao vivo (RN-03), status e textos (solicitação/relatório).
- [x] Ordens: listagem com busca e filtro por status.
- [x] Tudo pela camada de repositório; verificado no stack local; `build`/`lint`/`prettier` verdes.
- **Critérios de aceite do MVP cobertos até aqui**: 1 (cliente reutilizável), 2 (criar OS com número/itens — deslocamentos/garantia/desconto na Fase 2), 3 (total correto), 5 (listar/buscar — parcial).

**FASE 1 CONCLUÍDA.** Próximo: Fase 2 (deslocamentos, pagamento, desconto/garantia na UI, fluxo mobile de campo).
