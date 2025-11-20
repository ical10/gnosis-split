<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import '$lib/appkit';
  import { Toaster } from '$lib/components/ui/sonner';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="dark min-h-screen">
  <div class="mx-auto flex min-h-screen max-w-md flex-col border-x pb-20">
    {@render children()}
  </div>
  <Toaster />
</div>

<BottomNav />
