<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import { getSplits } from '$lib/storage';
	import type { Split } from '$lib/types';
	import { Receipt, CircleCheck, Clock } from 'lucide-svelte';

	let splits = $state<Split[]>([]);

	onMount(() => {
		loadSplits();
	});

	function loadSplits() {
		splits = getSplits().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	}

	function formatAmount(cents: number): string {
		return `€${(cents / 100).toFixed(2)}`;
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(date);
	}

	function getPaymentStatus(split: Split): { paid: number; total: number } {
		const total = split.participants.length;
		const paid = split.payments.length;
		return { paid, total };
	}

	function handleSplitClick(splitId: string) {
		goto(`/split/${splitId}`);
	}
</script>

<AuthGuard>
	<div class="min-h-screen bg-zinc-950 pb-24">
		<div class="p-6">
			<h1 class="mb-6 text-2xl font-bold">Splits</h1>

			{#if splits.length === 0}
				<div class="mt-12 flex flex-col items-center justify-center text-center">
					<div class="mb-4 rounded-full bg-zinc-900 p-6">
						<Receipt class="h-12 w-12 text-zinc-600" />
					</div>
					<h2 class="mb-2 text-xl font-semibold">No splits yet</h2>
					<p class="mb-6 text-zinc-400">Create your first split from a transaction</p>
					<button
						onclick={() => goto('/cards')}
						class="rounded-lg bg-emerald-500 px-6 py-3 font-semibold transition-colors hover:bg-emerald-600"
					>
						View Transactions
					</button>
				</div>
			{:else}
				<div class="space-y-3">
					{#each splits as split}
						{@const status = getPaymentStatus(split)}
						<button
							onclick={() => handleSplitClick(split.id)}
							class="w-full rounded-xl bg-zinc-900 p-4 text-left shadow-lg transition-all hover:bg-zinc-800"
						>
							<div class="mb-3 flex items-start justify-between">
								<div class="flex-1">
									<h3 class="mb-1 text-lg font-semibold">{split.description}</h3>
									<p class="text-sm text-zinc-400">{formatDate(split.date)}</p>
								</div>
								<div class="text-right">
									<div class="text-xl font-bold text-emerald-400">
										{formatAmount(split.totalAmount)}
									</div>
								</div>
							</div>

							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2 text-sm">
									{#if status.paid === status.total}
										<CircleCheck class="h-4 w-4 text-emerald-500" />
										<span class="text-emerald-500">All paid</span>
									{:else}
										<Clock class="h-4 w-4 text-yellow-500" />
										<span class="text-yellow-500">{status.paid}/{status.total} paid</span>
									{/if}
								</div>
								<div class="text-sm text-zinc-500">{split.participants.length} participants</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</AuthGuard>
