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
					alert('ENS name not found');
					resolving = false;
					return;
				}
				resolvedAddress = ensAddress;
			} else {
				alert('Invalid address or ENS name');
				resolving = false;
				return;
			}

			if (participants.some((p) => p.address.toLowerCase() === resolvedAddress.toLowerCase())) {
				alert('Participant already added');
				resolving = false;
				return;
			}

			if (participants.length >= 10) {
				alert('Maximum 10 participants allowed');
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
			alert('Failed to resolve address');
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
			alert('Please enter a description');
			return;
		}

		const amountNum = parseFloat(amount);
		if (isNaN(amountNum) || amountNum <= 0) {
			alert('Please enter a valid amount');
			return;
		}

		if (participants.length === 0) {
			alert('Please add at least one participant');
			return;
		}

		if (!$address) {
			alert('Wallet not connected');
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

			goto(`/split/${splitId}`);
		} catch (error) {
			console.error('Failed to create split:', error);
			alert('Failed to create split');
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
				<div>
					<label for="description" class="mb-2 block text-sm font-medium">Description</label>
					<input
						id="description"
						type="text"
						bind:value={description}
						placeholder="e.g. Dinner at Restaurant"
						class="w-full rounded-lg bg-zinc-900 px-4 py-3 ring-1 ring-zinc-800 transition-all outline-none focus:ring-2 focus:ring-emerald-500"
					/>
				</div>

				<div>
					<label for="amount" class="mb-2 block text-sm font-medium">Total Amount (€)</label>
					<input
						id="amount"
						type="number"
						step="0.01"
						bind:value={amount}
						placeholder="0.00"
						class="w-full rounded-lg bg-zinc-900 px-4 py-3 ring-1 ring-zinc-800 transition-all outline-none focus:ring-2 focus:ring-emerald-500"
					/>
				</div>

				<div>
					<label for="date" class="mb-2 block text-sm font-medium">Date</label>
					<input
						id="date"
						type="date"
						bind:value={date}
						class="w-full rounded-lg bg-zinc-900 px-4 py-3 ring-1 ring-zinc-800 transition-all outline-none focus:ring-2 focus:ring-emerald-500"
					/>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium"
						>Add Participants <sup class="text-xs font-light text-gray-400"
							>*Ethereum mainnet only</sup
						></label
					>
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={newParticipantAddress}
							placeholder="0x... or vitalik.eth"
							onkeydown={(e) => e.key === 'Enter' && addParticipant()}
							disabled={resolving}
							class="flex-1 rounded-lg bg-zinc-900 px-4 py-3 ring-1 ring-zinc-800 transition-all outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
						/>
						<button
							onclick={addParticipant}
							disabled={resolving || !newParticipantAddress.trim()}
							class="rounded-lg bg-emerald-500 px-4 py-3 font-semibold transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if resolving}
								<div
									class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
								></div>
							{:else}
								<Plus class="h-5 w-5" />
							{/if}
						</button>
					</div>
					<p class="mt-1 text-xs text-zinc-500">
						Max 10 participants. Enter Ethereum address or ENS name.
					</p>
				</div>

				{#if participants.length > 0}
					<div>
						<h3 class="mb-3 text-sm font-medium">Participants ({participants.length})</h3>
						<div class="space-y-2">
							{#each participants as participant, i}
								<div class="flex items-center gap-3 rounded-lg bg-zinc-900 p-3">
									<img
										src={getAvatarUrl(participant.address)}
										alt="Avatar"
										class="h-10 w-10 rounded-full"
									/>
									<div class="flex-1 overflow-hidden">
										{#if participant.name}
											<div class="font-medium">{participant.name}</div>
											<div class="truncate text-xs text-zinc-500">{participant.address}</div>
										{:else}
											<div class="truncate text-sm">{participant.address}</div>
										{/if}
									</div>
									<button
										onclick={() => removeParticipant(i)}
										class="rounded-lg p-2 transition-colors hover:bg-zinc-800"
									>
										<X class="h-4 w-4 text-zinc-400" />
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if calculatedParticipants.length > 0}
					<div class="rounded-xl bg-zinc-900 p-4">
						<h3 class="mb-3 text-sm font-medium">Split Preview (Equal Split)</h3>
						<div class="space-y-2">
							{#each calculatedParticipants as participant}
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<img
											src={getAvatarUrl(participant.address)}
											alt="Avatar"
											class="h-6 w-6 rounded-full"
										/>
										<span class="text-sm">
											{participant.name ||
												`${participant.address.slice(0, 6)}...${participant.address.slice(-4)}`}
										</span>
									</div>
									<span class="font-semibold text-emerald-400"
										>{formatAmount(participant.amount)}</span
									>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<button
					onclick={createSplit}
					disabled={loading || !description.trim() || !amount || participants.length === 0}
					class="w-full rounded-lg bg-emerald-500 px-6 py-4 text-lg font-semibold transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading}
						Creating Split...
					{:else}
						Create Split
					{/if}
				</button>
			</div>
		</div>
	</div>
</AuthGuard>
