# Plano — Fase 4: Usabilidade do Dia a Dia

## Contexto

Com a Fase 3 os 7 critérios de aceite do MVP estão fechados: o app cobre todo o
fluxo que o papel cobria. O que sobra agora não é funcionalidade faltando, é
**atrito de uso** — coisas que fazem o operador digitar mais, procurar mais e
conferir mais do que precisaria.

Cinco ajustes, todos nascidos de uso real e decididos em conjunto:

1. Zebra nas tabelas — identificar a linha certa sem contar com o dedo.
2. Itens padrão na OS nova — "Deslocamento" e "Mão de Obra" já prontos.
3. Entrada monetária em pt-BR — `R$` no campo e vírgula decimal.
4. Valor pago pré-preenchido, com semântica clara para o zero.
5. Cliente por busca, com criação na hora.

Nenhuma das cinco toca schema ou migration. Quatro são camada de UI pura; a
única que sai da UI é um filtro de exibição no PDF. A camada de repositório não
muda em nenhuma delas (RNF-03 preservado).

Usabilidade passou à frente do Polimento (PWA instalável, validações, testes),
que virou a Fase 5: estes cinco itens saíram do uso real e valem mais agora do
que o PWA. A ordem das fases está no `02-plano-tecnico.md`, seção 5.

Cada etapa é **independente e executável isoladamente**. A ordem sugerida
minimiza retrabalho (a Etapa 3 troca os componentes onde a Etapa 4 escreve),
mas não há dependência técnica travando nenhuma delas. Convenções de sempre:
código/banco em inglês (RNF-07), UI em português, verificação no stack Supabase
local.

---

## Etapa 1 — Zebra nas tabelas

**Objetivo**: alternar a cor de fundo das linhas para facilitar a leitura
horizontal.

**Onde**: `src/components/ui/table.tsx` — as três telas com tabela (Ordens,
Financeiro, Clientes) usam o mesmo `TableBody`, então **uma alteração cobre as
três**. Não replicar nas páginas.

- Aplicar o listrado no `TableBody` (`[&>tr:nth-child(odd)]:bg-muted/30` ou
  equivalente), **não** no `TableRow` — o `TableRow` também renderiza a linha de
  cabeçalho dentro do `TableHeader`, que não deve ser listrada.
- O `TableRow` já tem `hover:bg-muted/50` e `has-aria-expanded:bg-muted/50`
  (`table.tsx:60`). O hover precisa continuar vencendo o listrado, senão a linha
  clicável perde o retorno visual — conferir a ordem das classes no resultado.
- Fora do escopo: linhas de item e cards de deslocamento dentro do editor de OS
  ficam como estão.

**Aceite**: linhas alternam nas três tabelas; o cabeçalho não é listrado; o
hover ainda destaca a linha sob o cursor; contraste aceitável nos temas claro e
escuro.

---

## Etapa 2 — Itens padrão na OS nova

**Objetivo**: toda OS nova já nasce com as linhas "Deslocamento" e "Mão de
Obra", porque a grande maioria das OS tem as duas. Sem catálogo: são itens de
texto livre como qualquer outro, só pré-adicionados — a
`01-especificacao.md:47` continua valendo sem alteração.

- **Constante compartilhada** (sugestão: `src/features/orders/default-items.ts`)
  com as duas descrições, importada pelo editor e pelo PDF. Como a identificação
  no PDF é por texto, as duas pontas não podem divergir.
- `src/pages/order-editor-page.tsx`: em `defaultValues`, `items` deixa de ser
  `[]` e passa a trazer as duas linhas com **quantidade 0 e preço 0**,
  editáveis e removíveis como qualquer item.
  - OS existente não é afetada: o `reset()` de edição sobrescreve `items` com
    `order.items` e já sai cedo quando não há `order` (`order-editor-page.tsx:231`).
  - O botão "Adicionar item" continua criando com quantidade 1 — não mexer.
