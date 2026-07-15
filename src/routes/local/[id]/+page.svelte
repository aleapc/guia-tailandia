<script lang="ts">
  import { base } from '$app/paths';
  import { onMount, onDestroy } from 'svelte';
  import { attractionById, categoryById } from '$lib/content';
  import { weatherStore, isDone, toggleDone, isFav, toggleFav, getNote, setNote } from '$lib/state.svelte';
  import {
    addPlacePhoto,
    listPlacePhotos,
    getPhotoURL,
    removePhoto,
    setPhotoCaption,
    addPlaceAudio,
    listPlaceAudios,
    getAudioURL,
    removeAudio,
    captureGPS,
    type MediaMeta
  } from '$lib/diary.svelte';
  import { fitHint, fitLabel } from '$lib/insights';
  import { isoWeekday, todayISO } from '$lib/dates';
  import { mapsUrl, googleReviewsUrl, tripadvisorUrl } from '$lib/maps';
  import { photoCredits } from '$lib/photoCredits';
  import Photo from '$lib/components/Photo.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import Menu from '$lib/components/Menu.svelte';

  let { data } = $props();
  const a = attractionById(data.id)!;
  const cat = categoryById(a.categoryId)!;
  const credit = a.image ? photoCredits[a.image] : undefined;

  const done = $derived(isDone(a.id));
  const fav = $derived(isFav(a.id));
  const hint = $derived(fitHint(a, weatherStore.data));
  const openToday: boolean | null = a.hours?.openDays?.length
    ? a.hours.openDays.includes(isoWeekday(todayISO()))
    : null;

  let note = $state(getNote(a.id));
  function onNote(e: Event) {
    note = (e.target as HTMLTextAreaElement).value;
    setNote(a.id, note);
  }

  // ─── Photos ───
  let photos = $state<MediaMeta[]>([]);
  let photoURLs = $state<Record<string, string>>({});
  let lightboxIdx = $state(-1);
  let captionDraft = $state('');

  async function refreshPhotos() {
    photos = await listPlacePhotos(a.id);
    const urls: Record<string, string> = {};
    for (const p of photos) {
      const u = await getPhotoURL(p.id);
      if (u) urls[p.id] = u;
    }
    revokeUrls(photoURLs, urls);
    photoURLs = urls;
  }

  async function onPickPhoto(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    const gps = await captureGPS();
    for (const file of Array.from(input.files)) {
      await addPlacePhoto(a.id, file, { lat: gps?.lat, lng: gps?.lng });
    }
    input.value = '';
    await refreshPhotos();
  }

  function openLightbox(i: number) {
    lightboxIdx = i;
    captionDraft = photos[i]?.caption ?? '';
  }
  function closeLightbox() {
    lightboxIdx = -1;
  }
  function prevPhoto() {
    if (lightboxIdx > 0) {
      lightboxIdx -= 1;
      captionDraft = photos[lightboxIdx]?.caption ?? '';
    }
  }
  function nextPhoto() {
    if (lightboxIdx < photos.length - 1) {
      lightboxIdx += 1;
      captionDraft = photos[lightboxIdx]?.caption ?? '';
    }
  }
  async function saveCaption() {
    const p = photos[lightboxIdx];
    if (!p) return;
    await setPhotoCaption(p.id, captionDraft);
    p.caption = captionDraft;
    photos = [...photos];
  }
  async function deleteOpenPhoto() {
    const p = photos[lightboxIdx];
    if (!p) return;
    if (!confirm('Remover esta foto?')) return;
    await removePhoto(p.id);
    closeLightbox();
    await refreshPhotos();
  }

  // ─── Audios ───
  let audios = $state<MediaMeta[]>([]);
  let audioURLs = $state<Record<string, string>>({});
  let recording = $state(false);
  let recElapsed = $state(0);
  let recError = $state<string | null>(null);
  let mediaRec: MediaRecorder | null = null;
  let mediaStream: MediaStream | null = null;
  let recChunks: Blob[] = [];
  let recStartAt = 0;
  let recTimer: ReturnType<typeof setInterval> | null = null;

  async function refreshAudios() {
    audios = await listPlaceAudios(a.id);
    const urls: Record<string, string> = {};
    for (const au of audios) {
      const u = await getAudioURL(au.id);
      if (u) urls[au.id] = u;
    }
    revokeUrls(audioURLs, urls);
    audioURLs = urls;
  }

  function pickAudioMime(): string {
    const cands = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/aac'];
    for (const m of cands) if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
    return '';
  }

  async function startRecording() {
    recError = null;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      recError = 'Permissão de microfone negada.';
      return;
    }
    const mime = pickAudioMime();
    try {
      mediaRec = mime ? new MediaRecorder(mediaStream, { mimeType: mime }) : new MediaRecorder(mediaStream);
    } catch {
      mediaRec = new MediaRecorder(mediaStream);
    }
    recChunks = [];
    mediaRec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recChunks.push(e.data);
    };
    mediaRec.onstop = async () => {
      const blob = new Blob(recChunks, { type: mediaRec?.mimeType || 'audio/webm' });
      const durationMs = Date.now() - recStartAt;
      const gps = await captureGPS();
      await addPlaceAudio(a.id, blob, { lat: gps?.lat, lng: gps?.lng, durationMs });
      mediaStream?.getTracks().forEach((t) => t.stop());
      mediaStream = null;
      mediaRec = null;
      recChunks = [];
      await refreshAudios();
    };
    recStartAt = Date.now();
    recElapsed = 0;
    recTimer = setInterval(() => {
      recElapsed = Math.round((Date.now() - recStartAt) / 1000);
    }, 250);
    mediaRec.start();
    recording = true;
  }

  function stopRecording() {
    if (mediaRec && mediaRec.state !== 'inactive') mediaRec.stop();
    if (recTimer) clearInterval(recTimer);
    recTimer = null;
    recording = false;
  }

  async function deleteAudio(id: string) {
    if (!confirm('Remover esta narração?')) return;
    await removeAudio(id);
    await refreshAudios();
  }

  function fmtDur(ms?: number): string {
    if (!ms) return '';
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  // ─── lifecycle ───
  function revokeUrls(oldMap: Record<string, string>, newMap: Record<string, string>) {
    for (const [k, url] of Object.entries(oldMap)) {
      if (newMap[k] !== url) URL.revokeObjectURL(url);
    }
  }
  onMount(async () => {
    await refreshPhotos();
    await refreshAudios();
  });
  onDestroy(() => {
    if (recTimer) clearInterval(recTimer);
    mediaStream?.getTracks().forEach((t) => t.stop());
    for (const url of Object.values(photoURLs)) URL.revokeObjectURL(url);
    for (const url of Object.values(audioURLs)) URL.revokeObjectURL(url);
  });
</script>

{#snippet bullets(items: string[])}
  <ul class="space-y-1">
    {#each items as it (it)}
      <li class="flex gap-2 text-sm text-deep/85"><span class="text-teal">•</span><span>{it}</span></li>
    {/each}
  </ul>
{/snippet}

<div class="relative">
  <Photo image={a.image} gradient={cat.gradient} emoji={cat.emoji} heightClass="h-52" alt={a.name}>
    <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10"></div>
    <div class="absolute inset-0 flex flex-col" style="padding-top: calc(env(safe-area-inset-top) + 0.5rem)">
      <div class="flex items-center justify-between px-3">
        <a
          href="{base}/categoria/{a.categoryId}"
          class="grid h-9 w-9 place-items-center rounded-full bg-black/40 text-xl text-white"
          aria-label="Voltar">←</a
        >
        <Menu tone="light" />
      </div>
      <div class="mt-auto px-4 pb-3 text-white">
        <p class="text-2xl font-bold leading-tight drop-shadow">{a.name}</p>
        <p class="mt-0.5 text-sm opacity-90">{a.tagline}</p>
      </div>
    </div>
  </Photo>
</div>

<main class="space-y-4 p-4 pb-14">
  <div class="flex flex-wrap gap-1.5">
    {#if a.distanceKm}<Badge>📍 {a.distanceKm} km do Airbnb</Badge>{/if}
    {#if a.driveMinutes}<Badge>🚗 {a.driveMinutes} min</Badge>{/if}
    <Badge>⏱ {a.durationLabel}</Badge>
    <Badge>{fitLabel(a.fit)}</Badge>
    {#if a.windSensitive}<Badge>💨 sensível ao vento</Badge>{/if}
    {#if openToday === true}<Badge tone="ok">Aberto hoje</Badge>{:else if openToday === false}<Badge tone="bad">Fechado hoje</Badge>{/if}
  </div>

  {#if hint}
    <div class="flex items-center gap-2 rounded-xl p-3 {hint.positive ? 'bg-teal/12' : 'bg-black/5'} text-deep">
      <span class="text-xl">{hint.emoji}</span>
      <span class="text-sm">{hint.text}</span>
    </div>
  {/if}

  <a
    href={mapsUrl(a)}
    target="_blank"
    rel="noopener"
    class="flex items-center justify-center gap-2 rounded-xl bg-teal py-3 font-semibold text-white"
  >
    📍 Como chegar (Google Maps)
  </a>
  <div class="grid grid-cols-2 gap-2">
    <a
      href={googleReviewsUrl(a)}
      target="_blank"
      rel="noopener"
      class="flex items-center justify-center gap-1.5 rounded-xl border border-deep/20 bg-white py-2.5 text-sm font-medium text-deep"
    >
      <span class="text-amber-400">★</span> Avaliações Google
    </a>
    <a
      href={tripadvisorUrl(a)}
      target="_blank"
      rel="noopener"
      class="flex items-center justify-center gap-1.5 rounded-xl border border-deep/20 bg-white py-2.5 text-sm font-medium text-deep"
    >
      <span class="text-emerald-500">●</span> TripAdvisor
    </a>
  </div>
  {#if a.links}
    {#each a.links as l (l.url)}
      <a
        href={l.url}
        target="_blank"
        rel="noopener"
        class="flex items-center justify-center rounded-xl border border-deep/20 py-2.5 text-sm font-medium text-deep"
      >
        {l.label} ↗
      </a>
    {/each}
  {/if}

  <div class="flex gap-2">
    <button
      onclick={() => toggleFav(a.id)}
      class="flex-1 rounded-xl py-3 font-semibold {fav ? 'bg-amber-400 text-deep' : 'border border-amber-400 text-amber-600'}"
    >
      {fav ? '⭐ Quero ir' : '☆ Quero ir'}
    </button>
    <button
      onclick={() => toggleDone(a.id)}
      class="flex-1 rounded-xl py-3 font-semibold {done ? 'bg-forest text-white' : 'border border-forest text-forest'}"
    >
      {done ? '✓ Já fizemos' : 'Já fizemos'}
    </button>
  </div>

  {#if a.description}
    <section><h3 class="mb-1 font-bold">📖 Sobre</h3><p class="text-sm leading-relaxed text-deep/85">{a.description}</p></section>
  {/if}
  {#if a.history}
    <details class="rounded-2xl bg-white p-4 shadow-sm">
      <summary class="cursor-pointer font-bold marker:text-teal">📜 Mais sobre o local (história)</summary>
      <p class="mt-2 text-sm leading-relaxed text-deep/80">{a.history}</p>
    </details>
  {/if}
  {#if a.whatToDo?.length}
    <section><h3 class="mb-1 font-bold">✅ O que fazer</h3>{@render bullets(a.whatToDo)}</section>
  {/if}
  {#if a.whatToBring?.length}
    <section><h3 class="mb-1 font-bold">🎒 O que levar</h3>{@render bullets(a.whatToBring)}</section>
  {/if}
  {#if a.whatToWear?.length}
    <section><h3 class="mb-1 font-bold">🧥 O que vestir</h3>{@render bullets(a.whatToWear)}</section>
  {/if}
  {#if a.kingTip}
    <section class="rounded-2xl bg-ember p-4 text-white">
      <p class="font-bold">👑 Dica de rei</p>
      <p class="mt-1 text-sm">{a.kingTip}</p>
    </section>
  {/if}
  {#if a.whereToEat}
    <section><h3 class="mb-1 font-bold">🍽️ Onde comer por perto</h3><p class="text-sm text-deep/85">{a.whereToEat}</p></section>
  {/if}
  {#if a.hours?.note}
    <section><h3 class="mb-1 font-bold">🕒 Horários</h3><p class="text-sm text-deep/85">{a.hours.note}</p></section>
  {/if}

  <section>
    <h3 class="mb-1 font-bold">📝 Minhas anotações</h3>
    <p class="mb-1 text-xs text-deep/55">Cupom, promoção, lembrete… (fica só no aparelho)</p>
    <textarea
      value={note}
      oninput={onNote}
      rows="3"
      class="w-full rounded-xl border border-deep/15 bg-white p-3 text-sm outline-none focus:border-teal"
      placeholder="Escreva aqui…"
    ></textarea>
  </section>

  <section>
    <h3 class="mb-1 font-bold">📸 Fotos do local</h3>
    <p class="mb-2 text-xs text-deep/55">{photos.length} foto{photos.length === 1 ? '' : 's'} · só no aparelho, geolocalizadas pro álbum</p>

    {#if photos.length}
      <div class="mb-2 grid grid-cols-3 gap-2">
        {#each photos as p, i (p.id)}
          <button onclick={() => openLightbox(i)} class="relative aspect-square overflow-hidden rounded-lg bg-deep/10">
            {#if photoURLs[p.id]}
              <img src={photoURLs[p.id]} alt={p.caption ?? 'foto'} class="h-full w-full object-cover" loading="lazy" />
            {/if}
            {#if p.caption}
              <span class="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-0.5 text-left text-[10px] text-white">{p.caption}</span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}

    <div class="grid grid-cols-2 gap-2">
      <label class="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-teal py-2.5 text-sm font-semibold text-white">
        📷 Tirar foto
        <input type="file" accept="image/*" capture="environment" class="hidden" onchange={onPickPhoto} />
      </label>
      <label class="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-deep/20 bg-white py-2.5 text-sm font-semibold text-deep">
        🖼️ Da galeria
        <input type="file" accept="image/*" multiple class="hidden" onchange={onPickPhoto} />
      </label>
    </div>
  </section>

  <section>
    <h3 class="mb-1 font-bold">🎙️ Narrações</h3>
    <p class="mb-2 text-xs text-deep/55">{audios.length} áudio{audios.length === 1 ? '' : 's'} · grave contando o que tá vivendo</p>

    {#if audios.length}
      <ul class="mb-2 space-y-1.5">
        {#each audios as au (au.id)}
          <li class="flex items-center gap-2 rounded-xl bg-white p-2 shadow-sm">
            {#if audioURLs[au.id]}
              <audio src={audioURLs[au.id]} controls class="h-9 flex-1" preload="metadata"></audio>
            {/if}
            {#if au.durationMs}<span class="text-[11px] text-deep/55">{fmtDur(au.durationMs)}</span>{/if}
            <button onclick={() => deleteAudio(au.id)} class="grid h-8 w-8 place-items-center rounded-full text-deep/55 hover:bg-black/5" aria-label="Excluir">🗑️</button>
          </li>
        {/each}
      </ul>
    {/if}

    {#if recError}<p class="mb-1 text-xs text-red-600">{recError}</p>{/if}
    {#if !recording}
      <button onclick={startRecording} class="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400 py-2.5 text-sm font-semibold text-rose-600">
        🎤 Gravar narração
      </button>
    {:else}
      <div class="flex items-center justify-between gap-2 rounded-xl bg-rose-500 px-3 py-2.5 text-white">
        <span class="flex items-center gap-2 text-sm font-semibold">
          <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-white"></span>
          Gravando… {recElapsed}s
        </span>
        <button onclick={stopRecording} class="rounded-lg bg-white/20 px-3 py-1 text-sm font-bold">⏹ Parar</button>
      </div>
    {/if}
  </section>

  {#if credit}
    <p class="pt-1 text-center text-[11px] text-deep/40">📷 {credit}</p>
  {/if}
</main>

{#if lightboxIdx >= 0 && photos[lightboxIdx]}
  {@const cur = photos[lightboxIdx]}
  <div class="fixed inset-0 z-50 flex flex-col bg-black/95" role="dialog" aria-modal="true">
    <div class="flex items-center justify-between px-3 pb-2 text-white" style="padding-top: calc(env(safe-area-inset-top) + 0.5rem)">
      <span class="text-xs opacity-80">{lightboxIdx + 1} / {photos.length} · {new Date(cur.ts).toLocaleString('pt-BR')}</span>
      <button onclick={closeLightbox} class="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-2xl" aria-label="Fechar">×</button>
    </div>
    <div class="relative flex flex-1 items-center justify-center px-2">
      {#if photoURLs[cur.id]}
        <img src={photoURLs[cur.id]} alt={cur.caption ?? 'foto'} class="max-h-full max-w-full object-contain" />
      {/if}
      {#if lightboxIdx > 0}
        <button onclick={prevPhoto} class="absolute left-1 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-3xl text-white" aria-label="Anterior">‹</button>
      {/if}
      {#if lightboxIdx < photos.length - 1}
        <button onclick={nextPhoto} class="absolute right-1 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-3xl text-white" aria-label="Próxima">›</button>
      {/if}
    </div>
    <div class="space-y-2 bg-black/70 p-3 text-white" style="padding-bottom: calc(env(safe-area-inset-bottom) + 0.75rem)">
      <textarea
        bind:value={captionDraft}
        rows="2"
        placeholder="Legenda…"
        class="w-full rounded-lg bg-white/10 p-2 text-sm outline-none placeholder:text-white/50 focus:bg-white/15"
      ></textarea>
      <div class="flex items-center justify-between gap-2">
        <button onclick={saveCaption} class="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white">Salvar legenda</button>
        {#if cur.lat && cur.lng}<span class="text-[11px] text-white/55">📍 {cur.lat.toFixed(4)}, {cur.lng.toFixed(4)}</span>{/if}
        <button onclick={deleteOpenPhoto} class="rounded-lg border border-rose-400 px-3 py-1.5 text-xs font-semibold text-rose-300">🗑️ Excluir</button>
      </div>
    </div>
  </div>
{/if}
