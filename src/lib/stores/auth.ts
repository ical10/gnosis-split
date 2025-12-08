import { writable } from 'svelte/store';
import { address } from './wallet';
import { signInWithWallet, getAuthToken, clearAuth } from '$lib/auth';
import { config } from '$lib/appkit';
import type { Address } from 'viem';

let lastAddress: Address | string | null = null;

export const isAuthenticated = writable(false);
export const isSigningIn = writable(false);
export const signInError = writable<string | null>(null);

export async function attemptSignIn(walletAddress: Address | string) {
  try {
    isSigningIn.set(true);
    signInError.set(null);

    if (!config) {
      throw new Error('Wagmi config not initialized. Please refresh the page.');
    }

    await signInWithWallet(walletAddress as Address, config);

    isAuthenticated.set(true);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign-in failed';
    signInError.set(message);
  } finally {
    isSigningIn.set(false);
  }
}

export function checkAuthStatus() {
  const token = getAuthToken();
  isAuthenticated.set(!!token);
}

if (typeof window !== 'undefined') {
  checkAuthStatus();
}

address.subscribe(async ($address) => {
  if (lastAddress && lastAddress !== $address) {
    clearAuth();
    isAuthenticated.set(false);
    signInError.set(null);
  }

  if (!$address) {
    clearAuth();
    isAuthenticated.set(false);
    signInError.set(null);
    lastAddress = null;
    return;
  }

  lastAddress = $address;

  let currentlyAuthenticated = false;
  const unsubscribe = isAuthenticated.subscribe(value => {
    currentlyAuthenticated = value;
  });
  unsubscribe();

  if (!currentlyAuthenticated) {
    await attemptSignIn($address);
  }
});
