import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { env } from './env';

/**
 * Cliente Supabase tipado, único na aplicação.
 * A UI e os casos de uso NÃO devem importar isto diretamente — falam com a
 * camada de repositório (T-09), que encapsula o Supabase (RNF-03).
 */
export const supabase = createClient<Database>(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
