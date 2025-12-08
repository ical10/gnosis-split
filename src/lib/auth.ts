import { getWalletClient } from "@wagmi/core";
import type { Address } from "viem";

const AUTH_TOKEN_KEY = 'auth_token';

export async function signInWithWallet(address: Address, config: any): Promise<string> {
  try {
    const timestamp = Date.now();
    const message = `Sign in to Gnosis Split\n\nTimestamp: ${timestamp}`;

    const walletClient = await getWalletClient(config, { account: address });
    if (!walletClient) {
      throw new Error('Failed to get wallet client');
    }

    const signature = await walletClient.signMessage({
      message,
      account: address
    });

    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        signature,
        address,
        timestamp
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign-in failed');
    }

    const { token } = await response.json();

    localStorage.setItem(AUTH_TOKEN_KEY, token);

    return token;
  } catch (error) {
    throw error;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
