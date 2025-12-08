<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import '$lib/appkit';
  import '$lib/stores/auth';
  import { Toaster } from '$lib/components/ui/sonner';
  import Github from 'lucide-svelte/icons/github';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="dark min-h-screen bg-black">
  <div class="mx-auto flex min-h-screen max-w-md flex-col border-x border-primary/20 pb-20">
    <a
      href="https://github.com/ical10/gnosis-split"
      target="_blank"
      rel="noopener noreferrer"
      class="fixed top-4 right-4 z-50 rounded border border-primary/30 bg-black/90 p-2 shadow-lg transition-all hover:border-primary hover:shadow-primary/50"
      aria-label="View on GitHub"
    >
      <Github class="h-5 w-5 text-primary" />
    </a>
    {@render children()}
  </div>
  <Toaster />
</div>

<BottomNav />
