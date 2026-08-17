import {
  SupabaseClientRepository,
  type ClientRepository,
} from './client-repository';
import {
  SupabaseServiceOrderRepository,
  type ServiceOrderRepository,
} from './service-order-repository';

/**
 * Ponto único de injeção. A aplicação importa estas instâncias (interfaces),
 * nunca o Supabase direto — assim a implementação pode trocar (ex.: cache
 * local + sync offline) sem tocar a UI (RNF-03).
 */
export const clientRepository: ClientRepository =
  new SupabaseClientRepository();
export const serviceOrderRepository: ServiceOrderRepository =
  new SupabaseServiceOrderRepository();

export type { ClientRepository } from './client-repository';
export type { ServiceOrderRepository } from './service-order-repository';
export * from './types';
