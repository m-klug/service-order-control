/** Códigos de erro do Postgres/PostgREST com mensagem amigável padrão. */
const PG_ERROR_MESSAGES: Record<string, string> = {
  '23505': 'Já existe um registro com esse valor.',
};

/**
 * Extrai uma mensagem legível de um erro desconhecido (Supabase, Error,
 * etc.). `overrides` troca a mensagem padrão de um código específico por uma
 * mais precisa pro contexto da chamada (ex.: qual campo é único ali).
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Ocorreu um erro. Tente novamente.',
  overrides?: Record<string, string>,
): string {
  const code = (error as { code?: string } | null)?.code;
  const mapped = code
    ? (overrides?.[code] ?? PG_ERROR_MESSAGES[code])
    : undefined;
  if (mapped) return mapped;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}
