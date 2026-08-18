# Tarefas — Fase 2: Deslocamentos, Pagamento e Fluxo de Campo

> Objetivo: completar os campos do papel que ficaram fora da Fase 1 — deslocamentos,
> pagamento, desconto e garantia — e otimizar o uso em campo (mobile). Fecha os
> critérios de aceite do MVP que ainda faltam.
>
> Convenção mantida: código/banco em inglês (RNF-07); domínio/UI em português.
> Cada tarefa tem critério de aceite verificável. Verificar no stack Supabase local.

## F2-01 — Deslocamentos na OS (RF-05, RN-05) ✅
- [x] Repositório: `replaceTrips` no mesmo padrão de `replaceItems` (F1-03); `create`/`update` recebem `children?: ServiceOrderChildren` (`{ items?, trips? }`) — chave ausente mantém, array presente substitui.
- [x] UI no editor de OS: lista dinâmica de deslocamentos (`useFieldArray`), todos os campos opcionais (data, km início/fim, hora saída loja/chegada cliente/fim cliente/retorno loja, carro, visto).
- [x] Layout: cada deslocamento como `<details>/<summary>` recolhível com resumo ao vivo (data + km); recém-adicionado abre expandido, carregado do banco começa recolhido.
- [x] `emptyToNull` extraído para `src/lib/form-utils.ts` (compartilhado com o diálogo de cliente).
- **Aceite**: ✅ verificado no stack local — 2 deslocamentos parciais salvam com `position` 1/2 e campos vazios como `null` (não `0`); reabrir carrega tudo certo (recolhidos, resumo correto); salvar sem alterar deslocamentos os mantém intactos; remover reindexa (`position` 1); card utilizável em 375px.
- **Bug encontrado e corrigido durante a verificação**: `setValueAs` numérico (`numberOrNull`) recebia `null` bruto (valor padrão de campo nunca tocado num `useFieldArray`), não a string do DOM — `Number(null)` é `0` em JS, então km vazios gravavam como `0`. Corrigido tratando `null`/`undefined` explicitamente na função, além da string vazia.
- **Depende de**: Fase 1.

## F2-02 — Pagamento, desconto e garantia (RF-08, RN-03, RN-04, RN-07) ✅
- [x] Card "Pagamento" no editor de OS: **pago** (checkbox nativo estilizado), **valor pago**, **data de quitação**, **desconto**, **garantia (meses)**. Sem método de pagamento (RN-04).
- [x] `OrderTotal` passa a assistir `discount` via `useWatch`; total = Σ(itens) − desconto, piso em 0 (RN-03).
- [x] Validação leve: marcar "pago" sem valor dispara `toast.warning`, não bloqueia o salvamento.
- **Aceite**: ✅ verificado no stack local — desconto 30 sobre total 100 → R$ 70,00 ao vivo e após salvar; desconto 150 (maior que os itens) trava em R$ 0,00; pago sem valor salva com aviso; `amount_paid`/`warranty_months`/`settled_at` persistem como `null` quando vazios (não `0`); editar preenche e persiste todos os campos; card utilizável em 375px.
- **Depende de**: Fase 1.
- **Reuso da correção da F2-01**: `numberOrNull` (agora trata `null`/`undefined`, não só `''`) usado em `amount_paid`/`warranty_months`; `numberOrZero` (mesma lógica, padrão 0) para `discount`, que é `not null default 0` no banco.

## F2-03 — Filtros completos na listagem de OS (RF-09) ✅
- [x] Página Ordens: filtros de **período** (data inicial/final sobre `opened_at`, comparação de string `YYYY-MM-DD`) e **pagamento** (todos/pago/a receber).
- [x] Combinados com busca e status no mesmo `useMemo` (E lógico); `hasActiveFilters` diferencia "nenhuma OS cadastrada" de "nenhuma encontrada".
- **Aceite**: ✅ verificado no stack local — período 18/08–18/08 mantém as 6 OS do dia e exclui uma de 01/08; período 01/08–01/08 isola só essa; "A receber" exclui as 2 pagas; "Pago" retorna exatamente as 2 pagas; busca "1808" + Pago retorna só a interseção correta (E lógico).
- **Depende de**: F2-02 (campo `paid` editável na UI).

