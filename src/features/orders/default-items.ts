/**
 * Descrições dos itens pré-adicionados em toda OS nova (quantidade e preço 0,
 * editáveis/removíveis). O PDF reconhece essas duas descrições exatas para
 * omitir a linha quando ela não foi usada (quantidade 0) — ver
 * `pdf/service-order-pdf.tsx`.
 */
export const DEFAULT_ITEM_DESCRIPTIONS = [
  'Deslocamento',
  'Mão de Obra',
] as const;
