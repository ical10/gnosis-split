<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import { getSplits } from '$lib/storage';
  import { address } from '$lib/stores/wallet';
  import type { Split } from '$lib/types';
  import { getPaymentStatus } from '$lib/utils';
  import { Button } from '$lib/components/ui/button';
  import { Receipt } from 'lucide-svelte';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import SplitCard from '$lib/components/SplitCard.svelte';

  let splits = $state<Split[]>([]);
  let loading = $state(false);

  onMount(() => {
    loadSplits();
  });

  async function loadSplits() {
    loading = true;
    try {
      const allSplits = await getSplits($address);
      splits = allSplits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error when fetching splits:', error);
    } finally {
      loading = false;
    }
  }
</script>

<AuthGuard>
  <div class="min-h-screen pb-24">
    <div class="p-6">
      <h1
        class="mb-6 border-b border-primary/20 pb-4 font-mono text-xl font-bold tracking-wider text-primary uppercase"
      >
        [Splits]
      </h1>

      {#if loading}
        <div class="space-y-3">
          {#each Array(5) as _}
            <Skeleton class="h-24 rounded-xl" />
          {/each}
        </div>
      {:else if splits.length === 0}
        <div class="mt-12 flex flex-col items-center justify-center text-center">
          <div class="mb-4 border border-primary/30 bg-card/50 p-6">
            <Receipt class="h-12 w-12 text-primary/50" />
          </div>
          <h2 class="mb-2 font-mono text-lg font-semibold text-primary uppercase">
            No_Splits_Found
          </h2>
          <p class="mb-6 font-mono text-xs text-muted-foreground">
            // Create your first split from a transaction
          </p>
          <Button
            onclick={() => goto('/cards')}
            size="lg"
            class="border-primary/50 font-mono uppercase hover:border-primary hover:shadow-primary/30"
          >
            &gt; View_Transactions
          </Button>
        </div>
      {:else}
        <div class="space-y-3">
          {#each splits as split}
            {@const status = getPaymentStatus(split)}
            <SplitCard {split} {status} />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</AuthGuard>
