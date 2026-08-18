# Tarefas — Fase 3: Saída em PDF

> Objetivo: fechar o último critério de aceite do MVP em aberto (#6) — gerar o
> documento da OS em PDF. Listagem/filtros/busca já foram entregues na Fase 2
> (F2-03, F2-04).

## F3-01 — Geração de PDF da OS (RF-10) ✅
- [x] Dependência `@react-pdf/renderer` (API em JSX, consistente com o resto do código React).
- [x] Componente `ServiceOrderPdfDocument` (`src/features/orders/pdf/service-order-pdf.tsx`): reproduz o documento de papel — cabeçalho (empresa, número, data, status), dados do cliente, solicitação, deslocamentos (tabela, só se houver), itens (tabela com subtotal), relatório, desconto/total (RN-03), pagamento e garantia. Sem canhoto de recibo (não-objetivo).
- [x] `formatCurrency`/`formatDate` extraídos para `src/lib/format.ts`, reusados no editor de OS (antes duplicava o formatador de moeda) e no PDF.
- [x] `generateServiceOrderPdf` (`src/features/orders/pdf/generate-service-order-pdf.tsx`): gera o blob 100% no cliente (sem servidor — RNF-01/RNF-03) e dispara download via link temporário (`OS-{numero}.pdf`) — `window.open` com URL de blob após `await` é bloqueado como pop-up pelo navegador; link com atributo `download` não sofre esse bloqueio.
- [x] Botão "Gerar PDF" no editor de OS, visível só ao editar uma OS já salva (precisa de `order`/`client` carregados); cliente completo obtido de `useClients()`, já carregado na página, sem mudar o repositório.
- **Aceite**: ✅ verificado no stack local — OS com 1 item, 1 deslocamento, desconto, pagamento e garantia preenchidos gera PDF válido (`application/pdf`, conteúdo íntegro), todos os campos presentes, total correto, deslocamento e pagamento aparecem condicionalmente; `build`/`format:check` verdes.
- **Depende de**: Fase 2.

**FASE 3 CONCLUÍDA.**

## Definição de Pronto da Fase 3 ✅
- [x] Geração de PDF da OS, sem servidor extra, reproduzindo o documento de papel (sem canhoto).
- [x] Nenhuma mudança de schema/repositório — PDF é inteiramente derivado dos dados já persistidos.
- **Critério de aceite do MVP fechado nesta fase**: #6 (PDF). Todos os 7 critérios do MVP (`01-especificacao.md`) estão fechados.
