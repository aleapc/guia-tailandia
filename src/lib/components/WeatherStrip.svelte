<script lang="ts">
  import { daySky, type WeatherData } from '$lib/weather';
  import { ptWeekdayShort } from '$lib/dates';

  let { data, loading, today }: { data: WeatherData | null; loading: boolean; today: string } = $props();
</script>

{#if loading && !data}
  <div class="py-6 text-center text-sm text-deep/60">Carregando previsão…</div>
{:else if !data || data.days.length === 0}
  <div class="rounded-xl bg-black/5 p-4 text-sm text-deep/70">
    Sem previsão ainda. Conecte ao wi-fi e toque em atualizar (↻). Depois disso funciona offline.
  </div>
{:else}
  <div class="no-scrollbar flex gap-2 overflow-x-auto pb-1">
    {#each data.days as d (d.date)}
      <div
        class="flex w-[58px] shrink-0 flex-col items-center rounded-2xl px-1 py-2 {d.date === today
          ? 'bg-deep text-white'
          : 'bg-white text-deep shadow-sm'}"
      >
        <span class="text-[11px] font-bold">{d.date === today ? 'hoje' : ptWeekdayShort(d.date)}</span>
        <span class="my-0.5 text-xl">{daySky(d).emoji}</span>
        <span class="text-sm font-bold">{Math.round(d.tempMax)}°</span>
        <span class="text-[11px] opacity-70">{Math.round(d.tempMin)}°</span>
        <span class="text-[9px]">💧{d.precipProbMax}%</span>
      </div>
    {/each}
  </div>
{/if}
