import type { Database } from '@/lib/database.types';

type Tables = Database['public']['Tables'];

export type ServiceOrderStatus =
  Database['public']['Enums']['service_order_status'];

// Linhas do banco (leitura).
export type Client = Tables['client']['Row'];
export type ServiceOrder = Tables['service_order']['Row'];
export type ServiceOrderItem = Tables['service_order_item']['Row'];
export type Trip = Tables['trip']['Row'];

// Entrada de escrita sem id e sem colunas de auditoria — o banco as preenche
// (defaults + trigger de update). Ver migrations de schema/auditoria.
type Writable<T> = Omit<
  T,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>;

export type NewClient = Writable<Tables['client']['Insert']>;
export type ClientChanges = Partial<Writable<Tables['client']['Update']>>;

export type NewServiceOrder = Writable<Tables['service_order']['Insert']>;
export type ServiceOrderChanges = Partial<
  Writable<Tables['service_order']['Update']>
>;

/** Item informado pela UI; o repositório atribui `order_id` e `position`. */
export type ServiceOrderItemInput = {
  description: string;
  quantity: number;
  unit_price: number;
};

// OS com filhos (leitura detalhada).
export type ServiceOrderWithChildren = ServiceOrder & {
  items: ServiceOrderItem[];
  trips: Trip[];
};

// Item de listagem: OS + nome do cliente + total calculado.
export type ServiceOrderListItem = ServiceOrder & {
  client_name: string;
  total: number;
};
