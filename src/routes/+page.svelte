<script lang="ts">
  import { base } from '$app/paths';
  import { attractions, categories, categoryById } from '$lib/content';
  import { weatherStore, doneStore, favStore, refreshWeather } from '$lib/state.svelte';
  import { buildAlerts } from '$lib/alerts';
  import { buildPlan, extrasForToday } from '$lib/plan';
  import { tripDayLabel, todayISO } from '$lib/dates';
  import { currentCity } from '$lib/itinerary';
  import { forDate, hhmm, goldenHour, wmoEmoji, wmoLabel } from '$lib/weather';
  import WeatherStrip from '$lib/components/WeatherStrip.svelte';
  import AlertCard from '$lib/components/AlertCard.svelte';
  import CategoryCard from '$lib/components/CategoryCard.svelte';
  import PlaceCard from '$lib/components/PlaceCard.svelte';
  import NearbyList from '$lib/components/NearbyList.svelte';
  import Menu from '$lib/components/Menu.svelte';
  import { onMount } from 'svelte';
  import { couple, loadCouple, setCouple } from '$lib/personalize.svelte';
  import { pwa, checkForUpdate, applyUpdate } from '$lib/pwa.svelte';

  const today = todayISO();
  let refreshing = $state(false);

  onMount(loadCouple);

  async function onCoupleFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) await setCouple(input.files[0]);
    input.value = '';
  }

  const alerts = $derived(buildAlerts(weatherStore.data, doneStore.ids, today));
  const plan = $derived(buildPlan(weatherStore.data, doneStore.ids, favStore.ids, today));
  const extras = $derived(extrasForToday(weatherStore.data, doneStore.ids, favStore.ids, today));
  const cur = $derived(weatherStore.data?.current ?? null);
  const todayFc = $derived(
    weatherStore.data ? (forDate(weatherStore.data, today) ?? weatherStore.data.days[0]) : undefined
  );

  async function doRefresh() {
    refreshing = true;
    // ↻ atualiza o clima E o app: se há versão nova pronta, aplica; senão, checa.
    if (pwa.needRefresh) {
      await applyUpdate(); // recarrega
      return;
    }
    await Promise.all([refreshWeather(), checkForUpdate()]);
    refreshing = false;
  }

  // Search across all attractions.
  let q = $state('');
  const diacritics = new RegExp('[\\u0300-\\u036f]', 'g');
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(diacritics, '');
  const results = $derived(
    q.trim().length >= 2
      ? attractions.filter((a) =>
          norm(`${a.name} ${a.tagline} ${a.description} ${categoryById(a.categoryId)?.title ?? ''}`).includes(norm(q))
        )
      : []
  );
</script>

<header
  class="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-deep to-teal px-5 pb-6 text-white"
  style="padding-top: calc(env(safe-area-inset-top) + 1rem)"
