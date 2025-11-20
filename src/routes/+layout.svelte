<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import '$lib/appkit';
  import { Toaster } from '$lib/components/ui/sonner';
  import Github from 'lucide-svelte/icons/github';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="dark min-h-screen">
  <div class="mx-auto flex min-h-screen max-w-md flex-col border-x pb-20">
    <a
      href="https://github.com/ical10/gnosis-split"
      target="_blank"
      rel="noopener noreferrer"
      class="fixed top-4 right-4 z-50 rounded-full bg-background/80 p-2 backdrop-blur-sm transition-colors hover:bg-accent"
      aria-label="View on GitHub"
    >
      <Github class="h-5 w-5" />
    </a>
    {@render children()}
  </div>
  <Toaster />
</div>

<BottomNav />
