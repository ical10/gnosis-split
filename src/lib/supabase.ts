import { createClient } from '@supabase/supabase-js';
import { writable } from 'svelte/store';
import type { Split } from './types';
import type { Database } from './supabase-types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const createSplitStore = (splitId: string) => {
  const { subscribe, set } = writable<Split | null>(null);

  if (import.meta.env.VITE_USE_SUPABASE !== 'true') {
    return { subscribe, set, refresh: async () => { } };
  }

  const load = async () => {
    const { data, error } = await supabase.from('splits').select('*').eq('id', splitId).single();

    if (error) {
      console.error('Failed to load split: ', error);
      return;
    }

    set({
      id: data.id,
      description: data.description,
      totalAmount: data.total_amount,
      date: data.date,
      payerAddress: data.payer_address,
      participants: data.participants as unknown as Split['participants'],
      payments: data.payments as unknown as Split['payments'],
      sourceTxId: data.source_tx_id || undefined,
      createdAt: data.created_at as unknown as Split['createdAt'],
    });
  };

  load();

  const channel = supabase
    .channel(`split-${splitId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'splits',
        filter: `id=eq.${splitId}`
      },
      (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const row = payload.new as Database['public']['Tables']['splits']['Row'];
          set({
            id: row.id,
            description: row.description,
            totalAmount: row.total_amount,
            date: row.date,
            payerAddress: row.payer_address,
            participants: row.participants as unknown as Split['participants'],
            payments: row.payments as unknown as Split['payments'],
            sourceTxId: row.source_tx_id || undefined,
            createdAt: row.created_at as unknown as Split['createdAt'],
          });
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') console.log('Realtime connected for split', splitId);
    });

  return {
    subscribe,
    refresh: load,
    unsubscribe: () => supabase.removeChannel(channel)
  };
};
