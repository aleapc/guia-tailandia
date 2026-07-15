<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { ensureWeather } from '$lib/state.svelte';
  import { pwa, initPWA, applyUpdate } from '$lib/pwa.svelte';

  let { children } = $props();

  onMount(() => {
    ensureWeather();
    initPWA();
  });
</script>

<div class="mx-auto min-h-dvh max-w-md bg-sand">
  {#if pwa.needRefresh}
    <button
      onclick={applyUpdate}
      class="sticky top-0 z-50 flex w-full items-center justify-center gap-2 bg-ember py-2 text-sm font-semibold text-white"
      style="padding-top: calc(env(safe-area-inset-top) + 0.5rem)"
    >
      🔄 Nova versão disponível — toque para atualizar
    </button>
  {/if}
  {@render children()}
</div>
