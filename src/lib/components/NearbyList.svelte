<script lang="ts">
  import { base } from '$app/paths';
  import { getPosition, nearest, type NearbyItem } from '$lib/geo';
  import { categoryById } from '$lib/content';
  import { isDone, isFav } from '$lib/state.svelte';

  let { categoryId, limit = 10 }: { categoryId?: string; limit?: number } = $props();

  let status = $state<'idle' | 'loading' | 'ok' | 'error'>('idle');
  let items = $state<NearbyItem[]>([]);
  let msg = $state('');

  async function locate() {
    status = 'loading';
    try {
      const p = await getPosition();
      items = nearest(p.coords.latitude, p.coords.longitude, categoryId, limit);
      status = 'ok';
    } catch (e) {
      msg = (e as Error)?.message ?? 'erro';
      status = 'error';
    }
  }

  function fmt(km: number): string {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }
  // Rough time estimate from straight-line distance.
  function eta(km: number): string {
    return km <= 1.5 ? `🚶 ~${Math.max(1, Math.round(km * 13))} min` : `🚗 ~${Math.max(2, Math.round(km * 1.6))} min`;
  }
</script>

{#if status === 'idle'}
  <button onclick={locate} class="w-full rounded-xl bg-teal py-3 font-semibold text-white">
    📍 Usar minha localização
  </button>
  <p class="mt-2 text-xs text-deep/55">
    Mostra os locais do guia mais próximos de você (precisa permitir o GPS). Promoções/sales não têm fonte
    automática confiável — anote no próprio local quando vir uma.
  </p>
{:else if status === 'loading'}
  <p class="py-6 text-center text-sm text-deep/60">Localizando você…</p>
{:else if status === 'error'}
  <p class="text-sm text-deep/70">Não consegui pegar sua localização. Permita o acesso ao GPS e tente de novo.</p>
  <button onclick={locate} class="mt-2 rounded-xl border border-teal px-4 py-2 text-sm font-semibold text-teal">
    Tentar de novo
  </button>
{:else}
  <ul class="space-y-2">
    {#each items as it (it.a.id)}
      {@const cat = categoryById(it.a.categoryId)}
      <li>
        <a
          href="{base}/local/{it.a.id}"
          class="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
        >
          <span class="text-xl">{cat?.emoji ?? '📍'}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold {isDone(it.a.id) ? 'text-deep/45 line-through' : ''}">
              {#if isFav(it.a.id)}⭐ {/if}{it.a.name}
            </p>
            <p class="truncate text-xs text-deep/55">{eta(it.km)} · {it.a.tagline}</p>
          </div>
          <span class="shrink-0 rounded-full bg-teal/15 px-2.5 py-1 text-xs font-bold text-teal">{fmt(it.km)}</span>
        </a>
      </li>
    {/each}
  </ul>
{/if}
