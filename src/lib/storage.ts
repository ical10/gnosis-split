import { browser } from '$app/environment';
import type { Split, Participant } from './types';
import { getAuthToken } from './auth';

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';
const STORAGE_KEY = 'gnosisSplits';
const API_BASE = '/api/splits';

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) {
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`
  };
}

function getHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...additionalHeaders
  };
}

export async function getSplits(userAddress?: string): Promise<Split[]> {
  if (!USE_SUPABASE) {
    if (!browser) return [];

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const splits = data ? JSON.parse(data) : [];
      if (userAddress) {
        return splits.filter((s: Split) => s.payerAddress.toLowerCase() === userAddress.toLowerCase());
      }
      return splits;
    } catch (error) {
      console.error('Failed to load splits:', error);
      return [];
    }
  } else {
    try {
      const url = userAddress ? `${API_BASE}?address=${encodeURIComponent(userAddress)}` : API_BASE;
      const response = await fetch(url, {
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', response.status, errorData);
        throw new Error(`Failed to fetch splits: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to load splits:', error);
      return [];
    }
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

  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(split)
  });

  if (!response.ok) throw new Error('Failed to create split');
  return await response.json();
}

export async function getSplit(id: string, userAddress?: string): Promise<Split | undefined> {
  if (!USE_SUPABASE) {
    const splits = await getSplits(userAddress);
    return splits.find((s) => s.id === id);
  }

  try {
    const url = userAddress ? `${API_BASE}/${id}?address=${encodeURIComponent(userAddress)}` : `${API_BASE}/${id}`;
    const response = await fetch(url, {
      headers: getHeaders()
    });
    if (!response.ok) return undefined;
    return await response.json();
  } catch (error) {
    console.error('Failed to load split:', error);
    return undefined;
  }
}

export async function updateSplit(id: string, updater: (split: Split) => Split, userAddress?: string): Promise<void> {
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
    const split = await getSplit(id, userAddress);
    if (!split) return;

    const updated = updater(split);
    const url = userAddress ? `${API_BASE}/${id}?address=${encodeURIComponent(userAddress)}` : `${API_BASE}/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updated)
    });

    if (!response.ok) throw new Error('Failed to update split');
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
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete split');
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

  const response = await fetch(`${API_BASE}/${splitId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ participants })
  });

  if (!response.ok) {
    console.error('Failed to update participants');
    throw new Error('Failed to update participants');
  }
}
