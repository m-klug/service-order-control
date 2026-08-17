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

## F1-01 — Fundamentos de dados e formulário
- [ ] Adicionar TanStack Query (`QueryClientProvider`) envolvendo o app; hooks de query/mutation consomem a **camada de repositório** (nunca o Supabase direto).
- [ ] Estabelecer o padrão de formulário: react-hook-form + zod + componentes shadcn (resolve o wrapper `form` adiado da T-02), com exibição de erros e `onError → toast`.
- **Aceite**: um hook de query lista dados com estados de loading/erro; um formulário de exemplo valida e mostra erro de campo. `build`/`lint` verdes.
- **Depende de**: Fase 0.
- **Nota**: escolha de TanStack Query é recomendação (cache + refetch após mutação + UX de loading). Revisar antes de implementar.

## F1-02 — CRUD de Cliente (RF-01)
- [ ] Hooks de query/mutation sobre `clientRepository`.
- [ ] Página **Clientes**: listagem + busca por nome/telefone.
- [ ] Criar/editar cliente (campos: nome*, endereço, bairro, referência, cidade [default "Timbó"], telefone, e-mail).
- [ ] Excluir com confirmação; tratar `on delete restrict` (cliente com OS) com mensagem amigável.
- **Aceite**: criar, editar, listar, buscar e excluir cliente pela UI; cidade vem "Timbó"; excluir cliente com OS mostra erro claro em vez de quebrar.
- **Depende de**: F1-01.

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
