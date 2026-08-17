import { supabase } from '@/lib/supabase';
import type {
  ServiceOrder,
  ServiceOrderChanges,
  ServiceOrderWithChildren,
  NewServiceOrder,
} from './types';

export interface ServiceOrderRepository {
  list(): Promise<ServiceOrder[]>;
  getById(id: string): Promise<ServiceOrderWithChildren | null>;
  create(input: NewServiceOrder): Promise<ServiceOrder>;
  update(id: string, changes: ServiceOrderChanges): Promise<ServiceOrder>;
  remove(id: string): Promise<void>;
  /** Sugere o próximo número no padrão DDMM + letra (RN-01). */
  suggestNextNumber(date?: Date): Promise<string>;
}

export class SupabaseServiceOrderRepository implements ServiceOrderRepository {
  async list(): Promise<ServiceOrder[]> {
    const { data, error } = await supabase
      .from('service_order')
      .select('*')
      .order('opened_at', { ascending: false });
    if (error) throw error;
    return data;
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

  async create(input: NewServiceOrder): Promise<ServiceOrder> {
    const { data, error } = await supabase
      .from('service_order')
      .insert(input)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async update(
    id: string,
    changes: ServiceOrderChanges,
  ): Promise<ServiceOrder> {
    const { data, error } = await supabase
      .from('service_order')
      .update(changes)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
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
