<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import { getSplit, updateSplit } from '$lib/storage';
  import { address as walletAddress } from '$lib/stores/wallet';
  import type { Split, Participant } from '$lib/types';
  import { CircleCheck, ArrowLeft } from 'lucide-svelte';
  import { getWalletClient } from '@wagmi/core';
  import { parseEther, type Address } from 'viem';
  import { config } from '$lib/appkit';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import * as Avatar from '$lib/components/ui/avatar';
  import { toast } from 'svelte-sonner';

  let split = $state<Split | null>(null);
  let participant = $state<Participant | null>(null);
  let paying = $state(false);
  let isPaid = $state(false);
  let isConnectedParticipant = $state(false);

  onMount(() => {
    loadPayment();
  });

  async function loadPayment() {
    const splitId = $page.params.id;
    const participantAddr = $page.params.participantAddress;

    if (!splitId || !participantAddr) {
      goto('/splits');
      return;
    }

    const loaded = await getSplit(splitId);
    if (!loaded) {
      goto('/splits');
      return;
    }

    split = loaded;

    const foundParticipant = split.participants.find(
      (p) => p.address.toLowerCase() === participantAddr.toLowerCase()
    );

    if (!foundParticipant) {
      goto(`/split/${splitId}`);
      return;
    }

    participant = foundParticipant;
    isPaid = split.payments.some((p) => p.address.toLowerCase() === participantAddr.toLowerCase());
    isConnectedParticipant = $walletAddress?.toLowerCase() === participantAddr.toLowerCase();
  }

  function formatAmount(cents: number): string {
    return `€${(cents / 100).toFixed(2)}`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  function getAvatarUrl(addr: string): string {
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${addr}`;
  }

  function shortenAddress(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  async function payMyShare() {
    if (!split || !participant || !$walletAddress || !config) return;

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

      updateSplit(split.id, (s) => ({
        ...s,
        payments: [...s.payments, { address: participant!.address, txHash: hash }]
      }));

      isPaid = true;
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
    <div class="min-h-screen pb-24">
      <div class="p-6">
        <Button
          onclick={() => split && goto(`/split/${split.id}`)}
          variant="ghost"
          size="sm"
          class="mb-6 -ml-3 gap-2"
        >
          <ArrowLeft class="h-4 w-4" />
          Back to Split
        </Button>

        <div class="mb-6">
          <h1 class="mb-2 text-2xl font-bold">Payment Details</h1>
          <p class="text-muted-foreground">{split.description}</p>
        </div>

        <Card.Root class="mb-6">
          <Card.Content class="p-6">
            <div class="mb-4 flex items-center gap-3">
              <Avatar.Root class="h-16 w-16">
                <Avatar.Image src={getAvatarUrl(participant.address)} alt="Avatar" />
                <Avatar.Fallback>{participant.address.slice(2, 4).toUpperCase()}</Avatar.Fallback>
              </Avatar.Root>
              <div class="flex-1">
                {#if participant.name}
                  <div class="mb-1 text-lg font-medium">{participant.name}</div>
                {/if}
                <div class="text-sm text-muted-foreground">
                  {shortenAddress(participant.address)}
                </div>
              </div>
            </div>

            <div class="mb-4 border-t pt-4">
              <div class="mb-2 text-sm text-muted-foreground">Amount to Pay</div>
              <div class="text-4xl font-bold text-primary">
                {formatAmount(participant.amount)}
              </div>
            </div>

            <div class="border-t pt-4">
              <div class="mb-2 text-sm text-muted-foreground">Pay to</div>
              <div class="text-sm">{shortenAddress(split.payerAddress)}</div>
            </div>
          </Card.Content>
        </Card.Root>

        {#if isPaid}
          <Card.Root class="mb-6 border-primary/50 bg-primary/10">
            <Card.Content class="flex items-center justify-center gap-3 p-6 text-primary">
              <CircleCheck class="h-6 w-6" />
              <span class="text-lg font-semibold">Payment Completed</span>
            </Card.Content>
          </Card.Root>
        {:else if isConnectedParticipant}
          <Button onclick={payMyShare} disabled={paying} size="lg" class="w-full">
            {#if paying}
              Processing Payment...
            {:else}
              Pay My Share ({formatAmount(participant.amount)})
            {/if}
          </Button>

          <p class="mt-3 text-center text-sm text-muted-foreground">
            Payment will be sent in xDAI on Gnosis Chiado (testnet)
          </p>
        {:else}
          <Card.Root class="border-yellow-500/20 bg-yellow-500/10">
            <Card.Content class="p-6 text-center">
              <p class="mb-3 text-yellow-400">
                Connect with the participant's wallet to make payment
              </p>
              <p class="text-sm text-muted-foreground">
                Wallet address: {shortenAddress(participant.address)}
              </p>
            </Card.Content>
          </Card.Root>
        {/if}

        <Card.Root class="mt-6">
          <Card.Header>
            <Card.Title class="text-sm">Split Information</Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Date</span>
                <span>{formatDate(split.date)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Total Amount</span>
                <span>{formatAmount(split.totalAmount)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Participants</span>
                <span>{split.participants.length}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Paid</span>
                <span>{split.payments.length}/{split.participants.length}</span>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  {/if}
</AuthGuard>
