/** Extrai uma mensagem legível de um erro desconhecido (Supabase, Error, etc.). */
export function getErrorMessage(
  error: unknown,
  fallback = 'Ocorreu um erro. Tente novamente.',
): string {
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
