<script lang="ts">
  import { base } from '$app/paths';
  import Menu from './Menu.svelte';

  let { title, back = `${base}/` }: { title: string; back?: string } = $props();
</script>

<header
  class="sticky top-0 z-30 flex items-center gap-2 bg-deep px-3 pb-3 text-white shadow"
  style="padding-top: calc(env(safe-area-inset-top) + 0.75rem)"
>
  <a href={back} class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 text-xl" aria-label="Voltar">←</a>
  <h1 class="flex-1 truncate text-lg font-bold">{title}</h1>
  <Menu tone="light" />
</header>
