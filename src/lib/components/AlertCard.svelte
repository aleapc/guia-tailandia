<script lang="ts">
  import { base } from '$app/paths';
  import type { Alert } from '$lib/alerts';

  let { alert }: { alert: Alert } = $props();

  const styles: Record<string, string> = {
    GREAT: 'bg-forest text-white',
    GOOD: 'bg-teal/12 text-deep',
    WARN: 'bg-amber-600 text-white',
    INFO: 'bg-white text-deep shadow-sm'
  };
  const href = alert.attractionId ? `${base}/local/${alert.attractionId}` : undefined;
</script>

{#snippet body()}
  <div class="flex gap-3 p-3.5">
    <span class="text-2xl leading-none">{alert.emoji}</span>
    <div class="min-w-0">
      <p class="font-bold leading-tight">{alert.title}</p>
      <p class="mt-0.5 text-sm opacity-90">{alert.body}</p>
      {#if href}<p class="mt-1 text-xs font-bold">Ver detalhes →</p>{/if}
    </div>
  </div>
{/snippet}

{#if href}
  <a {href} class="block rounded-2xl {styles[alert.level]}">{@render body()}</a>
{:else}
  <div class="rounded-2xl {styles[alert.level]}">{@render body()}</div>
{/if}
