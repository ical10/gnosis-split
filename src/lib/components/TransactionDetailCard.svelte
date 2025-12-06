<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Copy } from 'lucide-svelte';
  import { formatAmount } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import type { Split } from '$lib/types';

  type Props = {
    split: Split;
  };

  let { split }: Props = $props();

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr);
    toast.success('Address copied!');
  }

  function shortenAddress(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }
</script>

<Card.Root class="mb-6 border-primary bg-linear-to-br from-primary to-primary/80">
  <Card.Content class="p-6">
    <div class="mb-2 text-sm text-primary-foreground/80">Total Amount</div>
    <div class="text-4xl font-bold text-primary-foreground">
      {formatAmount(split.totalAmount)}
    </div>
    <div class="mt-4 text-sm text-primary-foreground/80">
      Paid by: {shortenAddress(split.payerAddress)}
      <Button
        onclick={() => split && copyAddress(split.payerAddress)}
        variant="ghost"
        size="sm"
        class="ml-2 h-auto gap-1 bg-primary-foreground/20 px-2 py-1 hover:bg-primary-foreground/30"
      >
        <Copy class="h-3 w-3" />
      </Button>
    </div>
  </Card.Content>
</Card.Root>
