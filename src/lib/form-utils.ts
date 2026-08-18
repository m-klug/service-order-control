/** Converte string vazia/em branco em `null`; preserva o valor aparado. */
export function emptyToNull(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