- `src/features/orders/pdf/service-order-pdf.tsx`: filtrar antes de renderizar a
  tabela de itens — omitir a linha quando **a quantidade for 0 e a descrição for
  exatamente uma das duas**. Item de texto livre com quantidade 0 continua
  aparecendo (regra restrita a essas duas por enquanto).
  - O total não muda: `0 × preço` já soma zero, então RN-03 fica intacta.
  - Se o operador renomear a linha, ela deixa de ser reconhecida e volta a
    aparecer no PDF — degradação aceita conscientemente, é o preço de não criar
    coluna de tipo no banco.

**Aceite**: OS nova nasce com as duas linhas zeradas; o PDF dessa OS não mostra
nenhuma das duas; preencher a quantidade de uma delas faz a linha aparecer no
PDF; abrir uma OS antiga não adiciona nada; um item livre com quantidade 0
continua aparecendo no PDF.

---

## Etapa 3 — Entrada monetária em pt-BR

**Objetivo**: campos de dinheiro mostram `R$` dentro do campo e aceitam vírgula
decimal. Hoje são `type="number"`, que força ponto e exibe setas de spinner.

**Componente**: `NumberField` do `@base-ui/react` — já instalado, sem
dependência nova. Aceita `format?: Intl.NumberFormatOptions` e `locale?`
(`number-field/root/NumberFieldRoot.d.ts:99,132`), então
`format={{ style: 'currency', currency: 'BRL' }}` + `locale="pt-BR"` entrega
`R$` e vírgula no mesmo componente.

- Criar um wrapper (sugestão: `src/components/form/currency-field.tsx`) usando
  só as partes `Root` e `Input`, **sem** `Increment`/`Decrement` — o objetivo é
  tirar o spinner, não trocá-lo de lugar.
- **Campos afetados**: `items.N.unit_price`, `discount`, `amount_paid`.
- **Campos não afetados**: quantidade, km início/fim e garantia em meses não são
  monetários — seguem com `register` + `type="number"`.
- **React Hook Form**: o `NumberField` é controlado (`value`/`onValueChange`),
  então esses três campos saem de `register(...)` e passam a `Controller`.
- Atenção aos nulos, que já morderam antes (ver Etapa 1 da Fase 2):
  - `amount_paid` é anulável — limpar o campo deve gravar `null`.
  - `discount` é `not null default 0` no banco — limpar deve gravar `0`, então
    mapear `null → 0` na volta do `onValueChange`.
  - Conferir se `numberOrNull`/`numberOrZero` (`order-editor-page.tsx:94,102`)
    ainda têm uso depois da troca; os campos de km continuam usando `numberOrNull`.
- Saída já está correta e não muda: PDF e listas usam `formatCurrency`
  (`src/lib/format.ts`), que já imprime em pt-BR. Esta etapa alinha a **entrada**
  ao que a saída já fazia.

**Aceite**: digitar `150,50` grava `150.5` no banco; o campo exibe `R$`; limpar
o valor pago grava `null`; limpar o desconto grava `0`; o total ao vivo continua
correto; PDF e listagens inalterados.

---

## Etapa 4 — Valor pago pré-preenchido e "pago a menor"

**Objetivo**: poupar digitação no caso comum (recebeu o valor cheio) e separar
"não informei" de "cobrei zero".

**Depende de**: nada, mas fazer **depois da Etapa 3** evita reescrever o
preenchimento quando o campo trocar de componente.

- `src/pages/order-editor-page.tsx`: ao marcar **Pago** (transição
  `false → true`), se `amount_paid` estiver vazio **e** o total for maior que 0,
  preencher com o **total com desconto** (RN-03, piso em 0).
  - Não dispara ao desmarcar; não sobrescreve valor já digitado — pagamento
    parcial continua possível.
  - Reusar a conta do `OrderTotal` (`order-editor-page.tsx:112`) extraindo a
    função em vez de duplicar a fórmula.
- **Semântica do zero** (mudança de comportamento): hoje vazio e zero são
  tratados igual e ambos disparam o aviso "OS marcada como paga sem valor pago"
  (`order-editor-page.tsx:272`). Passam a ser diferentes:
  - `null` = não informado → continua avisando.
  - `0` explícito = serviço não cobrado (cortesia, garantia) → **não avisa**.
