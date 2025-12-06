<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Transaction } from '$lib/types';
  import { formatAmount } from '$lib/utils';
  import { ArrowRight } from 'lucide-svelte';
  import * as CardUI from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';

  let { tx }: { tx: Transaction } = $props();

  function handleSplit() {
    goto(`/split/new?txId=${tx.id}`);
  }

  function formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short'
    }).format(new Date(dateStr));
  }
</script>

<CardUI.Root
  class="border-primary/20 bg-card/50 transition-all hover:border-primary/40 hover:shadow-sm hover:shadow-primary/20"
>
  <CardUI.Content class="p-4">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="mb-1 flex items-center gap-2">
          <div class="font-mono text-sm font-semibold">{tx.merchant.name}</div>
          {#if tx.status === 'PENDING'}
            <Badge
              variant="secondary"
              class="border-yellow-500/30 bg-yellow-500/10 font-mono text-[10px] text-yellow-500 uppercase"
            >
              Pending
            </Badge>
          {/if}
        </div>
        <div class="mb-2 font-mono text-xs text-muted-foreground">
          {#if tx.merchant.city}{tx.merchant.city},
          {/if}{tx.merchant.country}
          <span class="text-primary/50">•</span>
          {formatDate(tx.transactionDate)}
        </div>
        {#if parseInt(tx.cashbackAmount.value) > 0}
          <div class="font-mono text-xs text-primary">
            +{formatAmount(tx.cashbackAmount.value)} cashback
          </div>
        {/if}
      </div>
      <div class="flex flex-col items-end gap-2">
        <div class="font-mono text-lg font-bold text-destructive">
          {formatAmount(tx.amount.value)}
        </div>
        <Button
          variant="outline"
          onclick={handleSplit}
          size="sm"
          class="gap-1 border-primary/50 font-mono text-xs uppercase hover:border-primary hover:text-primary hover:shadow-primary/30"
        >
          Split
          <ArrowRight class="h-3 w-3" />
        </Button>
      </div>
    </div>
  </CardUI.Content>
</CardUI.Root>
