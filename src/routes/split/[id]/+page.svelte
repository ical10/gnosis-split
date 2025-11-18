<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import { getSplit, updateSplit } from '$lib/storage';
	import { address as walletAddress } from '$lib/stores/wallet';
	import type { Split, Participant } from '$lib/types';
	import { CircleCheck, Clock, ExternalLink, Copy, QrCode } from 'lucide-svelte';
	import { getWalletClient } from '@wagmi/core';
	import { parseUnits, encodeFunctionData, type Address } from 'viem';
	import { config } from '$lib/appkit';

	const EURE_ADDRESS = '0xcB444e90D8198415266c6a2724b7900fb12FC56E';
	const ERC20_ABI = [
		{
			name: 'transfer',
			type: 'function',
			stateMutability: 'nonpayable',
			inputs: [
				{ name: 'to', type: 'address' },
				{ name: 'amount', type: 'uint256' }
			],
			outputs: [{ type: 'bool' }]
		}
	] as const;

	let split = $state<Split | null>(null);
	let paying = $state(false);
	let showQr = $state<string | null>(null);

	onMount(() => {
		loadSplit();
	});

	function loadSplit() {
		const id = $page.params.id;
		const loaded = getSplit(id);
		if (!loaded) {
			goto('/splits');
			return;
		}
		split = loaded;
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

	function isParticipantPaid(participantAddress: string): boolean {
		if (!split) return false;
		return split.payments.some((p) => p.address.toLowerCase() === participantAddress.toLowerCase());
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
		if (!split || !$walletAddress) return;

		const myPart = getMyParticipant();
		if (!myPart) {
			alert('You are not a participant in this split');
			return;
		}

		paying = true;

		try {
			const walletClient = await getWalletClient(config);
			if (!walletClient) {
				alert('Please connect your wallet');
				paying = false;
				return;
			}

			const amountInEURe = parseUnits((myPart.amount / 100).toFixed(18), 18);

			const hash = await walletClient.sendTransaction({
				to: EURE_ADDRESS as Address,
				data: encodeFunctionData({
					abi: ERC20_ABI,
					functionName: 'transfer',
					args: [split.payerAddress as Address, amountInEURe]
				})
			});

			updateSplit(split.id, (s) => ({
				...s,
				payments: [...s.payments, { address: myPart.address, txHash: hash }]
			}));

			loadSplit();
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

	function copyAddress(addr: string) {
		navigator.clipboard.writeText(addr);
		alert('Address copied!');
	}

	function getGnosisScanUrl(participantAddress: string): string {
		if (!split) return '';
		const amount = split.participants.find((p) => p.address === participantAddress)?.amount || 0;
		const amountInEURe = (amount / 100).toFixed(18);
		return `https://gnosisscan.io/address/${split.payerAddress}`;
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
					<button
						onclick={() => goto('/splits')}
						class="mb-4 text-sm text-zinc-400 hover:text-white"
					>
						← Back to Splits
					</button>
					<h1 class="mb-2 text-2xl font-bold">{split.description}</h1>
					<p class="text-zinc-400">{formatDate(split.date)}</p>
				</div>

				<div
					class="mb-6 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 shadow-xl"
				>
					<div class="mb-2 text-sm text-white/80">Total Amount</div>
					<div class="text-4xl font-bold text-white">{formatAmount(split.totalAmount)}</div>
					<div class="mt-4 text-sm text-white/80">
						Paid by: {shortenAddress(split.payerAddress)}
						<button
							onclick={() => copyAddress(split.payerAddress)}
							class="ml-2 inline-flex items-center gap-1 rounded bg-white/20 px-2 py-1 transition-colors hover:bg-white/30"
						>
							<Copy class="h-3 w-3" />
						</button>
					</div>
				</div>

				<div class="mb-6">
					<h2 class="mb-4 text-lg font-semibold">
						Participants ({split.payments.length}/{split.participants.length} paid)
					</h2>

					<div class="space-y-3">
						{#each split.participants as participant}
							{@const isPaid = isParticipantPaid(participant.address)}
							{@const isMe = $walletAddress?.toLowerCase() === participant.address.toLowerCase()}
							<div class="rounded-xl bg-zinc-900 p-4">
								<div class="flex items-center gap-3">
									<img
										src={getAvatarUrl(participant.address)}
										alt="Avatar"
										class="h-12 w-12 rounded-full"
									/>
									<div class="flex-1 overflow-hidden">
										<div class="flex items-center gap-2">
											{#if participant.name}
												<div class="font-medium">{participant.name}</div>
											{/if}
											{#if isMe}
												<span
													class="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400"
												>
													You
												</span>
											{/if}
										</div>
										<div class="truncate text-sm text-zinc-400">
											{shortenAddress(participant.address)}
										</div>
									</div>
									<div class="text-right">
										<div class="mb-1 text-lg font-bold text-emerald-400">
											{formatAmount(participant.amount)}
										</div>
										{#if isPaid}
											<div class="flex items-center gap-1 text-xs text-emerald-500">
												<CircleCheck class="h-4 w-4" />
												Paid
											</div>
										{:else}
											<div class="flex items-center gap-1 text-xs text-yellow-500">
												<Clock class="h-4 w-4" />
												Unpaid
											</div>
										{/if}
									</div>
								</div>

								{#if !isPaid && !isMe}
									<div class="mt-3 flex gap-2">
										<button
											onclick={() =>
												(showQr = showQr === participant.address ? null : participant.address)}
											class="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm transition-colors hover:bg-zinc-700"
										>
											<QrCode class="mr-1 inline h-4 w-4" />
											QR Code
										</button>
										<a
											href={getGnosisScanUrl(participant.address)}
											target="_blank"
											rel="noopener noreferrer"
											class="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm transition-colors hover:bg-zinc-700"
										>
											View
											<ExternalLink class="h-3 w-3" />
										</a>
									</div>

									{#if showQr === participant.address}
										<div class="mt-3 rounded-lg bg-white p-4 text-center">
											<div class="text-sm text-zinc-900">
												QR code would display here<br />
												(Payment link to GnosisScan)
											</div>
										</div>
									{/if}
								{/if}
							</div>
						{/each}
					</div>
				</div>

				{#if canPayMyShare()}
					<button
						onclick={payMyShare}
						disabled={paying}
						class="w-full rounded-lg bg-emerald-500 px-6 py-4 text-lg font-semibold transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if paying}
							Processing Payment...
						{:else}
							Pay My Share ({formatAmount(getMyParticipant()?.amount || 0)})
						{/if}
					</button>

					<p class="mt-3 text-center text-sm text-zinc-500">
						Payment will be sent in EURe on Gnosis Chain
					</p>
				{/if}
			</div>
		</div>
	{/if}
</AuthGuard>
