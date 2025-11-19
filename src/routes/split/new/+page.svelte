<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import { getTransactionById } from '$lib/gnosisPay';
	import { saveSplit } from '$lib/storage';
	import { address } from '$lib/stores/wallet';
	import type { Participant } from '$lib/types';
	import { Plus, X } from 'lucide-svelte';
	import { isAddress, getAddress } from 'viem';
	import { mainnet } from 'viem/chains';
	import { createPublicClient, http } from 'viem';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
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
	let resolving = $state(false);
	let sourceTxId = $state<string | undefined>(undefined);

	onMount(async () => {
		const txId = $page.url.searchParams.get('txId');
		if (txId) {
			try {
				const tx = await getTransactionById(txId);
				if (tx) {
					description = tx.merchant.name;
					amount = (Math.abs(parseInt(tx.amount.value)) / 100).toFixed(2);
					date = new Date(tx.transactionDate).toISOString().split('T')[0];
					sourceTxId = txId;
				}
			} catch (error) {
				console.error('Failed to load transaction:', error);
			}
		}
	});

	function getAvatarUrl(addr: string): string {
		return `https://api.dicebear.com/7.x/identicon/svg?seed=${addr}`;
	}

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
			const splitId = `split_${Date.now()}`;
			const totalCents = Math.round(amountNum * 100);

			saveSplit({
				id: splitId,
				description: description.trim(),
				totalAmount: totalCents,
				date,
				payerAddress: $address,
				participants: calculatedParticipants,
				payments: [],
				sourceTxId
			});

			toast.success('Split created successfully!');
			goto(`/split/${splitId}`);
		} catch (error) {
			console.error('Failed to create split:', error);
			toast.error('Failed to create split');
		} finally {
			loading = false;
		}
	}

	function formatAmount(cents: number): string {
		return `€${(cents / 100).toFixed(2)}`;
	}
</script>

<AuthGuard>
	<div class="min-h-screen bg-zinc-950 pb-24">
		<div class="p-6">
			<h1 class="mb-6 text-2xl font-bold">New Split</h1>

			<div class="space-y-6">
				<div class="space-y-2">
					<Label for="description">Description</Label>
					<Input
						id="description"
						type="text"
						bind:value={description}
						placeholder="e.g. Dinner at Restaurant"
					/>
				</div>

				<div class="space-y-2">
					<Label for="amount">Total Amount (€)</Label>
					<Input id="amount" type="number" step="0.01" bind:value={amount} placeholder="0.00" />
				</div>

				<div class="space-y-2">
					<Label for="date">Date</Label>
					<Input id="date" type="date" bind:value={date} />
				</div>

				<div class="space-y-2">
					<Label for="participant">
						Add Participants <sup class="text-xs font-light text-muted-foreground"
							>*Ethereum mainnet only</sup
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
							class="flex-1"
						/>
						<Button
							onclick={addParticipant}
							disabled={resolving || !newParticipantAddress.trim()}
							size="icon"
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
					<p class="mt-1 text-xs text-muted-foreground">
						Max 10 participants. Enter Ethereum address or ENS name.
					</p>
				</div>

				{#if participants.length > 0}
					<div class="space-y-2">
						<h3 class="text-sm font-medium">Participants ({participants.length})</h3>
						<div class="space-y-2">
							{#each participants as participant, i}
								<Card.Root class="p-3">
									<div class="flex items-center gap-3">
										<Avatar.Root class="h-10 w-10">
											<Avatar.Image src={getAvatarUrl(participant.address)} alt="Avatar" />
											<Avatar.Fallback
												>{participant.address.slice(2, 4).toUpperCase()}</Avatar.Fallback
											>
										</Avatar.Root>
										<div class="flex-1 overflow-hidden">
											{#if participant.name}
												<div class="font-medium">{participant.name}</div>
												<div class="truncate text-xs text-muted-foreground">
													{participant.address}
												</div>
											{:else}
												<div class="truncate text-sm">{participant.address}</div>
											{/if}
										</div>
										<Button onclick={() => removeParticipant(i)} variant="ghost" size="icon-sm">
											<X class="h-4 w-4" />
										</Button>
									</div>
								</Card.Root>
							{/each}
						</div>
					</div>
				{/if}

				{#if calculatedParticipants.length > 0}
					<Card.Root>
						<Card.Header>
							<Card.Title class="text-sm">Split Preview (Equal Split)</Card.Title>
						</Card.Header>
						<Card.Content>
							<div class="space-y-2">
								{#each calculatedParticipants as participant}
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<Avatar.Root class="h-6 w-6">
												<Avatar.Image src={getAvatarUrl(participant.address)} alt="Avatar" />
												<Avatar.Fallback
													>{participant.address.slice(2, 4).toUpperCase()}</Avatar.Fallback
												>
											</Avatar.Root>
											<span class="text-sm">
												{participant.name ||
													`${participant.address.slice(0, 6)}...${participant.address.slice(-4)}`}
											</span>
										</div>
										<span class="font-semibold text-primary"
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
					class="w-full"
				>
					{#if loading}
						Creating Split...
					{:else}
						Create Split
					{/if}
				</Button>
			</div>
		</div>
	</div>
</AuthGuard>
