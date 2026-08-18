# Tarefas — Fase 2: Deslocamentos, Pagamento e Fluxo de Campo

> Objetivo: completar os campos do papel que ficaram fora da Fase 1 — deslocamentos,
> pagamento, desconto e garantia — e otimizar o uso em campo (mobile). Fecha os
> critérios de aceite do MVP que ainda faltam.
>
> Convenção mantida: código/banco em inglês (RNF-07); domínio/UI em português.
> Cada tarefa tem critério de aceite verificável. Verificar no stack Supabase local.

## F2-01 — Deslocamentos na OS (RF-05, RN-05)
- [ ] Repositório: escrita de `trip` na OS, no mesmo padrão de `replaceItems` (F1-03) — substituição completa por posição sequencial; `trips?: TripInput[]` opcional em `create`/`update` (undefined mantém).
- [ ] UI no editor de OS: lista dinâmica de deslocamentos (`useFieldArray`), todos os campos opcionais (data, km início/fim, hora saída loja/chegada cliente/fim cliente/retorno loja, carro, visto). Adicionar quantos precisar (RN-05 — os "3 espaços" do papel eram só limitação física).
- [ ] Layout compacto: cada deslocamento como cartão/linha recolhível (evitar poluir o formulário com N×9 campos abertos).
- **Aceite**: adicionar 2+ deslocamentos com campos parciais (nem todos preenchidos) salva e recarrega corretamente; remover deslocamento funciona; nenhum campo é obrigatório.
- **Depende de**: Fase 1.

## F2-02 — Pagamento, desconto e garantia (RF-08, RN-03, RN-04, RN-07)
- [ ] Campos no editor de OS: **pago** (checkbox), **valor pago**, **data de quitação**, **desconto**, **garantia (meses)**. Sem método de pagamento (RN-04).
- [ ] Total ao vivo (F1-05) passa a descontar o campo `desconto` real (hoje fixo em 0); nunca negativo (RN-03).
- [ ] Validação leve: se marcar "pago" sem valor, avisar (não bloquear — o operador pode ajustar depois).
- **Aceite**: marcar pago + valor persiste; desconto reflete no total ao vivo e após salvar; garantia salva e recarrega; total nunca fica negativo com desconto maior que os itens.
- **Depende de**: Fase 1.

## F2-03 — Filtros completos na listagem de OS (RF-09)
- [ ] Adicionar à página Ordens (F1-06) os filtros que faltaram: **período** (data inicial/final sobre `opened_at`) e **pago/não pago**.
- [ ] Combinar com busca e filtro de status já existentes (E lógico entre todos os filtros ativos).
- **Aceite**: filtrar por período retorna só OS no intervalo; filtrar por "não pago" retorna só `paid = false`; filtros combinam corretamente com busca/status.
- **Depende de**: F2-02 (campo `paid` editável na UI).

## F2-04 — Página Financeiro (RNF do plano técnico: visão financeira simples)
- [ ] Substituir o placeholder da página Financeiro por uma lista: OS, cliente, total, situação (pago/a receber), valor pago.
- [ ] Separação ou destaque visual entre "pago" e "a receber"; total geral a receber no período visível.
- [ ] Sem gráficos/dashboard — lista simples, consistente com RNF-05 (simplicidade).
- **Aceite**: página mostra OS reais com totais e situação corretos; soma "a receber" bate com a soma manual das OS não pagas exibidas.
- **Depende de**: F2-02.

## F2-05 — Fluxo mobile de campo (RNF-02, contexto "campo" da spec)
- [ ] Ação rápida na lista de OS (mobile): mudar status sem abrir o editor completo (ex.: menu/botões inline para Aberta → Em andamento → Concluída).
- [ ] Revisar o editor de OS em mobile com foco no uso em campo: ordem dos campos prioriza o que o técnico preenche no local (status, relatório, deslocamento do dia), sem exigir rolagem excessiva para ações comuns.
- [ ] Conferir usabilidade dos cartões de deslocamento (F2-01) em tela pequena — inputs numéricos e de hora com tamanho de toque adequado.
- **Aceite**: no mobile, dá para abrir a lista, mudar o status de uma OS e voltar em poucos toques, sem passar pelo formulário inteiro; deslocamento e relatório são preenchíveis confortavelmente em 375px.
- **Depende de**: F2-01, F2-02.

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
