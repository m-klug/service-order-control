import { supabase } from '@/lib/supabase';
import type {
  ServiceOrder,
  ServiceOrderChanges,
  ServiceOrderItemInput,
  ServiceOrderListItem,
  ServiceOrderWithChildren,
  NewServiceOrder,
} from './types';

export interface ServiceOrderRepository {
  list(): Promise<ServiceOrderListItem[]>;
  getById(id: string): Promise<ServiceOrderWithChildren | null>;
  /** Cria a OS e seus itens. */
  create(
    input: NewServiceOrder,
    items: ServiceOrderItemInput[],
  ): Promise<ServiceOrder>;
  /**
   * Atualiza a OS. Se `items` for informado, substitui o conjunto de itens;
   * `undefined` mantém os itens atuais.
   */
  update(
    id: string,
    changes: ServiceOrderChanges,
    items?: ServiceOrderItemInput[],
  ): Promise<ServiceOrder>;
  remove(id: string): Promise<void>;
  /** Sugere o próximo número no padrão DDMM + letra (RN-01). */
  suggestNextNumber(date?: Date): Promise<string>;
}

export class SupabaseServiceOrderRepository implements ServiceOrderRepository {
  async list(): Promise<ServiceOrderListItem[]> {
    const { data, error } = await supabase
      .from('service_order')
      .select('*, client(name), service_order_item(quantity, unit_price)')
      .order('opened_at', { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row) => {
      const { client, service_order_item, ...order } = row;
      const items = (service_order_item ?? []) as {
        quantity: number;
        unit_price: number;
      }[];
      const itemsTotal = items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
        0,
      );
      return {
        ...(order as ServiceOrder),
        client_name: (client as unknown as { name: string } | null)?.name ?? '',
        total: itemsTotal - Number(order.discount),
      };
    });
  }

  async getById(id: string): Promise<ServiceOrderWithChildren | null> {
    const { data: order, error } = await supabase
      .from('service_order')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!order) return null;

    const [items, trips] = await Promise.all([
      supabase
        .from('service_order_item')
        .select('*')
        .eq('order_id', id)
        .order('position'),
      supabase.from('trip').select('*').eq('order_id', id).order('position'),
    ]);
    if (items.error) throw items.error;
    if (trips.error) throw trips.error;

    return { ...order, items: items.data, trips: trips.data };
  }

  async create(
    input: NewServiceOrder,
    items: ServiceOrderItemInput[],
  ): Promise<ServiceOrder> {
    const { data, error } = await supabase
      .from('service_order')
      .insert(input)
      .select('*')
      .single();
    if (error) throw error;
    await this.replaceItems(data.id, items);
    return data;
  }

  async update(
    id: string,
    changes: ServiceOrderChanges,
    items?: ServiceOrderItemInput[],
  ): Promise<ServiceOrder> {
    const { data, error } = await supabase
      .from('service_order')
      .update(changes)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    if (items !== undefined) await this.replaceItems(id, items);
    return data;
  }

  /**
   * Substitui todos os itens da OS pelos informados (remove e reinsere com
   * `position` sequencial). Nota: não é atômico entre remoção e inserção —
   * aceitável nesta escala (1 usuário). Upgrade futuro: função RPC no banco.
   */
  private async replaceItems(
    orderId: string,
    items: ServiceOrderItemInput[],
  ): Promise<void> {
    const { error: deleteError } = await supabase
      .from('service_order_item')
      .delete()
      .eq('order_id', orderId);
    if (deleteError) throw deleteError;

    if (items.length === 0) return;

    const rows = items.map((item, index) => ({
      order_id: orderId,
      position: index + 1,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));
    const { error: insertError } = await supabase
      .from('service_order_item')
      .insert(rows);
    if (insertError) throw insertError;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('service_order')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async suggestNextNumber(date = new Date()): Promise<string> {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `${dd}${mm}`;

    const { data, error } = await supabase
      .from('service_order')
      .select('number')
      .like('number', `${prefix}%`);
    if (error) throw error;

    const used = new Set(data.map((r) => r.number.slice(prefix.length)));
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(97 + i);
      if (!used.has(letter)) return `${prefix}${letter}`;
    }
    // Além de 26 OS no mesmo dia (improvável): sufixo numérico.
    return `${prefix}${data.length}`;
  }
}
