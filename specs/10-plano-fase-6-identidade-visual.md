# Plano — Fase 6: Identidade Visual

## Contexto

Fase 5 (Polimento) resolveu o PWA instalável, mas manteve placeholders
genéricos em três lugares: cabeçalho do PDF (só texto), ícones do PWA
(quadrado de cor sólida) e favicon (blob roxo sem relação com a marca).
Esta fase troca os três pela marca real da Beto Sistemas de Segurança.

A logo original (extraída de uma planilha usada hoje no papel) era um
JPEG de baixa resolução, sem transparência — inutilizável direto. Foi
reconstruída como vetor a partir da geometria medida no traçado
automático do arquivo (espiral arquimediana + a letra "B" original),
gerando dois SVGs fonte:

- **`logo-beto-b.svg`** — marca completa (espiral + "B"), usada no PDF e
  nos ícones ≥192px.
- **`logo-beto-b-favicon.svg`** — versão simplificada (disco + "B", sem
  os anéis finos que viram mancha abaixo de ~32px), usada no favicon e no
  ícone maskable do PWA.

## O que foi feito

- **PDF** (`src/features/orders/pdf/logo-mark.tsx`): a marca embutida como
  vetor nativo do PDF (`<Svg>`/`<Path>` do `@react-pdf/renderer`, paths
  extraídos de `logo-beto-b.svg`), não como imagem rasterizada — nítida
  em qualquer zoom, sem asset binário. Usada no `headerRow` de
  `service-order-pdf.tsx`, ao lado do nome por extenso.
- **Ícones do PWA** (`public/icons/`): `icon-192.png` e `icon-512.png`
  (marca completa), `icon-512-maskable.png` (versão simplificada, com
  folga suficiente pro recorte do launcher). `vite.config.ts` atualizado
  pra apontar o `purpose: 'maskable'` pro novo arquivo.
- **Favicon** (`public/favicon.svg`): substituído pela versão
  simplificada — `index.html` já apontava pro caminho certo, não precisou
  mudar.
- **Limpeza**: `scripts/gen-placeholder-icons.mjs` (não tinha capacidade
  de processar imagem real, só gerava placeholder) e `public/icons.svg`
  (órfão, zero referência) removidos.

## Verificação

- `pnpm exec tsc -b` limpo.
- PDF: gerar PDF de uma OS existente, conferir logo no cabeçalho.
- PWA: `pnpm build && pnpm preview`, manifesto e ícones carregando,
  favicon na aba.