>
  <div class="mb-3 flex items-center justify-between">
    <Menu tone="light" />
    <button
      onclick={doRefresh}
      class="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-xl"
      aria-label="Atualizar previsão"
    >
      <span class={refreshing ? 'inline-block animate-spin' : 'inline-block'}>↻</span>
    </button>
  </div>
  <div class="flex items-end justify-between gap-3">
    <div class="min-w-0">
      <span class="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold">{tripDayLabel(today)}</span>
      <h1 class="mt-2 text-3xl font-bold leading-tight">{currentCity(today)}</h1>
      <p class="text-sm text-white/90">Cassiano &amp; Felipe · Tailândia 🇹🇭</p>
      {#if cur || todayFc?.sunset}
        <div class="mt-1.5 space-y-0.5 text-xs text-white/85">
          {#if cur}
            <p>{wmoEmoji(cur.weatherCode, cur.isDay)} {Math.round(cur.temp)}° · {wmoLabel(cur.weatherCode)}</p>
          {/if}
          {#if todayFc?.sunrise && todayFc?.sunset}
            <p>🌅 {hhmm(todayFc.sunrise)} · 🌇 {hhmm(todayFc.sunset)} · 📸 {goldenHour(todayFc.sunset)}</p>
          {/if}
        </div>
      {/if}
    </div>
    <label class="shrink-0 cursor-pointer" aria-label="Foto de nós dois">
      <input type="file" accept="image/*" class="hidden" onchange={onCoupleFile} />
      {#if couple.url}
        <img src={couple.url} alt="Nós dois" class="h-16 w-16 rounded-2xl border-2 border-white/70 object-cover shadow-lg" />
      {:else}
        <span class="grid h-16 w-16 place-items-center rounded-2xl border-2 border-dashed border-white/60 px-1 text-center text-[10px] font-medium leading-tight text-white/85">+ foto<br />de nós 2</span>
      {/if}
    </label>
  </div>
</header>

<main class="space-y-6 p-4 pb-12">
  <!-- Sugestão de hoje + Ao redor agora (carrossel deslizável) -->
  <section>
    <div class="mb-2 flex items-center justify-between">
      <h2 class="text-lg font-bold">📋 Sugestão de hoje</h2>
      <span class="text-xs text-deep/45">deslize →</span>
    </div>
    <div class="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
      <!-- Painel 1: sugestão pelo clima -->
      <div class="w-[85%] shrink-0 snap-center rounded-2xl bg-white p-4 shadow-sm">
        <p class="font-bold">{plan.title}</p>
        <p class="mt-0.5 text-sm text-deep/70">{plan.reason}</p>
        {#if plan.emptyMsg}
          <p class="mt-3 text-sm">{plan.emptyMsg}</p>
        {:else}
          <ul class="mt-3 space-y-2.5">
            {#each plan.items as it (it.when)}
              <li class="flex gap-3">
                <span class="mt-0.5 w-24 shrink-0 text-[11px] font-bold uppercase tracking-wide text-teal">{it.when}</span>
                <div class="min-w-0">
                  <a href="{base}/local/{it.id}" class="font-semibold underline decoration-teal/40 underline-offset-2">{it.name}</a>
                  <p class="text-xs text-deep/60">{it.why}</p>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
      <!-- Painel 2: ao redor agora (GPS) -->
      <div class="w-[85%] shrink-0 snap-center rounded-2xl bg-white p-4 shadow-sm">
        <p class="font-bold">📍 Ao redor agora</p>
        <p class="mb-3 mt-0.5 text-sm text-deep/70">Os pontos do guia mais perto de onde você está.</p>
        <NearbyList limit={5} />
      </div>
    </div>
  </section>

  <!-- O que mais fazer hoje? -->
  {#if extras.items.length}
    <section>
      <h2 class="mb-1 text-lg font-bold">✨ O que mais fazer hoje?</h2>
      <p class="mb-2 text-sm text-deep/70">{extras.reason}</p>
      <div class="space-y-2">
        {#each extras.items as x (x.id)}
          <a href="{base}/local/{x.id}" class="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm active:scale-[0.99]">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl" style="background:linear-gradient(155deg,{categoryById(x.category)?.gradient[0]},{categoryById(x.category)?.gradient[1]})">
              {categoryById(x.category)?.emoji ?? '📍'}
            </span>
            <div class="min-w-0 flex-1">
              <p class="font-semibold leading-tight">{x.name}</p>
              <p class="line-clamp-1 text-xs text-deep/60">{x.tagline}</p>
            </div>
            {#if x.fit === 'INDOOR' || x.fit === 'RAIN_OK'}<span class="shrink-0 text-xs" title="Bom na chuva">☔</span>{:else if x.fit === 'CLEAR_SKY'}<span class="shrink-0 text-xs" title="Melhor com sol">☀️</span>{/if}
            <span class="text-deep/30">›</span>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Atalho do roteiro dia-a-dia -->
  <a
    href="{base}/roteiro"
    class="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-ember to-gold p-4 text-white shadow-sm"
  >
    <span class="text-3xl">🗺️</span>
    <div class="min-w-0 flex-1">
      <p class="font-bold leading-tight">Roteiro dia-a-dia</p>
      <p class="text-xs text-white/85">Os 17 dias: 19/11 → 05/12, com os lugares de cada dia</p>
    </div>
    <span class="text-2xl">›</span>
  </a>

  <!-- Atalho do álbum -->
  <a
    href="{base}/album"
    class="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-teal to-forest p-4 text-white shadow-sm"
  >
    <span class="text-3xl">🎞️</span>
    <div class="min-w-0 flex-1">
      <p class="font-bold leading-tight">Álbum da viagem</p>
      <p class="text-xs text-white/85">Fotos, narrações, mapa e vídeo do dia</p>
    </div>
    <span class="text-2xl">›</span>
  </a>

  <!-- Previsão -->
  <section>
    <h2 class="mb-2 text-lg font-bold">🌤️ Previsão dos próximos dias</h2>
    <WeatherStrip data={weatherStore.data} loading={weatherStore.loading} {today} />
  </section>

  <!-- Alertas -->
  <section>
    <h2 class="mb-2 text-lg font-bold">💡 Dicas &amp; alertas</h2>
    <div class="space-y-2">
      {#each alerts as alert (alert.title)}
        <AlertCard {alert} />
      {/each}
    </div>
  </section>

  <!-- Explorar / busca -->
  <section>
    <h2 class="mb-2 text-lg font-bold">🧭 Explorar por categoria</h2>
    <input
      bind:value={q}
      placeholder="🔎 Buscar local (ex.: Wat Arun, pad thai, Maya Bay…)"
      class="mb-3 w-full rounded-xl border border-deep/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal"
    />
    {#if q.trim().length >= 2}
      {#if results.length}
        <div class="space-y-3">
          {#each results as a (a.id)}
            <PlaceCard {a} />
          {/each}
        </div>
      {:else}
        <p class="py-6 text-center text-sm text-deep/55">Nada encontrado para “{q}”.</p>
      {/if}
    {:else}
      <div class="grid grid-cols-2 gap-3">
        {#each categories as c (c.id)}
          <CategoryCard category={c} />
        {/each}
      </div>
    {/if}
  </section>

  <p class="pt-1 text-center text-xs text-deep/50">
    Previsão Open-Meteo · funciona offline · toque ↻ no wi-fi para atualizar
  </p>
</main>
