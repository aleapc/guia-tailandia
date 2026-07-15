<script lang="ts">
  import { base } from '$app/paths';
  import type { Snippet } from 'svelte';

  let {
    image,
    gradient,
    emoji = '',
    alt = '',
    heightClass = 'h-44',
    children
  }: {
    image?: string;
    gradient: [string, string];
    emoji?: string;
    alt?: string;
    heightClass?: string;
    children?: Snippet;
  } = $props();

  let failed = $state(false);
  const grad = `linear-gradient(155deg, ${gradient[0]}, ${gradient[1]})`;
</script>

<div class="relative w-full overflow-hidden {heightClass}" style="background:{grad}">
  {#if image && !failed}
    <img
      src="{base}/photos/{image}"
      {alt}
      loading="lazy"
      class="absolute inset-0 h-full w-full object-cover"
      onerror={() => (failed = true)}
    />
  {:else if emoji}
    <div class="absolute inset-0 grid place-items-center text-6xl opacity-90">{emoji}</div>
  {/if}
  {#if children}{@render children()}{/if}
</div>
