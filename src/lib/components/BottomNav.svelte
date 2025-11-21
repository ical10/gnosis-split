<script lang="ts">
  import { page } from '$app/stores';
  import CreditCard from 'lucide-svelte/icons/credit-card';
  import Receipt from 'lucide-svelte/icons/receipt';
  import PlusCircle from 'lucide-svelte/icons/plus-circle';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';

  const navItems = [
    { href: '/cards', icon: CreditCard, label: 'Cards' },
    { href: '/split/new', icon: PlusCircle, label: 'New', fab: true },
    { href: '/splits', icon: Receipt, label: 'Splits' }
  ];
</script>

<nav
  class="pb-safe fixed right-0 bottom-0 left-0 border-t border-primary/20 bg-black/95 backdrop-blur-sm"
>
  <div
    class="mx-auto flex h-16 max-w-md items-center justify-around border-x border-primary/20 px-2"
  >
    {#each navItems as item}
      {#if item.fab}
        <Button
          href={item.href}
          size="icon-lg"
          class={cn(
            '-mt-8 h-14 w-14 rounded-full border border-primary/50 font-mono shadow-lg shadow-primary/30 transition-all hover:border-primary hover:shadow-primary/50',
            $page.url.pathname === item.href && 'border-primary shadow-primary/50'
          )}
        >
          <svelte:component this={item.icon} class="h-6 w-6" />
        </Button>
      {:else}
        <Button
          href={item.href}
          variant="ghost"
          class={cn(
            'h-full flex-1 flex-col gap-1 font-mono text-xs uppercase transition-all',
            $page.url.pathname === item.href
              ? 'text-primary'
              : 'text-muted-foreground hover:text-primary'
          )}
        >
          <svelte:component this={item.icon} class="h-5 w-5" />
          <span class="text-[10px]">{item.label}</span>
        </Button>
      {/if}
    {/each}
  </div>
</nav>
