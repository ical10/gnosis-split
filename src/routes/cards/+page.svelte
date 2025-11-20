<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import { getCards, getTransactions } from '$lib/gnosisPay';
  import type { Card, Transaction } from '$lib/types';
  import { CreditCard, ExternalLink, ArrowRight } from 'lucide-svelte';
  import { hideAppkitButton } from '$lib/stores/ui';
  import { Button } from '$lib/components/ui/button';
  import * as CardUI from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Skeleton } from '$lib/components/ui/skeleton';

  let cards: Card[] = $state([]);
  let transactions: Transaction[] = $state([]);
  let selectedCardIndex = $state(0);
  let loading = $state(true);

  let recentTransactionsRef = $state<HTMLDivElement>();

  onMount(async () => {
    try {
      const [cardsData, txData] = await Promise.all([getCards(), getTransactions()]);
      cards = cardsData;
      transactions = txData;
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      loading = false;
    }
  });

  $effect(() => {
    if (!recentTransactionsRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isSticky = entry.boundingClientRect.top <= 0;
        hideAppkitButton.set(isSticky);
      },
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
    );

    observer.observe(recentTransactionsRef);

    return () => {
      observer.disconnect();
      hideAppkitButton.set(false);
    };
  });

  function formatAmount(cents: string): string {
    const num = parseInt(cents);
    const euros = Math.abs(num) / 100;
    return `€${euros.toFixed(2)}`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  }

  function handleSplit(txId: string) {
    goto(`/split/new?txId=${txId}`);
  }
</script>

<AuthGuard>
  <div class="min-h-screen bg-zinc-950 pb-24">
    <div class="p-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold">Cards</h1>
        <Button href="https://gnosispay.com" variant="outline" size="sm" class="gap-1">
          Get Card
          <ExternalLink class="h-3 w-3" />
        </Button>
      </div>

      <div class="px-6 pb-6">
        {#if loading}
          <div class="space-y-4">
            <Skeleton class="h-48 rounded-2xl" />
            {#each Array(5) as _}
              <Skeleton class="h-20 rounded-xl" />
            {/each}
          </div>
        {:else}
          <div class="scrollbar-hide mb-6 overflow-x-auto">
            <div class="flex px-4 pb-2">
              {#each cards as card, i}
                <button
                  onclick={() => (selectedCardIndex = i)}
                  class="relative min-w-[280px] flex-shrink-0 overflow-hidden rounded-2xl shadow-xl transition-all {selectedCardIndex ===
                  i
                    ? 'scale-90 ring-2 ring-primary'
                    : 'scale-80 opacity-60'} {i === cards.length - 1 ? 'mr-4' : ''}"
                  style="background-image: url('/credit-card-background-hd.png'); background-size: cover; background-position: center;"
                >
                  <div
                    class="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40"
                    style="box-shadow: inset 0 0 60px rgba(255, 255, 255, 0.1);"
                  ></div>
                  <div class="relative z-10 p-6">
                    <div class="mb-8 flex items-start justify-between">
                      <CreditCard class="h-8 w-8 text-white drop-shadow-lg" />
                      <div
                        class="rounded bg-white/20 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm"
                      >
                        {card.type}
                      </div>
                    </div>
                    <div class="space-y-2">
                      <div class="font-mono text-xl tracking-wider text-white drop-shadow-lg">
                        •••• {card.last4Digits}
                      </div>
                      <div class="flex justify-between text-sm text-white/90 drop-shadow">
                        <span>{card.cardholderName}</span>
                        <span
                          >{card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear %
                            100}</span
                        >
                      </div>
                    </div>
                  </div>
                </button>
              {/each}
            </div>
          </div>

          <div
            bind:this={recentTransactionsRef}
            class="sticky top-0 z-20 mb-4 flex items-center justify-between bg-zinc-950 pt-4 pb-2"
          >
            <h2 class="text-lg font-semibold">Recent Transactions</h2>
            <div class="text-sm text-zinc-500">{transactions.length} total</div>
          </div>

          <div class="scrollbar-hide space-y-3 overflow-y-auto">
            {#each transactions as tx}
              <CardUI.Root>
                <CardUI.Content class="p-4">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="mb-1 flex items-center gap-2">
                        <div class="font-semibold">{tx.merchant.name}</div>
                        {#if tx.status === 'PENDING'}
                          <Badge variant="secondary" class="bg-yellow-500/20 text-yellow-500">
                            Pending
                          </Badge>
                        {/if}
                      </div>
                      <div class="mb-2 text-sm text-muted-foreground">
                        {#if tx.merchant.city}{tx.merchant.city},
                        {/if}{tx.merchant.country}
                        • {formatDate(tx.transactionDate)}
                      </div>
                      {#if parseInt(tx.cashbackAmount.value) > 0}
                        <div class="text-xs text-primary">
                          +{formatAmount(tx.cashbackAmount.value)} cashback
                        </div>
                      {/if}
                    </div>
                    <div class="flex flex-col items-end gap-2">
                      <div class="text-lg font-bold text-red-400">
                        {formatAmount(tx.amount.value)}
                      </div>
                      <Button
                        variant="outline"
                        onclick={() => handleSplit(tx.id)}
                        size="sm"
                        class="gap-1"
                      >
                        Split
                        <ArrowRight class="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardUI.Content>
              </CardUI.Root>
            {/each}
          </div>

          <CardUI.Root class="mt-6 bg-muted/50">
            <CardUI.Content class="p-4 text-center text-sm text-muted-foreground">
              <p>
                Mock mode active. Real Gnosis Pay cards require KYC at
                <a
                  href="https://gnosispay.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary hover:underline">gnosispay.com</a
                >
              </p>
            </CardUI.Content>
          </CardUI.Root>
        {/if}
      </div>
    </div>
  </div>
</AuthGuard>
