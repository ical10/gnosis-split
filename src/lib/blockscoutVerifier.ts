import type { Split } from './types';
import { updateSplit } from './storage';

const BASE = import.meta.env.VITE_BLOCKSCOUT_BASE;

interface BlockscoutTransaction {
  hash: string;
  value: string;
  from: {
    hash: string;
  };
  to: {
    hash: string;
  };
  timestamp: string;
}

interface BlockscoutResponse {
  items: BlockscoutTransaction[];
  next_page_params?: Record<string, string>;
}

export async function verifyAndMarkXDAIPaid(splitId: string, split: Split) {
  if (!BASE) {
    console.warn('VITE_BLOCKSCOUT_BASE not configured, skipping verification');
    return;
  }

  const payerSafe = split.payerAddress.toLowerCase();
  let url = `${BASE}/addresses/${payerSafe}/transactions?filter=to`;

  const seenTxHashes = new Set(split.payments.map((p) => p.txHash).filter(Boolean));

  const newPayments = [...split.payments];
  let changed = false;

  try {
    while (url) {
      const resp = await fetch(url);
      if (!resp.ok) {
        console.error('Blockscout API error:', resp.status, resp.statusText);
        break;
      }

      const json: BlockscoutResponse = await resp.json();

      for (const tx of json.items) {
        if (seenTxHashes.has(tx.hash)) continue;

        if (!tx.value || tx.value === '0') continue;

        const valueWei = BigInt(tx.value);
        const from = tx.from.hash.toLowerCase();

        const participant = split.participants.find((p) => {
          const participantAddr = p.address.toLowerCase();
          const isMatch = participantAddr === from;
          const notYetPaid = !newPayments.some(
            (pay) => pay.address.toLowerCase() === participantAddr
          );
          const expectedWei = BigInt(p.amount) * 10n ** 16n;
          const amountMatches = expectedWei === valueWei;

          return isMatch && notYetPaid && amountMatches;
        });

        if (participant) {
          newPayments.push({
            address: participant.address,
            txHash: tx.hash
          });
          seenTxHashes.add(tx.hash);
          changed = true;
        }
      }

      url = json.next_page_params
        ? `${BASE}/addresses/${payerSafe}/transactions?${new URLSearchParams(json.next_page_params).toString()}`
        : '';
    }

    if (changed) {
      await updateSplit(splitId, (s) => ({
        ...s,
        payments: newPayments
      }));
    }
  } catch (error) {
    console.error('Blockscout verification error:', error);
  }
}
