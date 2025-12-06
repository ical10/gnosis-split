<script lang="ts">
  import type { Participant } from '$lib/types';
  import { CircleCheck, Clock, Copy, ExternalLink, QrCode } from 'lucide-svelte';
  import { generateQRCode, formatAmount, getAvatarUrl } from '$lib/utils';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Avatar from '$lib/components/ui/avatar';
  import { toast } from 'svelte-sonner';

  let {
    participant,
    isPaid,
    isMe,
    txHash,
    splitId
  }: {
    participant: Participant;
    isPaid: boolean;
    isMe: boolean;
    txHash?: string;
    splitId?: string;
  } = $props();

  let showQr = $state<boolean>(false);

  function getBlockscoutTxUrl(hash: string): string {
    const explorerBase =
      import.meta.env.VITE_BLOCKSCOUT_EXPLORER || 'https://gnosis-chiado.blockscout.com';
    return `${explorerBase}/tx/${hash}`;
  }

  function getPaymentUrl(participantAddress: string): string {
    if (!splitId) return '';
    return `/split/payment?splitId=${splitId}&payer=${participantAddress}`;
  }

  function shortenAddress(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }
</script>

<Card.Root>
  <Card.Content class="p-4">
    <div class="flex items-center gap-3">
      <Avatar.Root class="h-12 w-12">
        <Avatar.Image src={getAvatarUrl(participant.address)} alt="Avatar" />
        <Avatar.Fallback>{participant.address.slice(2, 4).toUpperCase()}</Avatar.Fallback>
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
          {#if txHash}
            <a href={getBlockscoutTxUrl(txHash)} target="_blank" rel="noopener noreferrer">
              <Badge variant="default" class="gap-1 bg-primary/20 text-primary hover:bg-primary/30">
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

    {#if !isPaid && !isMe && splitId}
      <div class="mt-3 flex gap-2">
        <Button onclick={() => (showQr = !showQr)} variant="outline" size="sm" class="flex-1 gap-1">
          <QrCode class="h-4 w-4" />
          QR Code
        </Button>
        <Button
          href={getPaymentUrl(participant.address)}
          variant="outline"
          size="sm"
          class="flex-1"
        >
          View Payment
        </Button>
      </div>

      {#if showQr}
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
