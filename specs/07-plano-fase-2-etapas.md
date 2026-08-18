# Plano — Fase 2: Deslocamentos, Pagamento e Fluxo de Campo

## Contexto

A Fase 1 entregou o núcleo da OS (cliente, número RN-01, itens, total ao vivo, listagem). Falta o que o formulário de papel ainda cobre e o app não: **deslocamentos** (km + horários + carro + visto), **pagamento** (pago / valor pago / quitação), **desconto** e **garantia** — além da visão financeira e do uso confortável em campo.

Fechando esta fase, os critérios de aceite do MVP #2, #4 e #5 ficam completos; resta só o #6 (PDF), que é Fase 3.

Cada etapa abaixo é **independente e executável isoladamente**, na ordem indicada pelas dependências. Todas seguem as convenções já estabelecidas: código/banco em inglês (RNF-07), UI em português, escrita/leitura só pela camada de repositório (RNF-03), verificação no stack Supabase local.

---

## Etapa 1 — F2-01: Deslocamentos na OS (RF-05, RN-05) ✅ concluída

**Objetivo**: registrar N deslocamentos por OS, todos os campos opcionais.

**Repositório**
- `src/lib/repositories/types.ts`: `TripInput` (campos anuláveis; `order_id`/`position` são do repositório) e `ServiceOrderChildren`.
- `src/lib/repositories/service-order-repository.ts`: `replaceTrips(orderId, trips)` privado, cópia fiel de `replaceItems` (delete por `order_id` + reinsert com `position` sequencial), com a mesma nota de não-atomicidade.
- **Assinatura**: agrupar filhos num objeto em vez de crescer posicionais — sem isso, atualizar só deslocamentos exigiria `update(id, changes, undefined, trips)`:
  ```ts
  create(input: NewServiceOrder, children?: ServiceOrderChildren): Promise<ServiceOrder>;
  update(id, changes, children?: ServiceOrderChildren): Promise<ServiceOrder>;
  ```
  Semântica da F1-03 preservada: chave ausente mantém; array presente substitui. Atualizar a interface junto da implementação.

**Hooks** — `src/features/orders/queries.ts`: mutations recebem `children` no lugar de `items`. Invalidações inalteradas.

**UI** — `src/pages/order-editor-page.tsx`: segundo `useFieldArray` com destructure renomeado (`tripFields`/`appendTrip`/`removeTrip`) para não colidir com o de itens.
- Zod: `trips: z.array(tripSchema)`, campos `.nullable()`. Números via `register(..., { setValueAs: v => v === '' ? null : Number(v) })` — `valueAsNumber` puro gera `NaN` em campo vazio, que aqui é o caso normal.
- `reset()`: mapear `order.trips` como já se faz com `order.items`.
- Card "Deslocamentos" entre Itens e as ações, no padrão visual do card de Itens.
- Recolhível com `<details>/<summary>` nativo estilizado (evita dependência nova e o atrito conhecido do CLI do shadcn). `<summary>` mostra "Nº deslocamento" + data/km quando preenchidos; recém-adicionado abre expandido, carregados do banco começam recolhidos. Campos em `sm:grid-cols-2` com `FormField` + `Input` (`date`/`number`/`time`); remover no padrão do item.
- `onSubmit`: montar `children: { items, trips }`.

**Utilitário** — extrair `emptyToNull` (hoje local em `src/features/clients/client-form-dialog.tsx:45`) para `src/lib/form-utils.ts` e importar nos dois lugares.

**Aceite**: 2+ deslocamentos com campos parciais salvam e recarregam na ordem certa (vazios em branco, não `0`/`NaN`); remover funciona; salvar sem tocar nos deslocamentos os mantém intactos; nenhum campo obrigatório.

**Verificado ✅** no stack local — todos os pontos do aceite confirmados via UI + PostgREST.

**Bug encontrado durante a verificação**: `Number(null) === 0` em JS. O `setValueAs` numérico recebia o valor padrão bruto (`null`) para campos nunca tocados dentro de um `useFieldArray` — não a string `""` do DOM, como se assumia. Km vazios gravavam `0` em vez de `null`. Corrigido tratando `null`/`undefined` explicitamente em `numberOrNull`, junto da string vazia. Fica registrado porque o mesmo padrão (`setValueAs` em campo numérico opcional dentro de `useFieldArray`) se repete na Etapa 2 (`amount_paid`, `warranty_months`) — usar a versão corrigida.

---

## Etapa 2 — F2-02: Pagamento, desconto e garantia (RF-08, RN-03, RN-04, RN-07) ✅ concluída

**Objetivo**: fechar os campos financeiros da OS; o desconto passa a valer no total.

**Depende de**: nada da Etapa 1 (pode ser feita antes ou em paralelo).

- `src/pages/order-editor-page.tsx`: novo card "Pagamento" com **pago** (checkbox), **valor pago**, **data de quitação**, **desconto** e **garantia (meses)**. Campos já existem no schema do banco (`paid`, `amount_paid`, `settled_at`, `discount`, `warranty_months`) e nos tipos gerados — nenhuma migration necessária. Sem método de pagamento (RN-04).
- `OrderTotal` (mesmo arquivo) passa a assistir também `discount` via `useWatch` e aplicar `Σ(qtd × preço) − desconto`, com piso em 0 (RN-03) — hoje o desconto está fixo em 0.
- Números anuláveis com o mesmo `setValueAs` da Etapa 1 (`amount_paid`, `warranty_months` vazios → `null`).
- Validação leve: marcar "pago" sem valor gera aviso (toast), **não** bloqueia o salvamento — o operador ajusta depois.
- Se o checkbox de shadcn não estiver instalado, usar `<input type="checkbox">` nativo estilizado, coerente com a decisão dos `<select>` nativos da F1-04.

