<script lang="ts">
  import { base } from '$app/paths';
  import { attractionsOf, categoryById } from '$lib/content';
  import Photo from '$lib/components/Photo.svelte';
  import PlaceCard from '$lib/components/PlaceCard.svelte';
  import Menu from '$lib/components/Menu.svelte';

  let { data } = $props();
  const category = categoryById(data.id)!;
  const places = attractionsOf(data.id);
</script>

<div class="relative">
  <Photo
    image={category.image}
    gradient={category.gradient}
    emoji={category.emoji}
    heightClass="h-52"
    alt={category.title}
  >
    <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10"></div>
    <div
      class="absolute inset-0 flex flex-col"
      style="padding-top: calc(env(safe-area-inset-top) + 0.5rem)"
    >
      <!-- Barra de navegação: separada do título, sempre clicável -->
      <div class="flex items-center justify-between px-3">
        <a
          href="{base}/"
          class="grid h-9 w-9 place-items-center rounded-full bg-black/40 text-xl text-white"
          aria-label="Voltar">←</a
        >
        <Menu tone="light" />
      </div>
      <!-- Título empurrado pro rodapé -->
      <div class="mt-auto px-4 pb-3 text-white">
        <p class="text-2xl font-bold leading-tight drop-shadow">{category.emoji} {category.title}</p>
        <p class="mt-0.5 text-sm opacity-90">{category.summary}</p>
      </div>
    </div>
  </Photo>
</div>

<main class="space-y-3 p-4 pb-12">
  {#each places as a (a.id)}
    <PlaceCard {a} />
  {/each}
  <a
    href="{base}/perto?cat={category.id}"
    class="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-teal/50 py-3 text-sm font-semibold text-teal"
  >
    📍 Outros lugares dessa categoria ao meu redor
  </a>
</main>
