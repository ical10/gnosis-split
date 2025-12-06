<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import { getTransactionById } from '$lib/gnosisPay';
  import { saveSplit } from '$lib/storage';
  import { address } from '$lib/stores/wallet';
  import type { Participant } from '$lib/types';
  import { formatAmount, getAvatarUrl } from '$lib/utils';
  import { Plus, X, ArrowLeft } from 'lucide-svelte';
  import { isAddress, getAddress } from 'viem';
  import { mainnet } from 'viem/chains';
  import { createPublicClient, http } from 'viem';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Card from '$lib/components/ui/card';
  import * as Avatar from '$lib/components/ui/avatar';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { toast } from 'svelte-sonner';

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http()
  });

  let description = $state('');
  let amount = $state('');
  let date = $state(new Date().toISOString().split('T')[0]);
  let participants = $state<Participant[]>([]);
  let newParticipantAddress = $state('');
  let loading = $state(false);
  let loadingTransaction = $state(false);
  let resolving = $state(false);
  let sourceTxId = $state<string | undefined>(undefined);

  onMount(() => {
    const txId = $page.url.searchParams.get('txId');
    if (txId) {
      loadingTransaction = true;
      getTransactionById(txId)
        .then((tx) => {
          if (tx) {
            description = tx.merchant.name;
            amount = (Math.abs(parseInt(tx.amount.value)) / 100).toFixed(2);
            date = new Date(tx.transactionDate).toISOString().split('T')[0];
            sourceTxId = txId;
          }
        })
        .catch((error) => {
          console.error('Failed to load transaction:', error);
        })
        .finally(() => {
          loadingTransaction = false;
        });
    }
  });

  async function addParticipant() {
    if (!newParticipantAddress.trim()) return;

    const input = newParticipantAddress.trim();
    resolving = true;

    try {
      let resolvedAddress: string;

      if (isAddress(input)) {
        resolvedAddress = getAddress(input);
      } else if (input.endsWith('.eth')) {
        const ensAddress = await publicClient.getEnsAddress({ name: input });
        if (!ensAddress) {
          toast.error('ENS name not found');
          resolving = false;
          return;
        }
        resolvedAddress = ensAddress;
      } else {
        toast.error('Invalid address or ENS name');
        resolving = false;
        return;
      }

      if (participants.some((p) => p.address.toLowerCase() === resolvedAddress.toLowerCase())) {
        toast.error('Participant already added');
        resolving = false;
        return;
      }

      if (participants.length >= 10) {
        toast.error('Maximum 10 participants allowed');
        resolving = false;
        return;
      }

      participants = [
        ...participants,
        {
          address: resolvedAddress,
          name: input.endsWith('.eth') ? input : undefined,
          amount: 0
        }
      ];
      newParticipantAddress = '';
    } catch (error) {
      console.error('Failed to resolve address:', error);
      toast.error('Failed to resolve address');
    } finally {
      resolving = false;
    }
  }

  function removeParticipant(index: number) {
    participants = participants.filter((_, i) => i !== index);
  }

  function calculateShares() {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || participants.length === 0) {
      return [];
    }

    const totalCents = Math.round(amountNum * 100);
    const totalPeople = participants.length + 1;
    const shareBase = Math.floor(totalCents / totalPeople);
    const remainder = totalCents % totalPeople;

    return participants.map((p, i) => ({
      ...p,
      amount: shareBase + (i === 0 ? remainder : 0)
    }));
  }

  let calculatedParticipants = $derived(calculateShares());

  async function createSplit() {
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (participants.length === 0) {
      toast.error('Please add at least one participant');
      return;
    }

    if (!$address) {
      toast.error('Wallet not connected');
      return;
    }

    loading = true;

    try {
      const totalCents = Math.round(amountNum * 100);

      const newSplit = await saveSplit({
        description: description.trim(),
        totalAmount: totalCents,
        date,
        payerAddress: $address,
        participants: calculatedParticipants,
        payments: [],
        sourceTxId
      });

      toast.success('Split created successfully!');

      if (!newSplit) {
        throw new Error('Error when creating a new split');
      }

      goto(`/split/${newSplit.id}`);
    } catch (error) {
      console.error('Failed to create split:', error);
      toast.error('Failed to create split');
    } finally {
      loading = false;
    }
  }
</script>

