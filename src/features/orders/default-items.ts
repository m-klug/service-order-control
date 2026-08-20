/**
 * Descrições dos itens pré-adicionados em toda OS nova (quantidade 0,
 * editáveis/removíveis). O PDF reconhece essas duas descrições exatas para
 * omitir a linha quando ela não foi usada (quantidade 0) — ver
 * `pdf/service-order-pdf.tsx`.
 */
export const DEFAULT_ITEM_DESCRIPTIONS = [
  'Deslocamento',
  'Mão de Obra',
] as const;

/** Preço sugerido ao criar a OS; livremente editável, não força cobrança. */
const DEFAULT_UNIT_PRICES: Record<string, number> = {
  Deslocamento: 95,
};

export function defaultUnitPriceFor(description: string): number {
  return DEFAULT_UNIT_PRICES[description] ?? 0;
}

/** Ordem fixa dos itens padrão ao final da lista: penúltimo Mão de Obra, último Deslocamento. */
const DISPLAY_RANK: Record<string, number> = {
  'Mão de Obra': 1,
  Deslocamento: 2,
};

/**
 * Reordena para exibição (tela de OS e PDF): itens cadastrados primeiro, na
 * ordem em que já estão; Mão de Obra e Deslocamento sempre por último,
 * nessa ordem. `Array.prototype.sort` é estável (ES2019+), então a ordem
 * relativa dos demais itens não muda.
 */
export function sortItemsForDisplay<T extends { description: string }>(
  items: T[],
): T[] {
  const rank = (description: string) => DISPLAY_RANK[description] ?? 0;
  return [...items].sort((a, b) => rank(a.description) - rank(b.description));
}
