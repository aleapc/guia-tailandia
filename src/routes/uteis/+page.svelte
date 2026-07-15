<script lang="ts">
  import TopBar from '$lib/components/TopBar.svelte';
  import { emergencyNumbers, emergencyNote, usefulGroups, safetyTips, infoBlocks } from '$lib/usefulInfo';

  function mapSearch(q: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }
</script>

<TopBar title="Informações úteis" />

<main class="space-y-6 p-4 pb-14">
  <!-- Emergency numbers -->
  <section>
    <h2 class="mb-2 text-lg font-bold">🆘 Emergência (Tailândia)</h2>
    <div class="grid grid-cols-3 gap-2">
      {#each emergencyNumbers as n (n.number)}
        <a
          href="tel:{n.number}"
          class="flex flex-col items-center rounded-2xl bg-red-700 p-3 text-center text-white shadow-sm"
        >
          <span class="text-2xl">{n.emoji}</span>
          <span class="mt-1 text-2xl font-extrabold leading-none">{n.number}</span>
          <span class="mt-1 text-[11px] leading-tight opacity-90">{n.label}</span>
        </a>
      {/each}
    </div>
    <p class="mt-2 text-xs text-deep/55">{emergencyNote}</p>
  </section>

  <!-- Tradutor de conversa -->
  <section>
    <h2 class="mb-2 text-lg font-bold">🗣️ Tradutor de conversa</h2>
    <div class="rounded-2xl bg-white p-4 shadow-sm">
      <p class="text-sm text-deep/80">
        Abre o Google Tradutor. Inglês resolve quase tudo na Tailândia; o tailandês (🇹🇭) ajuda com
        taxistas e barracas. No app, toque no microfone <b>“Conversa”</b> pra traduzir em voz alta.
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <a
          href="https://translate.google.com/?sl=pt&tl=en&op=translate"
          target="_blank"
          rel="noopener"
          class="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white shadow-sm">🗣️ Conversa (PT ↔ Inglês)</a
        >
        <a
          href="https://translate.google.com/?sl=pt&tl=th&op=translate"
          target="_blank"
          rel="noopener"
          class="rounded-lg border border-deep/20 px-3 py-2 text-sm font-semibold text-deep">🇹🇭 PT → Tailandês</a
        >
      </div>
      <p class="mt-3 text-xs text-deep/55">
        💡 Pra funcionar <b>sem internet</b>: instale o app <b>Google Tradutor</b> e baixe os pacotes
        <b>Inglês</b> e <b>Tailandês</b> (uma vez só). Aí o link abre direto no app.
      </p>
    </div>
  </section>

  <!-- Blocos de informação prática -->
  <section>
    <h2 class="mb-2 text-lg font-bold">📖 Antes de ir & no destino</h2>
    <div class="space-y-2">
      {#each infoBlocks as b (b.title)}
        <details class="rounded-2xl bg-white p-4 shadow-sm">
          <summary class="cursor-pointer list-none font-bold leading-tight">{b.title}</summary>
          <p class="mt-2 text-sm leading-relaxed text-deep/80">{b.body}</p>
          {#if b.links?.length}
            <div class="mt-2 flex flex-wrap gap-2">
              {#each b.links as l (l.url)}
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener"
                  class="rounded-lg border border-deep/20 px-3 py-1.5 text-xs font-semibold text-teal">{l.label} ↗</a
                >
              {/each}
            </div>
          {/if}
        </details>
      {/each}
    </div>
  </section>

  {#each usefulGroups as g (g.title)}
    <section>
      <h2 class="mb-2 text-lg font-bold">{g.emoji} {g.title}</h2>
      <div class="space-y-2">
        {#each g.places as p (p.name)}
          <div class="rounded-2xl bg-white p-3 shadow-sm">
            <p class="font-bold leading-tight">{p.name}</p>
            {#if p.detail}<p class="text-xs text-deep/60">{p.detail}</p>{/if}
            {#if p.address}<p class="mt-1 text-sm text-deep/80">📍 {p.address}</p>{/if}
            {#if p.note}<p class="mt-1 text-xs text-deep/55">{p.note}</p>{/if}
            <div class="mt-2 flex flex-wrap gap-2">
              {#if p.phone}
                <a href="tel:{p.phone}" class="rounded-lg bg-forest px-3 py-1.5 text-xs font-semibold text-white">📞 Ligar</a>
              {/if}
              {#if p.mapQuery || p.address}
                <a
                  href={mapSearch(p.mapQuery ?? p.address ?? p.name)}
                  target="_blank"
                  rel="noopener"
                  class="rounded-lg border border-deep/20 px-3 py-1.5 text-xs font-semibold text-deep">🗺️ Mapa</a
                >
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/each}

  <section>
    <h2 class="mb-2 text-lg font-bold">💡 Dicas de segurança & saúde</h2>
    <ul class="space-y-1 rounded-2xl bg-white p-4 shadow-sm">
      {#each safetyTips as t (t)}
        <li class="flex gap-2 text-sm text-deep/85"><span class="text-teal">•</span><span>{t}</span></li>
      {/each}
    </ul>
  </section>

  <p class="text-center text-[11px] text-deep/40">
    Em emergência, ligue 191 (geral) ou 1155 (Polícia Turística, em inglês). Ambulância: 1669. Demais telefones: confirme in loco.
  </p>
</main>
