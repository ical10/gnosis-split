<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import { getSplit, updateSplit } from '$lib/storage';
  import { address as walletAddress } from '$lib/stores/wallet';
  import type { Split, Participant } from '$lib/types';
  import { CircleCheck, Clock, Copy, ExternalLink, QrCode, Share2 } from 'lucide-svelte';
  import { generateQRCode } from '$lib/utils';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import { getWalletClient } from '@wagmi/core';
  import { parseEther, type Address } from 'viem';
  import { config } from '$lib/appkit';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import * as Avatar from '$lib/components/ui/avatar';
  import { toast } from 'svelte-sonner';
  import { createSplitStore } from '$lib/supabase';
  import { verifyAndMarkXDAIPaid } from '$lib/blockscoutVerifier';

  let paying = $state(false);
  let showQr = $state<string | null>(null);
  let splitStore = $state<ReturnType<typeof createSplitStore> | null>(null);
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE;

  let split = $derived(splitStore ? $splitStore : null);

  onMount(async () => {
    const id = $page.params.id;
    if (!id) {
      goto('/cards');
      return;
    }

    if (USE_SUPABASE === 'true') {
      splitStore = createSplitStore(id);
    } else {
      const loaded = await getSplit(id);
      if (!loaded) {
        goto('/splits');
        return;
      }

      splitStore = {
        subscribe: (cb: (value: Split | null) => void) => {
          cb(loaded);
          return () => {};
        },
        refresh: async () => {},
        unsubscribe: async () => {
          return 'ok' as const;
        }
      };
    }
  });

  $effect(() => {
    if (split) {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }

      const check = async () => {
        if (!split) return;

        const id = $page.params.id;
        if (!id) {
          goto('/cards');
          return;
        }

        await verifyAndMarkXDAIPaid(id, split);

        if (USE_SUPABASE !== 'true') {
          const loaded = await getSplit(id);
          if (loaded && splitStore) {
            splitStore = {
              subscribe: (cb: (value: Split | null) => void) => {
                cb(loaded);
                return () => {};
              },
              refresh: async () => {},
              unsubscribe: async () => {
                return 'ok' as const;
              }
            };
          }
        }
      };

      check();
      pollInterval = setInterval(check, 20_000);

      return () => {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      };
    }
  });

  onDestroy(() => {
    if (splitStore?.unsubscribe) {
      splitStore.unsubscribe();
    }
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  });

  function formatAmount(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
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

  function isParticipantPaid(participantAddress: string): boolean {
    if (!split) return false;
    return split.payments.some((p) => p.address.toLowerCase() === participantAddress.toLowerCase());
  }

  function getPaymentTxHash(participantAddress: string): string | undefined {
    if (!split) return undefined;
    const payment = split.payments.find(
      (p) => p.address.toLowerCase() === participantAddress.toLowerCase()
    );
    return payment?.txHash;
  }

  function getBlockscoutTxUrl(txHash: string): string {
    const explorerBase = import.meta.env.VITE_BLOCKSCOUT_EXPLORER;
    return `${explorerBase}/tx/${txHash}`;
  }

  function getMyParticipant(): Participant | null {
    if (!split || !$walletAddress) return null;
    return (
      split.participants.find((p) => p.address.toLowerCase() === $walletAddress?.toLowerCase()) ||
      null
    );
  }

  function canPayMyShare(): boolean {
    const myPart = getMyParticipant();
    if (!myPart) return false;
    return !isParticipantPaid(myPart.address);
  }

  async function payMyShare() {
    if (!split || !$walletAddress || !config) return;

    const myPart = getMyParticipant();
    if (!myPart) {
      toast.error('You are not a participant in this split');
      return;
    }

    paying = true;

    try {
      const walletClient = await getWalletClient(config);
      if (!walletClient) {
        toast.error('Please connect your wallet');
        paying = false;
        return;
      }

      const amountInXDAI = parseEther((myPart.amount / 100).toFixed(18));

      const hash = await walletClient.sendTransaction({
        to: split.payerAddress as Address,
        value: amountInXDAI
      });

      await updateSplit(split.id, (s) => ({
        ...s,
        payments: [...s.payments, { address: myPart.address, txHash: hash }]
      }));

      if (USE_SUPABASE !== 'true') {
        const loaded = await getSplit(split.id);
        if (loaded && splitStore) {
          splitStore = {
            subscribe: (cb: (value: Split | null) => void) => {
              cb(loaded);
              return () => {};
            },
            refresh: async () => {},
            unsubscribe: async () => {
              return 'ok' as const;
            }
          };
        }
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

  function copyLink() {
    if (!split) return;
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Split link copied!', {
      description: 'Share it with participants'
    });
  }

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr);
    toast.success('Address copied!');
  }

  function getPaymentUrl(participantAddress: string): string {
    if (!split) return '';
    return `/split/${split.id}/payment/${participantAddress}`;
  }

  function shortenAddress(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }
</script>

