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

<nav class="pb-safe fixed right-0 bottom-0 left-0 border-t bg-background">
  <div class="mx-auto flex h-16 max-w-md items-center justify-around border-x px-2">
    {#each navItems as item}
      {#if item.fab}
        <Button
          href={item.href}
          size="icon-lg"
          class={cn(
            '-mt-8 h-14 w-14 rounded-full shadow-lg',
            $page.url.pathname === item.href && 'ring-2 ring-primary/50'
          )}
        >
          <svelte:component this={item.icon} class="h-6 w-6" />
        </Button>
      {:else}
        <Button
          href={item.href}
          variant="ghost"
          class={cn(
            'h-full flex-1 flex-col gap-1',
            $page.url.pathname === item.href ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <svelte:component this={item.icon} class="h-6 w-6" />
          <span class="text-xs">{item.label}</span>
        </Button>
      {/if}
    {/each}
  </div>
</nav>