- `src/pages/finance-page.tsx`: selo **"pago a menor"** na linha quando
  `paid && amount_paid != null && amount_paid < total`.
  - A diferença **não** entra no card "Total a receber" — ele continua somando
    apenas as OS não pagas. *Decisão provisória*: revisitar quando os relatórios
    da `01-especificacao.md` §9 forem desenhados, porque é ali que a pergunta
    "quanto ainda tenho a receber" fica de fato respondida.

**Aceite**: marcar Pago preenche com o total com desconto; alterar o valor
depois não é sobrescrito ao salvar; marcar Pago com total 0 não preenche nada;
pago com `0` salva sem aviso; pago com campo vazio ainda avisa; o selo aparece
só nas OS pagas a menor; o card "Total a receber" não muda de valor.

---

## Etapa 5 — Cliente por busca, com criação na hora

**Objetivo**: substituir o `<select>` de cliente por um campo que filtra
conforme se digita, e permitir cadastrar o cliente sem sair da OS. Fecha de
verdade a **RF-02** ("selecionando cliente existente ou cadastrando na hora"),
hoje só meio atendida.

**Componente**: `Combobox` do `@base-ui/react` — já instalado, com as partes
necessárias (`input`, `list`, `item`, `empty`, `popup`, `positioner`).

- `src/pages/order-editor-page.tsx`: trocar o `<select>` de cliente
  (`order-editor-page.tsx:379`) pelo combobox.
- **Busca local**: `useClients()` já carrega todos os clientes e o volume é
  pequeno — nenhuma query nova no Supabase. Normalizar acento e caixa no filtro
  (`normalize('NFD')`), para "jose" encontrar "José".
- O valor do formulário continua sendo `client_id` (uuid): o campo **exibe** o
  nome e **guarda** o id.
- **Criar cliente**: quando a busca não encontrar nada, oferecer a opção de
  criar com o texto digitado, abrindo o `ClientFormDialog` já existente.
  - O dialog hoje recebe `{ open, onOpenChange, client }`
    (`client-form-dialog.tsx:53`) — precisa de uma prop nova para o nome inicial.
  - Depois de criar, selecionar o cliente novo automaticamente na OS; conferir
    se o dialog devolve o registro criado ou se precisa passar a devolver.
- Conferir em 375px: teclado virtual aberto, altura da lista e alvo de toque.

**Aceite**: digitar parte do nome filtra a lista (inclusive sem acento);
selecionar grava o `client_id` correto; criar cliente pelo combobox salva e já
deixa o cliente selecionado na OS; abrir uma OS existente mostra o cliente
certo; usável em 375px.

---

## Verificação (vale para todas as etapas)

Antes de commitar cada etapa: `pnpm build` e `pnpm exec prettier --check .`
verdes, mais verificação no Browser pane contra o Supabase local, conferindo a
persistência via PostgREST quando o dado não estiver visível na tela.

> **Nota**: o script `pnpm lint` está quebrado — chama `eslint`, que não é
> dependência do projeto (o linter aqui é o `oxlint`). Usar `pnpm exec oxlint`
> direto. Consertar o script é candidato à fase de Polimento.

Notas operacionais já conhecidas das fases anteriores: cliques por coordenada no
pane erram por escala — usar refs do `read_page`; sessões antigas no
localStorage quebram após `db reset` (deslogar/logar se aparecer 401).

Ao final das cinco, refazer o fluxo ponta a ponta (campo em 375px, escritório em
1280px, PDF) para garantir que nada regrediu — nenhuma etapa deveria alterar
dado persistido além do que já era gravado.

## Fora do escopo desta fase

- **PWA instalável, validações e testes** — Fase de Polimento.
- **Vírgula nos campos não monetários**, catálogo de produtos/serviços, offline
  real, relatórios/dashboards, envio de PDF por WhatsApp/e-mail — pontos em
  aberto da `01-especificacao.md` §9 e não-objetivos do MVP.
- **Diferença de "pago a menor" no total a receber** — decisão provisória de não
  incluir, revisitar junto dos relatórios.
- **Logo/identidade visual no PDF** e code splitting do bundle — feitos nas
  Fases 5 e 6 (ver `10-plano-fase-6-identidade-visual.md`).
