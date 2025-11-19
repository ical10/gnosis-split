<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { isConnected } from '$lib/stores/wallet';
	import { appKit } from '$lib/appkit';
	import { hideAppkitButton } from '$lib/stores/ui';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';

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
			<Spinner class="mx-auto h-12 w-12" />
			<p class="mt-4 text-muted-foreground">Checking connection...</p>
		</div>
	</div>
{:else if $isConnected}
	<div class="flex flex-col">
		{#if !$hideAppkitButton}
			<div class="sticky top-0 z-10 flex justify-end border-b bg-background p-4">
				<appkit-button></appkit-button>
			</div>
		{/if}
		{@render children()}
	</div>
{:else}
	<div class="flex min-h-[80vh] items-center justify-center p-6">
		<div class="max-w-md text-center">
			<h1 class="mb-4 text-3xl font-bold">Connect Your Wallet</h1>
			<p class="mb-6 text-muted-foreground">Please connect your wallet to access this page</p>
			<Button onclick={() => appKit?.open()} size="lg">Connect Wallet</Button>
		</div>
	</div>
{/if}
