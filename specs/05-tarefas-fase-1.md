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

## F1-03 — Escrita aninhada da OS no repositório (adiada da T-09)
- [ ] `ServiceOrderRepository`: criar/atualizar OS com seus **itens** numa operação coerente (substituição de itens no update); leitura com filhos já existe (`getById`).
- [ ] Tipos de entrada para item (`NewServiceOrderItem`), `position` sequencial.
- [ ] (Trips ficam para a Fase 2 — manter interface preparada, sem UI.)
- **Aceite**: criar OS com N itens e reler retorna os itens na ordem correta; atualizar itens substitui o conjunto corretamente. Verificado (smoke/teste).
- **Depende de**: Fase 0 (T-09).

## F1-04 — Criar/editar OS: cabeçalho e numeração (RF-02, RF-03, RF-07)
- [ ] Selecionar cliente existente (combobox com busca) — criar cliente rápido é opcional/atalho.
- [ ] Número automático via `suggestNextNumber` (RN-01: DDMM + letra), **editável**; validar unicidade e tratar colisão com mensagem.
- [ ] Data de abertura (default hoje), status (Aberta/Em andamento/Concluída), solicitação e relatório (texto).
- **Aceite**: nova OS traz número sugerido editável; dá para trocar status; salvar e reabrir mantém os dados; número duplicado é barrado com aviso.
- **Depende de**: F1-01, F1-02, F1-03.

## F1-05 — Itens da OS e total ao vivo (RF-04, RN-03)
- [ ] Editor de itens: adicionar/editar/remover (descrição, quantidade, preço unitário); `subtotal = qtd × preço`.
- [ ] Total recalculado ao vivo: `Σ(subtotal) − desconto` (desconto = 0 nesta fase), nunca negativo.
- **Aceite**: total confere com RN-03 ao adicionar/editar/remover itens; salvar persiste itens e total reflete na releitura.
- **Depende de**: F1-04.

## F1-06 — Listagem de OS (RF-09, parcial)
- [ ] Página **Ordens**: lista com número, cliente, data de abertura, status e total.
- [ ] Busca por número/cliente e filtro por status. (Período e pago/não pago ficam para Fase 2/3.)
- [ ] Abrir uma OS da lista leva ao editor (F1-04/05).
- **Aceite**: a lista mostra OS reais do banco; busca e filtro por status funcionam; clicar abre a OS.
- **Depende de**: F1-04, F1-05.

## F1-07 — Verificação da Fase 1
- [ ] Fluxo ponta a ponta no stack local: cadastrar cliente → criar OS (número sugerido, itens, status) → total correto → OS aparece na lista → editar itens/status → excluir OS.
- [ ] Conferir no mobile (campo) e desktop (escritório) que as telas são utilizáveis.
- **Aceite**: fluxo completo verde; nada de acesso ao Supabase fora da camada de repositório.
- **Depende de**: F1-01..F1-06.

## Definição de Pronto da Fase 1
- Clientes: CRUD completo com busca.
- OS: criar/editar com número automático (RN-01), itens e total ao vivo (RN-03), status e textos (solicitação/relatório).
- Ordens: listagem com busca e filtro por status.
- Tudo pela camada de repositório; verificado no stack local; `build`/`lint`/`prettier` verdes.
- **Critérios de aceite do MVP cobertos até aqui**: 1 (cliente reutilizável), 2 (criar OS com número/itens — deslocamentos/garantia/desconto na Fase 2), 3 (total correto), 5 (listar/buscar — parcial).
