<script lang="ts">
  import { base } from '$app/paths';
  import TopBar from '$lib/components/TopBar.svelte';
  import { itinerary } from '$lib/itinerary';
  import { attractionById } from '$lib/content';
  import { doneStore } from '$lib/state.svelte';
  import { ptWeekday, ptDateShort, todayISO } from '$lib/dates';

  const today = todayISO();
</script>

<TopBar title="Roteiro · 17 dias" />

<main class="space-y-3 p-4 pb-16">
  <p class="text-sm text-deep/70">
    O roteiro completo da viagem, de <strong>19/11</strong> a <strong>05/12</strong>. Toque num lugar pra abrir o guia.
  </p>

  {#each itinerary as day, i (day.date)}
    {@const isToday = day.date === today}
    <section
      class="rounded-2xl border p-4 shadow-sm {isToday ? 'border-ember bg-ember/5' : 'border-transparent bg-white'} {day.highlight ? 'ring-2 ring-gold/50' : ''}"
    >
      <div class="flex items-start gap-3">
        <div class="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-deep text-white">
          <span class="text-[10px] font-semibold uppercase leading-none opacity-80">{ptWeekday(day.date).slice(0, 3)}</span>
          <span class="text-sm font-bold leading-tight">{ptDateShort(day.date).split('/')[0]}</span>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wide text-teal">Dia {i + 1} · {day.city}</span>
            {#if isToday}<span class="rounded-full bg-ember px-2 py-0.5 text-[10px] font-bold text-white">HOJE</span>{/if}
            {#if day.highlight}<span class="text-sm">⭐</span>{/if}
          </div>
          <p class="mt-0.5 font-bold leading-tight">{day.emoji} {day.title}</p>
          {#if day.note}<p class="mt-1 text-xs leading-relaxed text-deep/65">{day.note}</p>{/if}

          {#if day.placeIds.length}
            <div class="mt-2.5 flex flex-wrap gap-1.5">
              {#each day.placeIds as id (id)}
                {@const a = attractionById(id)}
                {#if a}
                  <a
                    href="{base}/local/{id}"
                    class="inline-flex items-center gap-1 rounded-full border border-deep/15 bg-sand px-2.5 py-1 text-xs font-medium text-deep/80"
                  >
                    {#if doneStore.ids.includes(id)}<span class="text-forest">✓</span>{/if}{a.name}
                  </a>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </section>
  {/each}

  <p class="pt-2 text-center text-xs text-deep/45">
    Roteiro base enviado pelos viajantes · voos e horários exatos ficam em “Nossa viagem”.
  </p>
</main>
