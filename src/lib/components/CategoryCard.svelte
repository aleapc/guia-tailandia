<script lang="ts">
  import { base } from '$app/paths';
  import { attractionsOf, type Category } from '$lib/content';
  import Photo from './Photo.svelte';

  let { category }: { category: Category } = $props();
  const count = attractionsOf(category.id).length;
</script>

<a href="{base}/categoria/{category.id}" class="block overflow-hidden rounded-2xl shadow-sm">
  <Photo
    image={category.image}
    gradient={category.gradient}
    emoji={category.emoji}
    heightClass="h-32"
    alt={category.title}
  >
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
    <div class="absolute bottom-2 left-3 right-3 text-white">
      <p class="font-bold leading-tight drop-shadow">{category.title}</p>
      <p class="text-xs opacity-90">{count} {count === 1 ? 'local' : 'locais'}</p>
    </div>
  </Photo>
</a>
