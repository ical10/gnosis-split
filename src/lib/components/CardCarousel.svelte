<script lang="ts">
  import type { Card } from '$lib/types';
  import { CreditCard } from 'lucide-svelte';

  let { cards }: { cards: Card[] } = $props();
  let selectedCardIndex = $state(0);
</script>

<div class="scrollbar-hide mb-6 overflow-x-auto">
  <div class="flex px-4 pb-2">
    {#each cards as card, i}
      <button
        onclick={() => (selectedCardIndex = i)}
        class="relative min-w-[280px] shrink-0 overflow-hidden rounded-2xl border transition-all {selectedCardIndex ===
        i
          ? 'scale-90 border-primary shadow-lg shadow-primary/50'
          : 'scale-80 border-primary/30 opacity-60'} {i === cards.length - 1 ? 'mr-4' : ''}"
      >
        <div class="absolute inset-0 bg-linear-to-br from-black via-card to-black"></div>
        <div
          class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--color-primary)/0.1),transparent_50%)]"
        ></div>
        <div class="relative z-10 p-6">
          <div class="mb-8 flex items-start justify-between">
            <CreditCard class="h-8 w-8 text-primary" />
            <div
              class="border border-primary/50 bg-black/50 px-2 py-1 font-mono text-xs text-primary uppercase"
            >
              {card.type}
            </div>
          </div>
          <div class="space-y-2">
            <div class="font-mono text-xl tracking-wider text-primary">
              •••• {card.last4Digits}
            </div>
            <div class="flex justify-between font-mono text-sm text-muted-foreground">
              <span>{card.cardholderName}</span>
              <span>{card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear % 100}</span>
            </div>
          </div>
        </div>
      </button>
    {/each}
  </div>
</div>
