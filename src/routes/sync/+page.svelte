<script lang="ts">
  import { onMount } from 'svelte';
  import TopBar from '$lib/components/TopBar.svelte';
  import { doneStore, favStore, notesStore } from '$lib/state.svelte';
  import { encodeSync, importSync, whatsappUrl } from '$lib/sync';

  let pasted = $state('');
  let msg = $state('');

  const noteCount = $derived(Object.values(notesStore.map).filter(Boolean).length);
  const code = $derived(encodeSync());

  function doImport(c: string) {
    const added = importSync(c);
    if (!added) {
      msg = '❌ Código inválido — confere se copiou inteiro.';
      return;
    }
    msg =
      added.done + added.fav + added.notes === 0
        ? '✅ Importado — os dois celulares já estavam iguais.'
        : `✅ Fundido! Entraram ${added.done} feitos, ${added.fav} favoritos e ${added.notes} notas do outro celular.`;
    pasted = '';
  }

  // Link mágico: /sync#s=CODIGO importa sozinho
  onMount(() => {
    const m = location.hash.match(/s=([^&]+)/);
    if (m) {
      doImport(decodeURIComponent(m[1]));
      history.replaceState(null, '', location.pathname + location.search);
    }
  });

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      msg = '📋 Código copiado!';
    } catch {
      msg = '❌ Não consegui copiar — use o botão do WhatsApp.';
    }
  }
</script>

<TopBar title="Sincronizar celulares" />

<main class="space-y-6 p-4 pb-14">
  <section class="rounded-2xl bg-white p-4 shadow-sm">
    <h2 class="text-lg font-bold">🔄 Como funciona</h2>
    <p class="mt-1 text-sm text-deep/70">
      Cada um manda seu código pelo WhatsApp e importa o do outro — o app junta os
      <strong>lugares feitos, favoritos e notas</strong> dos dois celulares (nada se perde;
      importar duas vezes não duplica). Fotos e áudios do diário ficam em cada aparelho.
    </p>
  </section>

  <section class="rounded-2xl bg-white p-4 shadow-sm">
    <h2 class="text-lg font-bold">📤 Mandar os meus</h2>
    <p class="mt-1 text-sm text-deep/70">
      Este celular tem <strong>{doneStore.ids.length}</strong> feitos,
      <strong>{favStore.ids.length}</strong> favoritos e <strong>{noteCount}</strong> notas.
    </p>
    <div class="mt-3 grid grid-cols-2 gap-2">
      <a
        href={whatsappUrl(code)}
        target="_blank"
        rel="noopener"
        class="rounded-xl bg-forest p-3 text-center text-sm font-semibold text-white"
      >
        📲 Mandar no WhatsApp
      </a>
      <button class="rounded-xl border border-deep/20 p-3 text-sm font-semibold" onclick={copyCode}>
        📋 Copiar código
      </button>
    </div>
  </section>

  <section class="rounded-2xl bg-white p-4 shadow-sm">
    <h2 class="text-lg font-bold">📥 Receber do outro celular</h2>
    <p class="mt-1 text-sm text-deep/70">
      Recebeu um link? É só abrir que importa sozinho. Recebeu o código? Cola aqui:
    </p>
    <div class="mt-3 flex gap-2">
      <input
        type="text"
        bind:value={pasted}
        placeholder="GT1.…"
        class="min-w-0 flex-1 rounded-xl border border-deep/20 bg-white px-3 py-2 text-sm"
      />
      <button
        class="shrink-0 rounded-xl bg-deep px-4 py-2 text-sm font-semibold text-white"
        onclick={() => doImport(pasted)}
      >
        Importar
      </button>
    </div>
    {#if msg}<p class="mt-3 text-sm font-medium">{msg}</p>{/if}
  </section>
</main>
