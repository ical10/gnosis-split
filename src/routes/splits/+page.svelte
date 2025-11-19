<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import { getSplits } from '$lib/storage';
	import type { Split } from '$lib/types';
	import { Receipt, CircleCheck, Clock } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

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
					<div class="bg-muted mb-4 rounded-full p-6">
						<Receipt class="text-muted-foreground h-12 w-12" />
					</div>
					<h2 class="mb-2 text-xl font-semibold">No splits yet</h2>
					<p class="text-muted-foreground mb-6">Create your first split from a transaction</p>
					<Button onclick={() => goto('/cards')} size="lg">View Transactions</Button>
				</div>
			{:else}
				<div class="space-y-3">
					{#each splits as split}
						{@const status = getPaymentStatus(split)}
						<Card.Root
							class="hover:bg-accent cursor-pointer transition-all"
							onclick={() => handleSplitClick(split.id)}
						>
							<Card.Content class="p-4">
								<div class="mb-3 flex items-start justify-between">
									<div class="flex-1">
										<h3 class="mb-1 text-lg font-semibold">{split.description}</h3>
										<p class="text-muted-foreground text-sm">{formatDate(split.date)}</p>
									</div>
									<div class="text-right">
										<div class="text-primary text-xl font-bold">
											{formatAmount(split.totalAmount)}
										</div>
									</div>
								</div>

								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2 text-sm">
										{#if status.paid === status.total}
											<Badge variant="default" class="bg-primary/20 text-primary gap-1">
												<CircleCheck class="h-3 w-3" />
												All paid
											</Badge>
										{:else}
											<Badge variant="secondary" class="gap-1 bg-yellow-500/20 text-yellow-500">
												<Clock class="h-3 w-3" />
												{status.paid}/{status.total} paid
											</Badge>
										{/if}
									</div>
									<div class="text-muted-foreground text-sm">
										{split.participants.length} participants
									</div>
								</div>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</AuthGuard>
