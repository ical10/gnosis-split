import { writable } from 'svelte/store';
import type { Split } from './types';

export const createSplitStore = (splitId: string, userAddress?: string) => {
  const { subscribe, set } = writable<Split | null>(null);

  if (import.meta.env.VITE_USE_SUPABASE !== 'true') {
    return { subscribe, refresh: async () => { }, unsubscribe: () => { } };
  }

  const load = async () => {
    try {
      const url = userAddress ? `/api/splits/${splitId}?address=${encodeURIComponent(userAddress)}` : `/api/splits/${splitId}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Failed to load split');
        return;
      }
      const split = await response.json();
      set(split);
    } catch (error) {
      console.error('Failed to load split:', error);
    }
  };

  load();

  return {
    subscribe,
    refresh: load,
    unsubscribe: () => { }
  };
};
