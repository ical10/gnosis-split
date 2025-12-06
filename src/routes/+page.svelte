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
    <div class="mb-8 flex items-center justify-center gap-2">
      <div class="h-px w-12 bg-linear-to-r from-transparent to-primary"></div>
      <div class="text-xs tracking-widest text-primary uppercase">BUILD ON PUBLIC</div>
      <div class="h-px w-12 bg-linear-to-l from-transparent to-primary"></div>
    </div>

    <h1 class="mb-4 text-4xl font-bold tracking-tight text-primary">
      <span class="font-mono">[GNOSIS_SPLIT]</span>
    </h1>
    <p class="mb-8 font-mono text-sm text-muted-foreground">
      // Split expenses. Get reimbursed on-chain.
    </p>

    <Button
      onclick={() => appKit?.open()}
      size="lg"
      class="animate-flicker-slow border-primary/50 px-8 py-6 font-mono tracking-wider uppercase shadow-lg shadow-primary/20 transition-all hover:border-primary hover:shadow-primary/40"
    >
      &gt; Connect_Wallet
    </Button>

    <div class="mt-12 space-y-3 font-mono text-xs text-muted-foreground">
      <p class="flex items-center justify-center gap-2">
        <span class="text-primary">[01]</span> Link_Safe_Account
      </p>
      <p class="flex items-center justify-center gap-2">
        <span class="text-primary">[02]</span> Split_Bills_P2P
      </p>
      <p class="flex items-center justify-center gap-2">
        <span class="text-primary">[03]</span> On_Chain_Settlement
      </p>
    </div>

    <div class="mt-8 border border-primary/20 bg-card/50 p-4">
      <p class="font-mono text-xs text-secondary">
        WARNING: Experimental app. Use at your own risk.
      </p>
    </div>
  </div>
</div>
