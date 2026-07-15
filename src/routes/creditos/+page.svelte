<script lang="ts">
  import TopBar from '$lib/components/TopBar.svelte';
  import { photoCredits } from '$lib/photoCredits';

  const entries = Object.entries(photoCredits);
</script>

<TopBar title="Créditos das fotos" />

<main class="space-y-4 p-4 pb-12">
  <p class="text-sm text-deep/75">
    Esta versão do guia usa <strong>gradientes temáticos</strong> em vez de fotos, pra ficar leve e 100%
    offline. O conteúdo (lugares, horários e dicas) foi curado a partir de fontes públicas de viagem. A
    previsão do tempo vem do <strong>Open-Meteo</strong>. Os mapas abrem no <strong>Google Maps</strong>.
  </p>
  {#if entries.length === 0}
    <p class="rounded-xl bg-white p-3 text-sm text-deep/60 shadow-sm">Sem fotos empacotadas nesta versão.</p>
  {/if}
  <ul class="space-y-2">
    {#each entries as [file, credit] (file)}
      <li class="rounded-xl bg-white p-3 text-sm shadow-sm">
        <span class="font-mono text-xs text-deep/50">{file}</span>
        <p class="text-deep/80">{credit}</p>
      </li>
    {/each}
  </ul>
</main>