<AuthGuard>
  {#if split}
    <div class="min-h-screen bg-zinc-950 pb-24">
      <div class="p-6">
        <div class="mb-6">
          <Button onclick={() => goto('/splits')} variant="ghost" size="sm" class="mb-4 -ml-3">
            ← Back to Splits
          </Button>
          <div class="mb-2 flex items-start justify-between gap-3">
            <div class="flex-1">
              <h1 class="mb-2 text-2xl font-bold">{split.description}</h1>
              <p class="text-muted-foreground">{formatDate(split.date)}</p>
            </div>
            <Button onclick={copyLink} variant="outline" size="icon" title="Share split link">
              <Share2 class="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Card.Root class="mb-6 border-primary bg-gradient-to-br from-primary to-primary/80">
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

        <div class="mb-6">
          <h2 class="mb-4 text-lg font-semibold">
            Participants ({split.payments.length}/{split.participants.length} paid)
          </h2>

          <div class="space-y-3">
            {#each split.participants as participant}
              {@const isPaid = isParticipantPaid(participant.address)}
              {@const isMe = $walletAddress?.toLowerCase() === participant.address.toLowerCase()}
              <Card.Root>
                <Card.Content class="p-4">
                  <div class="flex items-center gap-3">
                    <Avatar.Root class="h-12 w-12">
                      <Avatar.Image src={getAvatarUrl(participant.address)} alt="Avatar" />
                      <Avatar.Fallback
                        >{participant.address.slice(2, 4).toUpperCase()}</Avatar.Fallback
                      >
                    </Avatar.Root>
                    <div class="flex-1 overflow-hidden">
                      <div class="flex items-center gap-2">
                        {#if participant.name}
                          <div class="font-medium">{participant.name}</div>
                        {/if}
                        {#if isMe}
                          <Badge variant="secondary" class="bg-primary/20 text-primary">You</Badge>
                        {/if}
                      </div>
                      <div class="truncate text-sm text-muted-foreground">
                        {shortenAddress(participant.address)}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="mb-1 text-lg font-bold text-primary">
                        {formatAmount(participant.amount)}
                      </div>
                      {#if isPaid}
                        {@const txHash = getPaymentTxHash(participant.address)}
                        {#if txHash}
                          <a
                            href={getBlockscoutTxUrl(txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Badge
                              variant="default"
                              class="gap-1 bg-primary/20 text-primary hover:bg-primary/30"
                            >
                              <CircleCheck class="h-3 w-3" />
                              Paid
                              <ExternalLink class="h-3 w-3" />
                            </Badge>
                          </a>
                        {:else}
                          <Badge variant="default" class="gap-1 bg-primary/20 text-primary">
                            <CircleCheck class="h-3 w-3" />
                            Paid
                          </Badge>
                        {/if}
                      {:else}
                        <Badge variant="secondary" class="gap-1 bg-yellow-500/20 text-yellow-500">
                          <Clock class="h-3 w-3" />
                          Unpaid
                        </Badge>
                      {/if}
                    </div>
                  </div>

                  {#if !isPaid && !isMe}
                    <div class="mt-3 flex gap-2">
                      <Button
                        onclick={() =>
                          (showQr = showQr === participant.address ? null : participant.address)}
                        variant="outline"
                        size="sm"
                        class="flex-1 gap-1"
                      >
                        <QrCode class="h-4 w-4" />
                        QR Code
                      </Button>
                      <Button href={getPaymentUrl(participant.address)} variant="outline" size="sm">
                        View Payment
                      </Button>
                    </div>

                    {#if showQr === participant.address}
                      {#await generateQRCode(`${window.location.origin}${getPaymentUrl(participant.address)}`)}
                        <Card.Root class="mt-3 bg-background">
                          <Card.Content class="p-4 text-center">
                            <Spinner class="mx-auto h-8 w-8" />
                          </Card.Content>
                        </Card.Root>
                      {:then qrDataUrl}
                        <Card.Root class="mt-3 bg-white">
                          <Card.Content class="p-4">
                            <h2 class="mb-3 text-center font-bold text-zinc-900">
                              Scan to pay {formatAmount(participant.amount)}
                            </h2>
                            <img src={qrDataUrl} alt="Payment QR Code" class="mx-auto h-48 w-48" />
                            <div class="mt-3 text-center">
                              <div class="mb-2 text-xs break-all text-zinc-600">
                                {window.location.origin}{getPaymentUrl(participant.address)}
                              </div>
                              <Button
                                onclick={() => {
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}${getPaymentUrl(participant.address)}`
                                  );
                                  toast.success('Payment link copied!');
                                }}
                                variant="secondary"
                                size="sm"
                                class="gap-1"
                              >
                                <Copy class="h-3 w-3" />
                                Copy Link
                              </Button>
                            </div>
                          </Card.Content>
                        </Card.Root>
                      {:catch error}
                        <Card.Root class="mt-3 bg-destructive/10">
                          <Card.Content class="p-4 text-center text-sm text-destructive">
                            Failed to generate QR code
                          </Card.Content>
                        </Card.Root>
                      {/await}
                    {/if}
                  {/if}
                </Card.Content>
              </Card.Root>
            {/each}
          </div>
        </div>

        {#if canPayMyShare()}
          <Button onclick={payMyShare} disabled={paying} size="lg" class="w-full">
            {#if paying}
              Processing Payment...
            {:else}
              Pay My Share ({formatAmount(getMyParticipant()?.amount || 0)})
            {/if}
          </Button>

          <p class="mt-3 text-center text-sm text-muted-foreground">
            Payment will be sent in xDAI on Gnosis Chiado (testnet)
          </p>
        {/if}
      </div>
    </div>
  {/if}
</AuthGuard>