## F2-04 — Página Financeiro (RNF do plano técnico: visão financeira simples) ✅
- [x] Substituído o placeholder por lista real: número, cliente, data, total, situação (Pago/A receber, cor), valor pago. Reusa `useServiceOrders`/`ServiceOrderListItem` — nenhuma mudança no repositório.
- [x] Card "Total a receber" em destaque no topo; filtro de período (mesmo padrão da F2-03).
- [x] Sem gráficos/dashboard (RNF-05); linha clicável leva ao editor da OS, como na listagem de Ordens.
- **Aceite**: ✅ verificado no stack local — total a receber R$ 250,00 bate com a soma manual (200+50+0+0+0 das não pagas); filtro de período recalcula o total corretamente; situação e valor pago corretos por linha; clique na linha abre o editor; usável em 375px.
- **Depende de**: F2-02.

## F2-05 — Fluxo mobile de campo (RNF-02, contexto "campo" da spec) ✅
- [x] Ação rápida na listagem: `<select>` inline de status por linha (`stopPropagation` evita abrir o editor); `useUpdateServiceOrder` chamado sem `children`, preservando itens/deslocamentos (semântica da F2-01).
- [x] Editor de OS reordenado: Cabeçalho → **Deslocamentos** → Itens → Pagamento (deslocamento acessível logo após o cabeçalho, sem rolar pelos blocos de itens/pagamento).
- [x] Corrigido o ponto de polish conhecido: linha de item agora empilha em mobile (`flex-col`/`sm:flex-row`) — Descrição em largura total, quantidade/preço/remover numa linha abaixo, em vez de espremidos.
- **Aceite**: ✅ verificado no stack local — mudar status pela listagem não navega (permanece em `/ordens`), persiste, preserva deslocamentos existentes; editor mostra Deslocamentos como 2º bloco; item empilha corretamente em 375px; cartões de deslocamento já verificados usáveis na F2-01.
- **Depende de**: F2-01, F2-02.
- **Decisão**: mantida a tabela (com scroll horizontal, padrão já aceito desde F1-06/F2-03) em vez de um layout de cartões dedicado para mobile — evita duplicar layout (RNF-05); o `select` de status é utilizável mesmo com a rolagem.

## F2-06 — Verificação da Fase 2
- [ ] Fluxo ponta a ponta no stack local: atender OS em campo (mobile) — mudar status, registrar 1 deslocamento, preencher relatório; no escritório (desktop) — aplicar desconto, marcar como paga, conferir na página Financeiro.
- [ ] Conferir os filtros de período e pago/não pago na listagem.
- **Aceite**: fluxo completo verde; nada de acesso ao Supabase fora da camada de repositório.
- **Depende de**: F2-01..F2-05.

## Definição de Pronto da Fase 2
- Deslocamentos: registráveis, dinâmicos, todos os campos opcionais.
- Pagamento: pago/valor pago/data de quitação; desconto e garantia editáveis; total correto com desconto.
- Listagem de OS: filtros completos (status, cliente, período, pago/não pago).
- Página Financeiro: lista simples pago x a receber.
- Fluxo mobile de campo: mudança de status rápida, formulário utilizável em tela pequena.
- Tudo pela camada de repositório; verificado no stack local; `build`/`lint`/`prettier` verdes.
- **Critérios de aceite do MVP fechados nesta fase**: 2 (completo, com deslocamento/garantia/desconto), 4 (marcar pago + valor), 5 (completo, com período e pagamento), 6 segue pendente (PDF — Fase 3).