<AuthGuard>
  <div class="min-h-screen bg-black pb-24">
    <div class="p-6">
      <div class="mb-6 flex items-center gap-4 border-b border-primary/20 pb-4">
        <Button
          variant="ghost"
          size="icon"
          onclick={() => window.history.back()}
          class="border border-primary/30 hover:border-primary hover:bg-transparent"
        >
          <ArrowLeft class="h-5 w-5 text-primary" />
        </Button>
        <h1 class="font-mono text-xl font-bold tracking-wider text-primary uppercase">
          [New_Split]
        </h1>
      </div>

      {#if loadingTransaction}
        <div class="space-y-6">
          <div class="space-y-2">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-10 w-full" />
          </div>
          <div class="space-y-2">
            <Skeleton class="h-4 w-32" />
            <Skeleton class="h-10 w-full" />
          </div>
          <div class="space-y-2">
            <Skeleton class="h-4 w-16" />
            <Skeleton class="h-10 w-full" />
          </div>
          <p class="text-center font-mono text-xs text-muted-foreground">
            // Loading transaction details...
          </p>
        </div>
      {:else}
        <div class="space-y-6">
          <div class="space-y-2">
            <Label for="description" class="font-mono text-xs text-primary uppercase"
              >Description</Label
            >
            <Input
              id="description"
              type="text"
              bind:value={description}
              placeholder="e.g. Dinner at Restaurant"
              class="border-primary/30 bg-card/50 font-mono focus:border-primary"
            />
          </div>

          <div class="space-y-2">
            <Label for="amount" class="font-mono text-xs text-primary uppercase"
              >Total Amount ($)</Label
            >
            <Input
              id="amount"
              type="number"
              step="0.01"
              bind:value={amount}
              placeholder="0.00"
              class="border-primary/30 bg-card/50 font-mono focus:border-primary"
            />
          </div>

          <div class="space-y-2">
            <Label for="date" class="font-mono text-xs text-primary uppercase">Date</Label>
            <Input
              id="date"
              type="date"
              bind:value={date}
              class="border-primary/30 bg-card/50 font-mono focus:border-primary"
            />
          </div>

          <div class="space-y-2">
            <Label for="participant" class="font-mono text-xs text-primary uppercase">
              Add Participants <sup class="text-[10px] font-light text-muted-foreground"
                >*Ethereum mainnet only for ENS</sup
              >
            </Label>
            <div class="flex gap-2">
              <Input
                id="participant"
                type="text"
                bind:value={newParticipantAddress}
                placeholder="0x... or vitalik.eth"
                onkeydown={(e) => e.key === 'Enter' && addParticipant()}
                disabled={resolving}
                class="flex-1 border-primary/30 bg-card/50 font-mono focus:border-primary"
              />
              <Button
                onclick={addParticipant}
                disabled={resolving || !newParticipantAddress.trim()}
                size="icon"
                class="border-primary/50 hover:border-primary hover:shadow-primary/30"
              >
                {#if resolving}
                  <div
                    class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
                  ></div>
                {:else}
                  <Plus class="h-5 w-5" />
                {/if}
              </Button>
            </div>
            <p class="mt-1 font-mono text-xs text-muted-foreground">
              // Max 10 participants. Enter Ethereum address or ENS name.
            </p>
          </div>

          {#if participants.length > 0}
            <div class="space-y-2">
              <h3 class="font-mono text-xs font-medium text-primary uppercase">
                Participants ({participants.length})
              </h3>
              <div class="space-y-2">
                {#each participants as participant, i}
                  <Card.Root class="border-primary/20 bg-card/50 p-3">
                    <div class="flex items-center gap-3">
                      <Avatar.Root class="h-10 w-10 border border-primary/30">
                        <Avatar.Image src={getAvatarUrl(participant.address)} alt="Avatar" />
                        <Avatar.Fallback class="bg-card font-mono text-primary"
                          >{participant.address.slice(2, 4).toUpperCase()}</Avatar.Fallback
                        >
                      </Avatar.Root>
                      <div class="flex-1 overflow-hidden">
                        {#if participant.name}
                          <div class="font-mono text-sm font-medium">{participant.name}</div>
                          <div class="truncate font-mono text-xs text-muted-foreground">
                            {participant.address}
                          </div>
                        {:else}
                          <div class="truncate font-mono text-sm">{participant.address}</div>
                        {/if}
                      </div>
                      <Button
                        onclick={() => removeParticipant(i)}
                        variant="ghost"
                        size="icon-sm"
                        class="hover:bg-destructive/20 hover:text-destructive"
                      >
                        <X class="h-4 w-4" />
                      </Button>
                    </div>
                  </Card.Root>
                {/each}
              </div>
            </div>
          {/if}

          {#if calculatedParticipants.length > 0}
            <Card.Root class="border-primary/30 bg-card/50">
              <Card.Header>
                <Card.Title class="font-mono text-sm text-primary uppercase"
                  >[Split Preview - Equal Split]</Card.Title
                >
              </Card.Header>
              <Card.Content>
                <div class="space-y-2">
                  {#each calculatedParticipants as participant}
                    <div
                      class="flex items-center justify-between border-b border-primary/10 pb-2 last:border-0"
                    >
                      <div class="flex items-center gap-2">
                        <Avatar.Root class="h-6 w-6 border border-primary/30">
                          <Avatar.Image src={getAvatarUrl(participant.address)} alt="Avatar" />
                          <Avatar.Fallback class="bg-card font-mono text-[10px] text-primary"
                            >{participant.address.slice(2, 4).toUpperCase()}</Avatar.Fallback
                          >
                        </Avatar.Root>
                        <span class="font-mono text-xs">
                          {participant.name ||
                            `${participant.address.slice(0, 6)}...${participant.address.slice(-4)}`}
                        </span>
                      </div>
                      <span class="font-mono font-semibold text-primary"
                        >{formatAmount(participant.amount)}</span
                      >
                    </div>
                  {/each}
                </div>
              </Card.Content>
            </Card.Root>
          {/if}

          <Button
            onclick={createSplit}
            disabled={loading || !description.trim() || !amount || participants.length === 0}
            size="lg"
            class="w-full border-primary/50 font-mono tracking-wider uppercase shadow-lg shadow-primary/20 hover:border-primary hover:shadow-primary/40"
          >
            {#if loading}
              &gt; Creating_Split...
            {:else}
              &gt; Create_Split
            {/if}
          </Button>
        </div>
      {/if}
    </div>
  </div>
</AuthGuard>
