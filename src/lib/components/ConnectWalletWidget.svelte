<script>
	import { address, isConnected, selectedNetworkId } from '$lib/stores/wallet';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
</script>

<div class="p-6">
	<div class="mt-6 space-y-2">
		<div class="rounded-lg bg-zinc-900 p-4">
			<p class="text-sm text-zinc-400">Connection Status:</p>
			<p class="font-semibold">
				{#if $isConnected}
					<span class="inline-flex items-center gap-1 text-emerald-400">
						<Check class="h-4 w-4" /> Connected
					</span>
				{:else}
					<span class="inline-flex items-center gap-1 text-zinc-500">
						<X class="h-4 w-4" /> Not Connected
					</span>
				{/if}
			</p>
		</div>

		{#if $isConnected}
			<div class="rounded-lg bg-zinc-900 p-4">
				<p class="text-sm text-zinc-400">Address:</p>
				<p class="font-mono text-sm break-all">{$address}</p>
			</div>

			<div class="rounded-lg bg-zinc-900 p-4">
				<p class="text-sm text-zinc-400">Network ID:</p>
				<p class="font-mono text-sm">{$selectedNetworkId || 'None'}</p>
			</div>
		{/if}
	</div>
</div>
