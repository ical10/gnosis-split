<script lang="ts">
	import { page } from '$app/stores';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Receipt from 'lucide-svelte/icons/receipt';
	import PlusCircle from 'lucide-svelte/icons/plus-circle';

	const navItems = [
		{ href: '/cards', icon: CreditCard, label: 'Cards' },
		{ href: '/split/new', icon: PlusCircle, label: 'New', fab: true },
		{ href: '/splits', icon: Receipt, label: 'Splits' }
	];
</script>

<nav class="pb-safe fixed right-0 bottom-0 left-0 border-t border-zinc-800 bg-zinc-900">
	<div class="mx-auto flex h-16 max-w-md items-center justify-around border-x border-white px-2">
		{#each navItems as item}
			{#if item.fab}
				<a
					href={item.href}
					class="-mt-8 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-emerald-500 shadow-lg transition-colors hover:bg-emerald-600"
					class:ring-2={$page.url.pathname === item.href}
					class:ring-emerald-300={$page.url.pathname === item.href}
				>
					<svelte:component this={item.icon} class="h-6 w-6 text-black" />
				</a>
			{:else}
				<a
					href={item.href}
					class="flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors"
					class:text-emerald-400={$page.url.pathname === item.href}
					class:text-zinc-400={$page.url.pathname !== item.href}
				>
					<svelte:component this={item.icon} class="h-6 w-6" />
					<span class="text-xs">{item.label}</span>
				</a>
			{/if}
		{/each}
	</div>
</nav>
