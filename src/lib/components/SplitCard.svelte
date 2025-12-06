<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Split } from '$lib/types';
  import { formatAmount, formatDate } from '$lib/utils';
  import { CircleCheck, Clock } from 'lucide-svelte';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';

  let { split, status }: { split: Split; status: { paid: number; total: number } } = $props();

  function handleSplitClick(splitId: string) {
    goto(`/split/${splitId}`);
  }
</script>

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
