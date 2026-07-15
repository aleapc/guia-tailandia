<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import TopBar from '$lib/components/TopBar.svelte';
  import NearbyList from '$lib/components/NearbyList.svelte';
  import { categoryById } from '$lib/content';

  // Read ?cat=<id> only on the client (searchParams can't be read during prerender).
  let catId = $state<string | undefined>(undefined);
  afterNavigate(() => {
    catId = new URLSearchParams(window.location.search).get('cat') ?? undefined;
  });
  const cat = $derived(catId ? categoryById(catId) : undefined);
</script>

<TopBar title={cat ? `Perto de mim · ${cat.title}` : 'Perto de mim'} />

<main class="space-y-3 p-4 pb-12">
  <h2 class="text-lg font-bold">📍 Ao redor agora</h2>
  <p class="text-sm text-deep/70">
    {#if cat}
      Locais de <strong>{cat.title}</strong> mais próximos de onde você está.
    {:else}
      Os pontos do guia mais próximos de onde você está agora.
    {/if}
  </p>
  {#key catId}
    <NearbyList categoryId={catId} limit={12} />
  {/key}
</main>
