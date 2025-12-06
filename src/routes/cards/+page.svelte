<script lang="ts">
  import { onMount } from 'svelte';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import { getCards, getTransactions } from '$lib/gnosisPay';
  import type { Card, Transaction } from '$lib/types';
  import { ExternalLink } from 'lucide-svelte';
  import { hideAppkitButton } from '$lib/stores/ui';
  import { Button } from '$lib/components/ui/button';
  import * as CardUI from '$lib/components/ui/card';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import CardCarousel from '$lib/components/CardCarousel.svelte';
  import TransactionItem from '$lib/components/TransactionItem.svelte';

  let cards: Card[] = $state([]);
  let transactions: Transaction[] = $state([]);
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
</script>

<AuthGuard>
  <div class="min-h-screen bg-black pb-24">
    <div class="p-6">
      <div class="mb-6 flex items-center justify-between border-b border-primary/20 pb-4">
        <h1 class="font-mono text-xl font-bold tracking-wider text-primary uppercase">[Cards]</h1>
        <Button
          href="https://gnosispay.com"
          variant="outline"
          size="sm"
          class="gap-1 border-primary/50 font-mono text-xs uppercase hover:border-primary hover:shadow-primary/30"
        >
          Get_Card
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
          <CardCarousel {cards} />

          <div
            bind:this={recentTransactionsRef}
            class="sticky top-0 z-20 mb-4 flex items-center justify-between border-b border-primary/20 bg-black pt-4 pb-2"
          >
            <h2 class="font-mono text-sm font-semibold tracking-wider text-primary uppercase">
              [Transactions]
            </h2>
            <div class="font-mono text-xs text-muted-foreground">{transactions.length} total</div>
          </div>

          <div class="scrollbar-hide space-y-3 overflow-y-auto">
            {#each transactions as tx}
              <TransactionItem {tx} />
            {/each}
          </div>

          <CardUI.Root class="mt-6 border-primary/20 bg-card/50">
            <CardUI.Content class="p-4 text-center font-mono text-xs text-muted-foreground">
              <p>
                <span class="text-primary">[MOCK_MODE]</span> Real cards require KYC at
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
