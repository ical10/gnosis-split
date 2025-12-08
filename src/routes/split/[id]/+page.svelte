<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import { getSplit, updateSplit } from '$lib/storage';
  import { address as walletAddress } from '$lib/stores/wallet';
  import type { Split, Participant } from '$lib/types';
  import { Share2 } from 'lucide-svelte';
  import { formatAmount, formatDate } from '$lib/utils';
  import { getWalletClient } from '@wagmi/core';
  import { parseEther, type Address } from 'viem';
  import { config } from '$lib/appkit';
  import { Button } from '$lib/components/ui/button';
  import { toast } from 'svelte-sonner';
  import { createSplitStore } from '$lib/supabase';
  import { verifyAndMarkXDAIPaid } from '$lib/blockscoutVerifier';
  import SplitParticipantCard from '$lib/components/SplitParticipantCard.svelte';
  import TransactionDetailCard from '$lib/components/TransactionDetailCard.svelte';

  let paying = $state(false);
  let splitStore = $state<ReturnType<typeof createSplitStore> | null>(null);
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE;

  let split = $derived(splitStore ? $splitStore : null);

  onMount(async () => {
    const id = $page.params.id;
    if (!id) {
      goto('/cards');
      return;
    }

    if (USE_SUPABASE === 'true') {
      splitStore = createSplitStore(id, $walletAddress);
    } else {
      const loaded = await getSplit(id, $walletAddress);
      if (!loaded) {
        goto('/splits');
        return;
      }

      splitStore = {
        subscribe: (cb: (value: Split | null) => void) => {
          cb(loaded);
          return () => {};
        },
        refresh: async () => {},
        unsubscribe: async () => {
          return 'ok' as const;
        }
      };
    }
  });

  $effect(() => {
    if (split) {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }

      const check = async () => {
        if (!split) return;

        const id = $page.params.id;
        if (!id) {
          goto('/cards');
          return;
        }

        await verifyAndMarkXDAIPaid(id, split);

        if (USE_SUPABASE !== 'true') {
          const loaded = await getSplit(id, $walletAddress || undefined);
          if (loaded && splitStore) {
            splitStore = {
              subscribe: (cb: (value: Split | null) => void) => {
                cb(loaded);
                return () => {};
              },
              refresh: async () => {},
              unsubscribe: async () => {
                return 'ok' as const;
              }
            };
          }
        }
      };

      check();
      pollInterval = setInterval(check, 20_000);

      return () => {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      };
    }
  });

  onDestroy(() => {
    if (splitStore?.unsubscribe) {
      splitStore.unsubscribe();
    }
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  });

  function isParticipantPaid(participantAddress: string): boolean {
    if (!split) return false;
    return split.payments.some((p) => p.address.toLowerCase() === participantAddress.toLowerCase());
  }

  function getPaymentTxHash(participantAddress: string): string | undefined {
    if (!split) return undefined;
    const payment = split.payments.find(
      (p) => p.address.toLowerCase() === participantAddress.toLowerCase()
    );
    return payment?.txHash;
  }

  function getMyParticipant(): Participant | null {
    if (!split || !$walletAddress) return null;
    return (
      split.participants.find((p) => p.address.toLowerCase() === $walletAddress?.toLowerCase()) ||
      null
    );
  }

  function canPayMyShare(): boolean {
    const myPart = getMyParticipant();
    if (!myPart) return false;
    return !isParticipantPaid(myPart.address);
  }

  async function payMyShare() {
    if (!split || !$walletAddress || !config) return;

    const myPart = getMyParticipant();
    if (!myPart) {
      toast.error('You are not a participant in this split');
      return;
    }

    paying = true;

    try {
      const walletClient = await getWalletClient(config);
      if (!walletClient) {
        toast.error('Please connect your wallet');
        paying = false;
        return;
      }

      const amountInXDAI = parseEther((myPart.amount / 100).toFixed(18));

      const hash = await walletClient.sendTransaction({
        to: split.payerAddress as Address,
        value: amountInXDAI
      });

      await updateSplit(split.id, (s) => ({
        ...s,
        payments: [...s.payments, { address: myPart.address, txHash: hash }]
      }), $walletAddress || undefined);

      if (USE_SUPABASE !== 'true') {
        const loaded = await getSplit(split.id, $walletAddress || undefined);
        if (loaded && splitStore) {
          splitStore = {
            subscribe: (cb: (value: Split | null) => void) => {
              cb(loaded);
              return () => {};
            },
            refresh: async () => {},
            unsubscribe: async () => {
              return 'ok' as const;
            }
          };
        }
      }
      toast.success('Payment successful! 🎉', {
        description: 'Your payment has been recorded on-chain'
      });
    } catch (error: unknown) {
      console.error('Payment failed:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        toast.error('Payment failed', {
          description: (error as { message: string }).message
        });
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } finally {
      paying = false;
    }
  }

  function copyLink() {
    if (!split) return;
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Split link copied!', {
      description: 'Share it with participants'
    });
  }
</script>

<AuthGuard>
  {#if split}
    <div class="min-h-screen bg-zinc-950 pb-24">
      <div class="p-6">
        <div class="mb-6">
          <Button onclick={() => goto('/splits')} variant="ghost" size="sm" class="mb-4 -ml-3">
            ← Back to Splits
          </Button>
          <div class="mb-2 flex items-start justify-between gap-3">
            <div class="flex-1">
              <h1 class="mb-2 text-2xl font-bold">{split.description}</h1>
              <p class="text-muted-foreground">{formatDate(split.date, 'long')}</p>
            </div>
            <Button onclick={copyLink} variant="outline" size="icon" title="Share split link">
              <Share2 class="h-5 w-5" />
            </Button>
          </div>
        </div>

        <TransactionDetailCard {split} />

        <div class="mb-6">
          <h2 class="mb-4 text-lg font-semibold">
            Participants ({split.payments.length}/{split.participants.length} paid)
          </h2>

          <div class="space-y-3">
            {#each split.participants as participant}
              {@const isPaid = isParticipantPaid(participant.address)}
              {@const isMe = $walletAddress?.toLowerCase() === participant.address.toLowerCase()}
              {@const txHash = getPaymentTxHash(participant.address)}
              <SplitParticipantCard {participant} {isPaid} {isMe} {txHash} splitId={split.id} />
            {/each}
          </div>
        </div>

        {#if canPayMyShare()}
          <Button onclick={payMyShare} disabled={paying} size="lg" class="w-full">
            {#if paying}
              Processing Payment...
            {:else}
              Pay My Share ({formatAmount(getMyParticipant()?.amount || 0)})
            {/if}
          </Button>

          <p class="mt-3 text-center text-sm text-muted-foreground">
            Payment will be sent in xDAI on Gnosis Chiado (testnet)
          </p>
        {/if}
      </div>
    </div>
  {/if}
</AuthGuard>
