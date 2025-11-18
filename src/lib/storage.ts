import { browser } from '$app/environment';
import type { Split } from './types';

const STORAGE_KEY = 'gnosisSplits';

export function getSplits(): Split[] {
	if (!browser) return [];

	try {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch (error) {
		console.error('Failed to load splits:', error);
		return [];
	}
}

export function saveSplit(split: Split): void {
	if (!browser) return;

	try {
		const splits = getSplits();
		const existingIndex = splits.findIndex((s) => s.id === split.id);

		if (existingIndex >= 0) {
			splits[existingIndex] = split;
		} else {
			splits.push(split);
		}

		localStorage.setItem(STORAGE_KEY, JSON.stringify(splits));
	} catch (error) {
		console.error('Failed to save split:', error);
		throw error;
	}
}

export function getSplit(id: string): Split | undefined {
	return getSplits().find((s) => s.id === id);
}

export function updateSplit(id: string, updater: (split: Split) => Split): void {
	if (!browser) return;

	try {
		const splits = getSplits();
		const index = splits.findIndex((s) => s.id === id);

		if (index >= 0) {
			splits[index] = updater(splits[index]);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(splits));
		}
	} catch (error) {
		console.error('Failed to update split:', error);
		throw error;
	}
}

export function deleteSplit(id: string): void {
	if (!browser) return;

	try {
		const splits = getSplits().filter((s) => s.id !== id);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(splits));
	} catch (error) {
		console.error('Failed to delete split:', error);
		throw error;
	}
}
