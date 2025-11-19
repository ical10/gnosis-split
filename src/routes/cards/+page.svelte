<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import { getCards, getTransactions } from '$lib/gnosisPay';
	import type { Card, Transaction } from '$lib/types';
	import { CreditCard, ExternalLink, ArrowRight } from 'lucide-svelte';
	import { hideAppkitButton } from '$lib/stores/ui';
	import { Button } from '$lib/components/ui/button';
	import * as CardUI from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let cards: Card[] = $state([]);
	let transactions: Transaction[] = $state([]);
	let selectedCardIndex = $state(0);
	let loading = $state(true);

	let recentTransactionsRef = $state<HTMLDivElement>();

	onMount(async () => {
		try {
			const [cardsData, txData] = await Promise.all([getCards(), getTransactions()]);
			cards = cardsData;
			transactions = txData;
		} catch (error) {
			console.error('Failed to load data:', error);
		} finally {
			loading = false;
		}
	});

	$effect(() => {
		if (!recentTransactionsRef) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				const isSticky = entry.boundingClientRect.top <= 0;
				hideAppkitButton.set(isSticky);
			},
			{ threshold: [1], rootMargin: '-1px 0px 0px 0px' }
		);

		observer.observe(recentTransactionsRef);

		return () => {
			observer.disconnect();
			hideAppkitButton.set(false);
		};
	});

	function formatAmount(cents: string): string {
		const num = parseInt(cents);
		const euros = Math.abs(num) / 100;
		return `€${euros.toFixed(2)}`;
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-GB', {
			day: 'numeric',
			month: 'short'
		}).format(date);
	}

	function handleSplit(txId: string) {
		goto(`/split/new?txId=${txId}`);
	}
</script>

<AuthGuard>
	<div class="min-h-screen bg-zinc-950 pb-24">
		<div class="p-6">
			<div class="mb-6 flex items-center justify-between">
				<h1 class="text-2xl font-bold">Cards</h1>
				<Button href="https://gnosispay.com" variant="outline" size="sm" class="gap-1">
					Get Card
					<ExternalLink class="h-3 w-3" />
				</Button>
			</div>

			<div class="px-6 pb-6">
				{#if loading}
					<div class="space-y-4">
						<Skeleton class="h-48 rounded-2xl" />
						{#each Array(5) as _}
							<Skeleton class="h-20 rounded-xl" />
						{/each}
					</div>
				{:else}
					<div class="scrollbar-hide mb-6 overflow-x-auto">
						<div class="flex gap-4 pb-2">
							{#each cards as card, i}
								<button
									onclick={() => (selectedCardIndex = i)}
									class="relative min-w-[280px] overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 shadow-xl transition-all {selectedCardIndex ===
									i
										? 'scale-105 ring-2 ring-emerald-400'
										: 'scale-95 opacity-60'}"
								>
									<div class="mb-8 flex items-start justify-between">
										<CreditCard class="h-8 w-8 text-white" />
										<div class="rounded bg-white/20 px-2 py-1 text-xs font-semibold text-white">
											{card.type}
										</div>
									</div>
									<div class="space-y-2">
										<div class="font-mono text-xl tracking-wider text-white">
											•••• {card.last4Digits}
										</div>
										<div class="flex justify-between text-sm text-white/90">
											<span>{card.cardholderName}</span>
											<span
												>{card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear %
													100}</span
											>
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>

					<div
						bind:this={recentTransactionsRef}
						class="sticky top-0 z-20 mb-4 flex items-center justify-between bg-zinc-950 pt-4 pb-2"
					>
						<h2 class="text-lg font-semibold">Recent Transactions</h2>
						<div class="text-sm text-zinc-500">{transactions.length} total</div>
					</div>

					<div class="scrollbar-hide space-y-3 overflow-y-auto">
						{#each transactions as tx}
							<CardUI.Root class="hover:bg-accent transition-all">
								<CardUI.Content class="p-4">
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<div class="mb-1 flex items-center gap-2">
												<div class="font-semibold">{tx.merchant.name}</div>
												{#if tx.status === 'PENDING'}
													<Badge variant="secondary" class="bg-yellow-500/20 text-yellow-500">
														Pending
													</Badge>
												{/if}
											</div>
											<div class="text-muted-foreground mb-2 text-sm">
												{#if tx.merchant.city}{tx.merchant.city},
												{/if}{tx.merchant.country}
												• {formatDate(tx.transactionDate)}
											</div>
											{#if parseInt(tx.cashbackAmount.value) > 0}
												<div class="text-primary text-xs">
													+{formatAmount(tx.cashbackAmount.value)} cashback
												</div>
											{/if}
										</div>
										<div class="flex flex-col items-end gap-2">
											<div class="text-lg font-bold text-red-400">
												{formatAmount(tx.amount.value)}
											</div>
											<Button
												variant="outline"
												onclick={() => handleSplit(tx.id)}
												size="sm"
												class="gap-1"
											>
												Split
												<ArrowRight class="h-3 w-3" />
											</Button>
										</div>
									</div>
								</CardUI.Content>
							</CardUI.Root>
						{/each}
					</div>

					<CardUI.Root class="bg-muted/50 mt-6">
						<CardUI.Content class="text-muted-foreground p-4 text-center text-sm">
							<p>
								Mock mode active. Real Gnosis Pay cards require KYC at
								<a
									href="https://gnosispay.com"
									target="_blank"
									rel="noopener noreferrer"
									class="text-primary hover:underline">gnosispay.com</a
								>
							</p>
						</CardUI.Content>
					</CardUI.Root>
				{/if}
			</div>
		</div>
	</div>
</AuthGuard>
