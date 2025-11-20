<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { isConnected } from '$lib/stores/wallet';
  import { appKit } from '$lib/appkit';
  import { Button } from '$lib/components/ui/button';

  onMount(() => {
    const unsubscribe = isConnected.subscribe((connected) => {
      if (connected) {
        goto('/cards');
      }
    });

    return unsubscribe;
  });
</script>

<div class="flex min-h-[80vh] flex-col items-center justify-center p-6">
  <div class="max-w-md text-center">
    <h1 class="mb-4 text-4xl font-bold">Gnosis Split</h1>
    <p class="mb-8 text-lg text-muted-foreground">Split expenses and get reimbursed on-chain</p>

    <Button onclick={() => appKit?.open()} size="lg" class="px-8 py-4 text-lg">
      Connect Wallet
    </Button>

    <div class="mt-8 space-y-2 text-sm text-muted-foreground">
      <p>💳 Link your Gnosis Pay card</p>
      <p>👥 Split bills with friends</p>
      <p>⛓️ Get paid on-chain in stablecoins</p>
    </div>
  </div>
</div>
