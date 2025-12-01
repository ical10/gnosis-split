import { browser } from '$app/environment';
import type { Split, Participant } from './types';
import { supabase } from './supabase';

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';
const STORAGE_KEY = 'gnosisSplits';

export async function getSplits(): Promise<Split[]> {
  if (!USE_SUPABASE) {
    if (!browser) return [];

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load splits:', error);
      return [];
    }
  } else {
    const { data, error } = await supabase
      .from('splits')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error("Error when getting splits: ", error);
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      description: row.description,
      totalAmount: row.total_amount,
      date: row.date,
      payerAddress: row.payer_address,
      participants: row.participants as unknown as Split['participants'],
      payments: row.payments as unknown as Split['payments'],
      createdAt: row.created_at as unknown as Split['createdAt'],
      sourceTxId: row.source_tx_id || undefined
    }));
  }
}

export async function saveSplit(split: Omit<Split, 'id' | 'createdAt'>): Promise<Split | undefined> {
  if (!USE_SUPABASE) {
    if (!browser) return;

    try {
      const splits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const newSplit = { ...split, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      splits.push(newSplit);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(splits));
      return newSplit;
    } catch (error) {
      console.error("Failed to save split: ", error);
      throw error;
    }
  }

  const { data, error } = await supabase
    .from('splits')
    .insert({
      description: split.description,
      total_amount: split.totalAmount,
      date: split.date,
      payer_address: split.payerAddress,
      participants: split.participants as any,
      payments: split.payments as any,
      source_tx_id: split.sourceTxId
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    description: data.description,
    totalAmount: data.total_amount,
    date: data.date,
    payerAddress: data.payer_address,
    participants: data.participants as unknown as Split['participants'],
    payments: data.payments as unknown as Split['payments'],
    createdAt: data.created_at as unknown as Split['createdAt'],
    sourceTxId: data.source_tx_id || undefined
  };
}

export async function getSplit(id: string): Promise<Split | undefined> {
  if (!USE_SUPABASE) {
    const splits = await getSplits();
    return splits.find((s) => s.id === id);
  }

  const { data, error } = await supabase
    .from('splits')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return undefined;

  const { id: foundId, description, total_amount, date, payer_address, participants, payments, created_at, source_tx_id } = data;

  const foundSplit = {
    id: foundId,
    description,
    totalAmount: total_amount,
    date,
    payerAddress: payer_address,
    participants: participants as unknown as Split['participants'],
    payments: payments as unknown as Split['payments'],
    createdAt: created_at as unknown as Split['createdAt'],
    sourceTxId: source_tx_id || undefined,
  }

  return foundSplit;
}

export async function updateSplit(id: string, updater: (split: Split) => Split): Promise<void> {
  if (!USE_SUPABASE) {
    if (!browser) return;

    try {
      const splits = await getSplits();
      const index = splits.findIndex((s) => s.id === id);

      if (index >= 0) {
        splits[index] = updater(splits[index]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(splits));
      }
    } catch (error) {
      console.error('Failed to update split:', error);
      throw error;
    }
  } else {
    const split = await getSplit(id);
    if (!split) return;

    const updated = updater(split);
    const { error } = await supabase
      .from('splits')
      .update({
        description: updated.description,
        total_amount: updated.totalAmount,
        date: updated.date,
        payer_address: updated.payerAddress,
        participants: updated.participants as any,
        payments: updated.payments as any,
        source_tx_id: updated.sourceTxId
      })
      .eq('id', id);

    if (error) throw error;
  }
}

export async function deleteSplit(id: string): Promise<void> {
  if (!USE_SUPABASE) {
    if (!browser) return;

    try {
      const splits = await getSplits();
      const filtered = splits.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete split:', error);
      throw error;
    }
  } else {
    const { error } = await supabase.from('splits').delete().eq('id', id);
    if (error) throw error;
  }
}

export async function updateSplitParticipants(splitId: string, participants: Participant[]) {
  if (!USE_SUPABASE) {

    if (!browser) return;

    try {
      const splits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const idx = splits.findIndex((s: Split) => s.id === splitId);
      if (idx >= 0) {
        splits[idx].participants = participants;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(splits));
      }
      return;
    } catch (error) {
      console.error("Failed when updating split participants: ", error);
      throw error;
    }
  }

  const { error } = await supabase
    .from('splits')
    .update({ participants: participants as any })
    .eq('id', splitId);

  if (error) {
    console.error('Failed to update participants', error);
    throw error;
  }
}
