<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import { getSplits } from '$lib/storage';
  import type { Split } from '$lib/types';
  import { Receipt, CircleCheck, Clock } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';

  let splits = $state<Split[]>([]);

  onMount(() => {
    loadSplits();
  });

  async function loadSplits() {
    const allSplits = await getSplits();
    splits = allSplits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  function formatAmount(cents: number): string {
    return `€${(cents / 100).toFixed(2)}`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  function getPaymentStatus(split: Split): { paid: number; total: number } {
    const total = split.participants.length;
    const paid = split.payments.length;
    return { paid, total };
  }

  function handleSplitClick(splitId: string) {
    goto(`/split/${splitId}`);
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

      {#if splits.length === 0}
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
            <Card.Root
              class="cursor-pointer border-primary/20 bg-card/50 transition-all hover:border-primary/40 hover:shadow-sm hover:shadow-primary/20"
              onclick={() => handleSplitClick(split.id)}
            >
              <Card.Content class="p-4">
                <div class="mb-3 flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="mb-1 font-mono text-sm font-semibold">{split.description}</h3>
                    <p class="font-mono text-xs text-muted-foreground">{formatDate(split.date)}</p>
                  </div>
                  <div class="text-right">
                    <div class="font-mono text-lg font-bold text-primary">
                      {formatAmount(split.totalAmount)}
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-sm">
                    {#if status.paid === status.total}
                      <Badge
                        variant="default"
                        class="gap-1 border-primary/30 bg-primary/10 font-mono text-[10px] text-primary uppercase"
                      >
                        <CircleCheck class="h-3 w-3" />
                        All_Paid
                      </Badge>
                    {:else}
                      <Badge
                        variant="secondary"
                        class="gap-1 border-yellow-500/30 bg-yellow-500/10 font-mono text-[10px] text-yellow-500 uppercase"
                      >
                        <Clock class="h-3 w-3" />
                        {status.paid}/{status.total}_Paid
                      </Badge>
                    {/if}
                  </div>
                  <div class="font-mono text-xs text-muted-foreground">
                    {split.participants.length} participants
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</AuthGuard>