**Aceite**: pago + valor persistem; desconto reflete no total ao vivo e após salvar; garantia salva e recarrega; desconto maior que os itens não deixa o total negativo.

**Verificado ✅** no stack local — todos os pontos confirmados via UI + PostgREST. A armadilha do `Number(null) === 0` (documentada na Etapa 1) reapareceu conforme previsto em `amount_paid`/`warranty_months`; resolvida reusando o `numberOrNull` já corrigido, mais um `numberOrZero` para `discount` (não anulável no banco, `default 0`).

---

## Etapa 3 — F2-03: Filtros completos na listagem (RF-09) ✅ concluída

**Objetivo**: completar os filtros da página Ordens.

**Depende de**: Etapa 2 (precisa de `paid` editável para valer a pena testar).

- `src/pages/orders-page.tsx`: somar aos filtros atuais (busca + status) o **período** (data inicial/final sobre `opened_at`) e **pago/não pago** (select de 3 estados: todos / pago / a receber).
- Manter a filtragem client-side no `useMemo` já existente — o volume (~60–90 OS/mês) não justifica ir ao banco; todos os filtros ativos combinam com E lógico.
- Cuidado com fuso: comparar `opened_at` como string `YYYY-MM-DD` (é `date`, não timestamp), sem `new Date()`.

**Aceite**: período retorna só OS no intervalo; "a receber" retorna só `paid = false`; filtros combinam corretamente entre si e com a busca.

**Verificado ✅** no stack local — período isola OS por data (18/08 vs 01/08), pago/a-receber corretos, combinação busca+pago confirma E lógico entre filtros.

---

## Etapa 4 — F2-04: Página Financeiro

**Objetivo**: substituir o placeholder por uma visão simples de pago × a receber.

**Depende de**: Etapa 2.

- `src/pages/finance-page.tsx`: hoje é `PlaceholderPage`; passa a listar OS reais reusando `useServiceOrders` (`src/features/orders/queries.ts`) — `ServiceOrderListItem` já traz `client_name` e `total` calculado, então **não é preciso mexer no repositório**.
- Tabela: número, cliente, total, situação (Pago / A receber), valor pago. Destaque visual para "a receber" e **total geral a receber** no topo.
- Filtro de período reaproveitando o mesmo padrão da Etapa 3 (extrair o controle para um componente compartilhado se a duplicação incomodar).
- Sem gráficos ou dashboard (RNF-05); linha clicável leva ao editor da OS, como na listagem.

**Aceite**: mostra OS reais com totais e situação corretos; a soma "a receber" bate com a soma manual das OS não pagas exibidas.

---

## Etapa 5 — F2-05: Fluxo mobile de campo (RNF-02)

**Objetivo**: tornar o uso em campo rápido, sem abrir o formulário inteiro.

**Depende de**: Etapas 1 e 2 (os campos precisam existir para serem priorizados).

- `src/pages/orders-page.tsx`: ação rápida de **status** direto na linha/cartão (Aberta → Em andamento → Concluída) usando `useUpdateServiceOrder` sem `children` — a semântica de "chave ausente mantém filhos" da Etapa 1 é justamente o que torna isso seguro.
- Considerar, no mobile, renderizar a lista como cartões em vez de tabela (a tabela em 375px já exige rolagem horizontal); a decisão pode ficar para a execução, medindo na tela.
- `src/pages/order-editor-page.tsx`: revisar a ordem dos blocos para o contexto de campo (status, relatório e deslocamento do dia acessíveis sem rolagem excessiva); conferir alvo de toque dos inputs numéricos e de hora dos cartões de deslocamento.
- Ponto conhecido de polish: na linha de itens, o campo "Descrição" fica estreito em 375px.

**Aceite**: no mobile dá para abrir a lista, mudar o status de uma OS e voltar em poucos toques, sem passar pelo formulário; deslocamento e relatório preenchíveis confortavelmente em 375px.

---

## Etapa 6 — F2-06: Verificação da Fase 2

**Depende de**: Etapas 1–5.

Fluxo ponta a ponta no stack local, partindo de banco limpo (`supabase db reset` + recriar usuário):
1. **Campo (375px)**: abrir OS, mudar status pela ação rápida, registrar 1 deslocamento parcial, preencher relatório.
2. **Escritório (1280px)**: aplicar desconto (total confere), marcar como paga com valor, conferir garantia.
3. **Listagem**: filtrar por período e por "a receber".
4. **Financeiro**: OS aparece com situação correta; total a receber bate.
5. Confirmar via PostgREST que `trip`, `paid`/`amount_paid`/`settled_at`, `discount` e `warranty_months` estão persistidos como esperado.

**Aceite**: fluxo completo verde; nenhum acesso ao Supabase fora da camada de repositório.

---

## Verificação (vale para todas as etapas)

Antes de commitar cada etapa: `pnpm build`, `pnpm exec oxlint` e `pnpm exec prettier --check .` verdes. Depois, verificação no Browser pane contra o Supabase local (login `admin@local.test` / `dev12345`), conferindo a persistência via PostgREST quando o dado não for visível na tela.

Notas operacionais já conhecidas: cliques por coordenada no pane erram por escala — usar refs do `read_page`, `requestSubmit()` ou eventos disparados via descriptor nativo; sessões antigas no localStorage quebram após `db reset` (deslogar/logar se aparecer 401).

## Fora do escopo da Fase 2

Geração de PDF da OS (critério #6 do MVP), catálogo de itens, offline real, relatórios/dashboards — todos previstos para fases seguintes.
