<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import '$lib/appkit';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-black text-white">
	<div class="mx-auto flex min-h-screen max-w-md flex-col border-x border-white pb-20">
		{@render children()}
	</div>
</div>

<BottomNav />
