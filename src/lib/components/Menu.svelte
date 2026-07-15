<script lang="ts">
  import { base } from '$app/paths';

  let { tone = 'light' }: { tone?: 'light' | 'dark' } = $props();
  let open = $state(false);

  const links = [
    { href: `${base}/`, label: 'Início', emoji: '🏠' },
    { href: `${base}/roteiro`, label: 'Roteiro (17 dias)', emoji: '🗺️' },
    { href: `${base}/viagem`, label: 'Nossa viagem', emoji: '✈️' },
    { href: `${base}/perto`, label: 'Perto de mim', emoji: '📍' },
    { href: `${base}/uteis`, label: 'Informações úteis', emoji: '🆘' },
    { href: `${base}/bolso`, label: 'Bolso do viajante', emoji: '👛' },
    { href: `${base}/album`, label: 'Álbum da viagem', emoji: '🎞️' },
    { href: `${base}/sync`, label: 'Sincronizar celulares', emoji: '🔄' },
    { href: `${base}/creditos`, label: 'Créditos das fotos', emoji: '📷' }
  ];
</script>

<button
  onclick={() => (open = true)}
  aria-label="Abrir menu"
  class="grid h-9 w-9 place-items-center rounded-full text-lg {tone === 'light'
    ? 'bg-white/20 text-white'
    : 'bg-black/5 text-deep'}">☰</button>

{#if open}
  <div class="fixed inset-0 z-50" role="dialog" aria-modal="true">
    <button class="absolute inset-0 bg-black/40" aria-label="Fechar menu" onclick={() => (open = false)}
    ></button>
    <nav
      class="absolute right-0 top-0 flex h-full w-64 flex-col bg-white p-4 shadow-2xl"
      style="padding-top: calc(env(safe-area-inset-top) + 1rem)"
    >
      <div class="mb-3 flex items-center justify-between">
        <span class="text-lg font-bold text-deep">Menu</span>
        <button onclick={() => (open = false)} class="text-3xl leading-none text-deep/50" aria-label="Fechar">×</button>
      </div>
      <ul class="space-y-1">
        {#each links as l (l.href)}
          <li>
            <a
              href={l.href}
              onclick={() => (open = false)}
              class="flex items-center gap-3 rounded-xl px-3 py-3 text-deep hover:bg-black/5"
            >
              <span class="text-xl">{l.emoji}</span><span class="font-medium">{l.label}</span>
            </a>
          </li>
        {/each}
      </ul>
      <p class="mt-auto pt-4 text-center text-[11px] text-deep/40">Guia Tailândia · offline</p>
    </nav>
  </div>
{/if}
