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

	let split = $state<Split | null>(null);
	let participant = $state<Participant | null>(null);
	let paying = $state(false);
	let isPaid = $state(false);
	let isConnectedParticipant = $state(false);

	onMount(() => {
		loadPayment();
	});

	function loadPayment() {
		const splitId = $page.params.id;
		const participantAddr = $page.params.participantAddress;

		if (!splitId || !participantAddr) {
			goto('/splits');
			return;
		}

		const loaded = getSplit(splitId);
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
				alert('Please connect your wallet');
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
			alert('Payment successful! 🎉');
		} catch (error: unknown) {
			console.error('Payment failed:', error);
			if (error && typeof error === 'object' && 'message' in error) {
				alert(`Payment failed: ${(error as { message: string }).message}`);
			} else {
				alert('Payment failed. Please try again.');
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
				<button
					onclick={() => goto(`/split/${split.id}`)}
					class="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
				>
					<ArrowLeft class="h-4 w-4" />
					Back to Split
				</button>

				<div class="mb-6">
					<h1 class="mb-2 text-2xl font-bold">Payment Details</h1>
					<p class="text-zinc-400">{split.description}</p>
				</div>

				<div class="mb-6 rounded-xl bg-zinc-900 p-6">
					<div class="mb-4 flex items-center gap-3">
						<img
							src={getAvatarUrl(participant.address)}
							alt="Avatar"
							class="h-16 w-16 rounded-full"
						/>
						<div class="flex-1">
							{#if participant.name}
								<div class="mb-1 text-lg font-medium">{participant.name}</div>
							{/if}
							<div class="text-sm text-zinc-400">
								{shortenAddress(participant.address)}
							</div>
						</div>
					</div>

					<div class="mb-4 border-t border-zinc-800 pt-4">
						<div class="mb-2 text-sm text-zinc-400">Amount to Pay</div>
						<div class="text-4xl font-bold text-emerald-400">
							{formatAmount(participant.amount)}
						</div>
					</div>

					<div class="border-t border-zinc-800 pt-4">
						<div class="mb-2 text-sm text-zinc-400">Pay to</div>
						<div class="text-sm">{shortenAddress(split.payerAddress)}</div>
					</div>
				</div>

				{#if isPaid}
					<div
						class="mb-6 flex items-center justify-center gap-3 rounded-xl bg-emerald-500/20 p-6 text-emerald-400"
					>
						<CircleCheck class="h-6 w-6" />
						<span class="text-lg font-semibold">Payment Completed</span>
					</div>
				{:else if isConnectedParticipant}
					<button
						onclick={payMyShare}
						disabled={paying}
						class="w-full rounded-lg bg-emerald-500 px-6 py-4 text-lg font-semibold transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if paying}
							Processing Payment...
						{:else}
							Pay My Share ({formatAmount(participant.amount)})
						{/if}
					</button>

					<p class="mt-3 text-center text-sm text-zinc-500">
						Payment will be sent in xDAI on Gnosis Chiado (testnet)
					</p>
				{:else}
					<div class="rounded-xl bg-yellow-500/10 p-6 text-center">
						<p class="mb-3 text-yellow-400">
							Connect with the participant's wallet to make payment
						</p>
						<p class="text-sm text-zinc-400">
							Wallet address: {shortenAddress(participant.address)}
						</p>
					</div>
				{/if}

				<div class="mt-6 rounded-xl bg-zinc-900 p-4">
					<div class="mb-2 text-sm font-medium text-zinc-400">Split Information</div>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-zinc-500">Date</span>
							<span>{formatDate(split.date)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-zinc-500">Total Amount</span>
							<span>{formatAmount(split.totalAmount)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-zinc-500">Participants</span>
							<span>{split.participants.length}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-zinc-500">Paid</span>
							<span>{split.payments.length}/{split.participants.length}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</AuthGuard>
