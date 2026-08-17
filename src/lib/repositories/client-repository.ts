import { supabase } from '@/lib/supabase';
import type { Client, ClientChanges, NewClient } from './types';

/** Contrato agnóstico de backend. A UI/casos de uso dependem disto, não do Supabase. */
export interface ClientRepository {
  list(): Promise<Client[]>;
  getById(id: string): Promise<Client | null>;
  create(input: NewClient): Promise<Client>;
  update(id: string, changes: ClientChanges): Promise<Client>;
  remove(id: string): Promise<void>;
}

export class SupabaseClientRepository implements ClientRepository {
  async list(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('client')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  }

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('client')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async create(input: NewClient): Promise<Client> {
    const { data, error } = await supabase
      .from('client')
      .insert(input)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, changes: ClientChanges): Promise<Client> {
    const { data, error } = await supabase
      .from('client')
      .update(changes)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('client').delete().eq('id', id);
    if (error) throw error;
  }
}
