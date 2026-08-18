const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/** Converte "YYYY-MM-DD" em "DD/MM/AAAA"; string vazia/inválida retorna vazio. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}
