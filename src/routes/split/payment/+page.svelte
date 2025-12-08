<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import { getSplit, updateSplit } from '$lib/storage';
  import { address as walletAddress } from '$lib/stores/wallet';
  import type { Split, Participant } from '$lib/types';
  import { CircleCheck, ArrowLeft } from 'lucide-svelte';
  import { formatAmount, getAvatarUrl } from '$lib/utils';
  import { getWalletClient } from '@wagmi/core';
  import { parseEther, type Address } from 'viem';
  import { config } from '$lib/appkit';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Avatar from '$lib/components/ui/avatar';
  import { toast } from 'svelte-sonner';

  let split = $state<Split | null>(null);
  let participant = $state<Participant | null>(null);
  let paying = $state(false);
  let isPaid = $state(false);
  let isConnectedParticipant = $state(false);

  onMount(async () => {
    const splitId = $page.url.searchParams.get('splitId');
    const participantAddr = $page.url.searchParams.get('payer');

    if (!splitId || !participantAddr) {
      goto('/splits');
      return;
    }

    const loaded = await getSplit(splitId, $walletAddress || participantAddr);
    if (!loaded) {
      goto('/splits');
      return;
    }

    split = loaded;
    participant =
      loaded.participants.find((p) => p.address.toLowerCase() === participantAddr.toLowerCase()) ||
      null;

    if (!participant) {
      goto(`/split/${splitId}`);
      return;
    }

    isPaid = loaded.payments.some((p) => p.address.toLowerCase() === participantAddr.toLowerCase());
    isConnectedParticipant = $walletAddress?.toLowerCase() === participantAddr.toLowerCase();
  });

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  function shortenAddress(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  async function payShare() {
    if (!split || !participant || !config) return;

    paying = true;

    try {
      const walletClient = await getWalletClient(config);
      if (!walletClient) {
        toast.error('Please connect your wallet');
        paying = false;
        return;
      }

      const amountInXDAI = parseEther((participant.amount / 100).toFixed(18));

      const hash = await walletClient.sendTransaction({
        to: split.payerAddress as Address,
        value: amountInXDAI
      });

      await updateSplit(split.id, (s) => ({
        ...s,
        payments: [...s.payments, { address: participant!.address, txHash: hash }]
      }), $walletAddress || undefined);

      const updated = await getSplit(split.id, $walletAddress || undefined);
      if (updated) {
        split = updated;
        isPaid = true;
      }

      toast.success('Payment successful! 🎉', {
        description: 'Your payment has been recorded on-chain'
      });
    } catch (error: unknown) {
      console.error('Payment failed:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        toast.error('Payment failed', {
          description: (error as { message: string }).message
        });
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } finally {
      paying = false;
    }
  }
</script>

<AuthGuard>
  {#if split && participant}
    <div class="min-h-screen bg-zinc-950 pb-24">
      <div class="p-6">
        <Button
          onclick={() => goto(`/split/${split?.id}`)}
          variant="ghost"
          size="sm"
          class="mb-6 -ml-3"
        >
          <ArrowLeft class="mr-2 h-4 w-4" />
          Back to Split
        </Button>

        <div class="mb-6">
          <h1 class="mb-2 text-2xl font-bold">Payment for {split.description}</h1>
          <p class="text-muted-foreground">{formatDate(split.date)}</p>
        </div>

        <Card.Root class="mb-6">
          <Card.Content class="p-6">
            <div class="mb-6 flex items-center gap-4">
              <Avatar.Root class="h-16 w-16">
                <Avatar.Image src={getAvatarUrl(participant.address)} alt="Avatar" />
                <Avatar.Fallback>{participant.address.slice(2, 4).toUpperCase()}</Avatar.Fallback>
              </Avatar.Root>
              <div class="flex-1">
                {#if participant.name}
                  <div class="mb-1 text-lg font-semibold">{participant.name}</div>
                {/if}
                <div class="text-sm text-muted-foreground">
                  {shortenAddress(participant.address)}
                </div>
              </div>
            </div>

            <div class="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div class="mb-1 text-sm text-muted-foreground">Amount Due</div>
              <div class="text-3xl font-bold text-primary">
                {formatAmount(participant.amount)}
              </div>
            </div>

            <div class="text-sm text-muted-foreground">
              <p class="mb-2">
                <strong>Pay to:</strong>
                {shortenAddress(split.payerAddress)}
              </p>
              <p>Payment will be sent in xDAI on Gnosis Chiado (testnet)</p>
            </div>
          </Card.Content>
        </Card.Root>

        {#if isPaid}
          <Card.Root class="border-primary/50 bg-primary/10">
            <Card.Content class="p-6 text-center">
              <CircleCheck class="mx-auto mb-3 h-12 w-12 text-primary" />
              <h2 class="mb-2 text-xl font-bold text-primary">Payment Complete</h2>
              <p class="text-sm text-muted-foreground">
                This share has already been paid. Thank you!
              </p>
            </Card.Content>
          </Card.Root>
        {:else if isConnectedParticipant}
          <Button onclick={payShare} disabled={paying} size="lg" class="w-full">
            {#if paying}
              Processing Payment...
            {:else}
              Pay {formatAmount(participant.amount)}
            {/if}
          </Button>
        {:else}
          <Card.Root class="border-yellow-500/50 bg-yellow-500/10">
            <Card.Content class="p-6 text-center">
              <h2 class="mb-2 text-lg font-semibold text-yellow-500">Connect Your Wallet</h2>
              <p class="text-sm text-muted-foreground">
                Connect wallet with address {shortenAddress(participant.address)} to pay this share
              </p>
            </Card.Content>
          </Card.Root>
        {/if}
      </div>
    </div>
  {/if}
</AuthGuard>
