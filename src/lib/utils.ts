import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Snippet } from 'svelte';
import QRCode from 'qrcode';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type WithElementRef<T> = T & { ref?: any };
export type WithoutChildren<T> = Omit<T, 'children'> & { children?: Snippet };

export async function generateQRCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('QR code generation failed:', error);
    throw error;
  }
}

export function formatAmount(cents: number | string): string {
  const num = typeof cents === 'string' ? parseInt(cents) : cents;
  return `$${(Math.abs(num) / 100).toFixed(2)}`;
}

export function formatDate(dateStr: string, format: 'short' | 'long' = 'short'): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: format === 'short' ? 'short' : 'long',
    year: 'numeric'
  }).format(date);
}

export function getAvatarUrl(addr: string): string {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${addr}`;
}

export function getPaymentStatus(split: { participants: any[]; payments: any[] }): {
  paid: number;
  total: number;
} {
  const total = split.participants.length;
  const paid = split.payments.length;
  return { paid, total };
}
