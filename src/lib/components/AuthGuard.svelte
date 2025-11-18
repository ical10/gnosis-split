<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { isConnected } from '$lib/stores/wallet';
	import { appKit } from '$lib/appkit';

	let { children } = $props();

	let checking = $state(true);

	onMount(() => {
		setTimeout(() => {
			checking = false;
			if (!$isConnected) {
				goto('/');
			}
		}, 100);

		const unsubscribe = isConnected.subscribe((connected) => {
			if (!checking && !connected) {
				goto('/');
			}
		});

		return unsubscribe;
	});
</script>

{#if checking}
	<div class="flex min-h-[80vh] items-center justify-center">
		<div class="text-center">
			<div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500"></div>
			<p class="mt-4 text-zinc-400">Checking connection...</p>
		</div>
	</div>
{:else if $isConnected}
	<div class="flex flex-col">
		<div class="flex justify-end border-b border-zinc-800 p-4">
			<appkit-button />
		</div>
		{@render children()}
	</div>
{:else}
	<div class="flex min-h-[80vh] items-center justify-center p-6">
		<div class="max-w-md text-center">
			<h1 class="mb-4 text-3xl font-bold">Connect Your Wallet</h1>
			<p class="mb-6 text-zinc-400">Please connect your wallet to access this page</p>
			<button
				onclick={() => appKit?.open()}
				class="rounded-lg bg-emerald-500 px-6 py-3 font-semibold transition-colors hover:bg-emerald-600"
			>
				Connect Wallet
			</button>
		</div>
	</div>
{/if}
