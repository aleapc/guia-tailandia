<script lang="ts">
  import { base } from '$app/paths';
  import { onDestroy, onMount } from 'svelte';
  import TopBar from '$lib/components/TopBar.svelte';
  import {
    listAllPhotos,
    listAllAudios,
    getPhotoURL,
    getAudioURL,
    getPhotoBlob,
    getAudioBlob,
    removePhoto,
    removeAudio,
    type MediaMeta
  } from '$lib/diary.svelte';
  import { attractionById } from '$lib/content';
  import { getNote } from '$lib/state.svelte';
  import { renderDayVideo, videoSupported } from '$lib/makeVideo';

  interface DayGroup {
    dayKey: string; // YYYY-MM-DD
    label: string;
    photos: MediaMeta[];
    audios: MediaMeta[];
    placeIds: string[];
  }

  let days = $state<DayGroup[]>([]);
  let photoURLs = $state<Record<string, string>>({});
  let audioURLs = $state<Record<string, string>>({});
  let lightboxList = $state<MediaMeta[]>([]); // flat list for the open day
  let lightboxIdx = $state(-1);
  let loading = $state(true);

  function dayKey(ts: number): string {
    return new Date(ts).toISOString().slice(0, 10);
  }
  function dayLabel(ts: number): string {
    return new Date(ts).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
  }
  function timeLabel(ts: number): string {
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function fmtDur(ms?: number): string {
    if (!ms) return '';
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  function placeName(id: string): string {
    return attractionById(id)?.name ?? id;
  }

  async function refresh() {
    loading = true;
    const [ps, as] = await Promise.all([listAllPhotos(), listAllAudios()]);
    // Group by day key
    const map = new Map<string, DayGroup>();
    const sortedAll = [...ps, ...as].sort((a, b) => a.ts - b.ts);
    for (const m of sortedAll) {
      const k = dayKey(m.ts);
      let g = map.get(k);
      if (!g) {
        g = { dayKey: k, label: dayLabel(m.ts), photos: [], audios: [], placeIds: [] };
        map.set(k, g);
      }
      const isPhoto = m.id.startsWith('p_');
      if (isPhoto) g.photos.push(m);
      else g.audios.push(m);
      if (!g.placeIds.includes(m.placeId)) g.placeIds.push(m.placeId);
    }
    days = Array.from(map.values()).sort((a, b) => a.dayKey.localeCompare(b.dayKey));

    // Materialize URLs (photos and audios)
    const newPhotoURLs: Record<string, string> = {};
    for (const p of ps) {
      const u = await getPhotoURL(p.id);
      if (u) newPhotoURLs[p.id] = u;
    }
    revoke(photoURLs, newPhotoURLs);
    photoURLs = newPhotoURLs;

    const newAudioURLs: Record<string, string> = {};
    for (const a of as) {
      const u = await getAudioURL(a.id);
      if (u) newAudioURLs[a.id] = u;
    }
    revoke(audioURLs, newAudioURLs);
    audioURLs = newAudioURLs;

    loading = false;
  }

  function revoke(oldMap: Record<string, string>, newMap: Record<string, string>) {
    for (const [k, url] of Object.entries(oldMap)) {
      if (newMap[k] !== url) URL.revokeObjectURL(url);
    }
  }

  function openLightbox(dayPhotos: MediaMeta[], idx: number) {
    lightboxList = dayPhotos;
    lightboxIdx = idx;
  }
  function closeLightbox() {
    lightboxIdx = -1;
    lightboxList = [];
  }
  function prevPhoto() {
    if (lightboxIdx > 0) lightboxIdx -= 1;
  }
  function nextPhoto() {
    if (lightboxIdx < lightboxList.length - 1) lightboxIdx += 1;
  }
  async function deleteOpen() {
    const cur = lightboxList[lightboxIdx];
    if (!cur) return;
    if (!confirm('Remover esta foto do álbum?')) return;
    await removePhoto(cur.id);
    closeLightbox();
    await refresh();
  }
  async function deleteAudioFromAlbum(id: string) {
    if (!confirm('Remover esta narração?')) return;
    await removeAudio(id);
    await refresh();
  }

  // ─── Slideshow (Fase 6) ───
  let showDay = $state<DayGroup | null>(null);
  let slideIdx = $state(0);
  let slidePlaying = $state(false);
  let slideTimer: ReturnType<typeof setTimeout> | null = null;
  let slideAudio: HTMLAudioElement | null = null;
  let slideAudioQueue: string[] = [];
  let slideAudioPos = 0;
  const SLIDE_MS = 4000;

  function startSlideshow(d: DayGroup) {
    if (!d.photos.length) return;
    showDay = d;
    slideIdx = 0;
    slidePlaying = true;
    slideAudioQueue = d.audios.map((a) => audioURLs[a.id]).filter(Boolean);
    slideAudioPos = 0;
    playNextSlideAudio();
    scheduleSlide();
  }
  function scheduleSlide() {
    if (slideTimer) clearTimeout(slideTimer);
    slideTimer = setTimeout(() => {
      if (!showDay || !slidePlaying) return;
      if (slideIdx < showDay.photos.length - 1) {
        slideIdx += 1;
        scheduleSlide();
      } else {
        slidePlaying = false; // reached the end
      }
    }, SLIDE_MS);
  }
  function playNextSlideAudio() {
    if (slideAudioPos >= slideAudioQueue.length) return;
    if (!slideAudio) slideAudio = new Audio();
    slideAudio.src = slideAudioQueue[slideAudioPos];
    slideAudio.play().catch(() => {});
    slideAudio.onended = () => {
      slideAudioPos += 1;
      playNextSlideAudio();
    };
  }
  function toggleSlidePlay() {
    slidePlaying = !slidePlaying;
    if (slidePlaying) {
      slideAudio?.play().catch(() => {});
      scheduleSlide();
    } else {
      if (slideTimer) clearTimeout(slideTimer);
      slideAudio?.pause();
    }
  }
  function closeSlideshow() {
    slidePlaying = false;
    if (slideTimer) clearTimeout(slideTimer);
    slideTimer = null;
    if (slideAudio) {
      slideAudio.pause();
      slideAudio.onended = null;
      slideAudio = null;
    }
    showDay = null;
  }

  // ─── Video (Fase 8) ───
  let canVideo = $state(true);
  let videoBusy = $state(false);
  let videoMsg = $state('');

  async function makeDayVideo(d: DayGroup) {
    if (videoBusy) return;
    const vphotos = d.photos
      .map((p) => ({ url: photoURLs[p.id], caption: p.caption, placeName: placeName(p.placeId), ts: p.ts }))
      .filter((p) => p.url);
    if (!vphotos.length) {
      alert('Esse dia não tem fotos pra montar o vídeo.');
      return;
    }
    videoBusy = true;
    videoMsg = 'Iniciando…';
    try {
      const audioUrls = d.audios.map((a) => audioURLs[a.id]).filter(Boolean);
      const blob = await renderDayVideo({
        photos: vphotos,
        audioUrls,
        title: d.label,
        onProgress: (m) => (videoMsg = m)
      });
      const url = URL.createObjectURL(blob);
      const extn = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const aEl = document.createElement('a');
      aEl.href = url;
      aEl.download = `viagem-${d.dayKey}.${extn}`;
      document.body.appendChild(aEl);
      aEl.click();
      aEl.remove();
      setTimeout(() => URL.revokeObjectURL(url), 6000);
      videoMsg = '';
    } catch (err) {
      console.error('video failed', err);
      videoMsg = 'Falha — use o ZIP e monte no PC.';
      setTimeout(() => (videoMsg = ''), 4000);
    } finally {
      videoBusy = false;
    }
  }

  // ─── Storage + clear all (Fase 9) ───
  let storagePct = $state<number | null>(null);
  async function refreshStorage() {
    try {
      if (navigator.storage?.estimate) {
        const { usage, quota } = await navigator.storage.estimate();
        if (usage && quota) storagePct = Math.round((usage / quota) * 100);
      }
    } catch {
      /* ignore */
    }
  }
  async function clearAllMedia() {
    if (!confirm('Isto vai apagar TODAS as fotos e narrações do álbum neste aparelho. Tem certeza?')) return;
    if (!confirm('Última confirmação: apagar tudo mesmo? Não dá pra desfazer.')) return;
    const [ps, as] = await Promise.all([listAllPhotos(), listAllAudios()]);
    for (const p of ps) await removePhoto(p.id);
    for (const a of as) await removeAudio(a.id);
    await refresh();
    await refreshStorage();
  }

  onMount(async () => {
    canVideo = videoSupported();
    await refresh();
    await refreshStorage();
  });
  onDestroy(() => {
    closeSlideshow();
    for (const url of Object.values(photoURLs)) URL.revokeObjectURL(url);
    for (const url of Object.values(audioURLs)) URL.revokeObjectURL(url);
  });

  const totalPhotos = $derived(days.reduce((acc, d) => acc + d.photos.length, 0));
  const totalAudios = $derived(days.reduce((acc, d) => acc + d.audios.length, 0));

  // ─── Export ZIP ───
  let exporting = $state(false);
  let exportProgress = $state('');

  function safe(name: string): string {
    return name.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 80);
  }
  function ext(mime: string | undefined, fallback: string): string {
    if (!mime) return fallback;
    const m = mime.toLowerCase();
    if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
    if (m.includes('png')) return 'png';
    if (m.includes('webp')) return 'webp';
    if (m.includes('heic')) return 'heic';
    if (m.includes('mp4')) return 'm4a';
    if (m.includes('webm')) return 'webm';
    if (m.includes('aac')) return 'aac';
    return fallback;
  }

  async function exportZip() {
    exporting = true;
    exportProgress = 'Preparando…';
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      const [allPhotos, allAudios] = await Promise.all([listAllPhotos(), listAllAudios()]);

      // Manifest accumulators
      const manifest: any = {
        exportedAt: new Date().toISOString(),
        totals: { photos: allPhotos.length, audios: allAudios.length, days: days.length },
        days: [] as any[]
      };

      let processed = 0;
      const totalItems = allPhotos.length + allAudios.length;

      for (const d of days) {
        const dayDir = d.dayKey; // e.g. "2026-06-04"
        const dayEntry: any = {
          day: d.dayKey,
          label: d.label,
          places: [],
          photos: [],
          audios: [],
          notes: {}
        };

        // Group by placeId within the day for cleaner folders
        const placeBuckets = new Map<string, { photos: MediaMeta[]; audios: MediaMeta[] }>();
        for (const p of d.photos) {
          const b = placeBuckets.get(p.placeId) ?? { photos: [], audios: [] };
          b.photos.push(p);
          placeBuckets.set(p.placeId, b);
        }
        for (const au of d.audios) {
          const b = placeBuckets.get(au.placeId) ?? { photos: [], audios: [] };
          b.audios.push(au);
          placeBuckets.set(au.placeId, b);
        }

        for (const [placeId, bucket] of placeBuckets) {
          const att = attractionById(placeId);
          const placeName = att?.name ?? placeId;
          const placeFolder = `${dayDir}/${safe(placeName)}`;
          dayEntry.places.push({ id: placeId, name: placeName });

          // Anotações do local
          const note = getNote(placeId);
          if (note) {
            zip.file(`${placeFolder}/anotacoes.txt`, note);
            dayEntry.notes[placeId] = note;
          }

          for (const p of bucket.photos) {
            const blob = await getPhotoBlob(p.id);
            if (!blob) continue;
            const fname = `foto_${new Date(p.ts).toISOString().replace(/[:.]/g, '-')}.${ext(p.mime, 'jpg')}`;
            zip.file(`${placeFolder}/${fname}`, blob);
            dayEntry.photos.push({
              file: `${placeFolder}/${fname}`,
              placeId,
              placeName,
              ts: p.ts,
              lat: p.lat,
              lng: p.lng,
              caption: p.caption ?? null
            });
            processed++;
            exportProgress = `${processed}/${totalItems} arquivos…`;
          }

          for (const au of bucket.audios) {
            const blob = await getAudioBlob(au.id);
            if (!blob) continue;
            const fname = `audio_${new Date(au.ts).toISOString().replace(/[:.]/g, '-')}.${ext(au.mime, 'webm')}`;
            zip.file(`${placeFolder}/${fname}`, blob);
            dayEntry.audios.push({
              file: `${placeFolder}/${fname}`,
              placeId,
              placeName,
              ts: au.ts,
              lat: au.lat,
              lng: au.lng,
              durationMs: au.durationMs ?? null
            });
            processed++;
            exportProgress = `${processed}/${totalItems} arquivos…`;
          }
        }

        manifest.days.push(dayEntry);
      }

      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      zip.file(
        'README.txt',
        [
          'Álbum da viagem — Puerto Varas',
          `Exportado em: ${new Date().toLocaleString('pt-BR')}`,
          '',
          'Estrutura:',
          '  YYYY-MM-DD/Nome do Local/foto_*.jpg',
          '  YYYY-MM-DD/Nome do Local/audio_*.webm',
          '  YYYY-MM-DD/Nome do Local/anotacoes.txt',
          '',
          'O manifest.json tem toda a metadata (timestamps, GPS, legendas, durações).',
          '',
          'Dica: alimente esse ZIP no ChatGPT/Claude e peça pra montar um álbum narrado ou roteiro de vídeo.'
        ].join('\n')
      );

      exportProgress = 'Comprimindo…';
      const out = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = URL.createObjectURL(out);
      const aEl = document.createElement('a');
      aEl.href = url;
      aEl.download = `viagem-puerto-varas-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(aEl);
      aEl.click();
      aEl.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      exportProgress = '';
    } catch (err) {
      console.error('export failed', err);
      exportProgress = 'Falha ao exportar';
      setTimeout(() => (exportProgress = ''), 3000);
    } finally {
      exporting = false;
    }
  }
</script>

<TopBar title="Álbum da viagem" />

<main class="space-y-5 p-4 pb-16">
  {#if loading}
    <p class="py-8 text-center text-sm text-deep/60">Carregando suas mídias…</p>
  {:else if days.length === 0}
    <div class="rounded-2xl bg-white p-6 text-center shadow-sm">
      <p class="text-5xl">📷</p>
      <p class="mt-3 font-bold">Seu álbum ainda está vazio</p>
      <p class="mt-1 text-sm text-deep/65">Quando vocês tirarem fotos ou gravarem narrações em cada local, elas aparecem aqui agrupadas por dia.</p>
      <a href="{base}/" class="mt-4 inline-block rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white">Explorar locais</a>
    </div>
  {:else}
    <p class="text-center text-xs text-deep/55">{totalPhotos} foto{totalPhotos === 1 ? '' : 's'} · {totalAudios} narraç{totalAudios === 1 ? 'ão' : 'ões'} · {days.length} dia{days.length === 1 ? '' : 's'}</p>

    {#if storagePct !== null && storagePct >= 80}
      <div class="rounded-xl bg-amber-100 p-3 text-xs text-amber-900">
        ⚠️ Armazenamento do aparelho em <strong>{storagePct}%</strong>. Baixe o ZIP da viagem e considere limpar mídias já salvas pra liberar espaço.
      </div>
    {/if}

    {#if videoBusy}
      <div class="flex items-center gap-2 rounded-xl bg-deep p-3 text-sm text-white">
        <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-white"></span>
        {videoMsg || 'Gerando vídeo…'} — mantenha esta tela aberta.
      </div>
    {:else if videoMsg}
      <div class="rounded-xl bg-black/5 p-2 text-center text-xs text-deep/70">{videoMsg}</div>
    {/if}

    {#each days as d (d.dayKey)}
      <section>
        <div class="mb-2 flex items-baseline justify-between">
          <h2 class="text-lg font-bold capitalize">{d.label}</h2>
          <span class="text-xs text-deep/55">{d.photos.length} 📷 · {d.audios.length} 🎙️</span>
        </div>

        {#if d.placeIds.length}
          <p class="mb-2 text-xs text-deep/60">
            <span class="font-semibold">Locais:</span>
            {#each d.placeIds as pid, i (pid)}
              {#if i > 0}<span class="text-deep/30"> · </span>{/if}
              <a href="{base}/local/{pid}" class="text-teal underline-offset-2 hover:underline">{placeName(pid)}</a>
            {/each}
          </p>
        {/if}

        {#if d.photos.length}
          <div class="mb-2 grid grid-cols-3 gap-1.5">
            {#each d.photos as p, i (p.id)}
              <button onclick={() => openLightbox(d.photos, i)} class="relative aspect-square overflow-hidden rounded-lg bg-deep/10">
                {#if photoURLs[p.id]}
                  <img src={photoURLs[p.id]} alt={p.caption ?? 'foto'} class="h-full w-full object-cover" loading="lazy" />
                {/if}
                <span class="absolute right-1 top-1 rounded-md bg-black/55 px-1 text-[10px] text-white">{timeLabel(p.ts)}</span>
              </button>
            {/each}
          </div>
        {/if}

        {#if d.audios.length}
          <ul class="space-y-1.5">
            {#each d.audios as au (au.id)}
              <li class="flex items-center gap-2 rounded-xl bg-white p-2 shadow-sm">
                <span class="text-xs text-deep/55">{timeLabel(au.ts)}</span>
                <span class="text-xs font-semibold text-deep/70 truncate max-w-[7rem]">{placeName(au.placeId)}</span>
                {#if audioURLs[au.id]}
                  <audio src={audioURLs[au.id]} controls class="h-9 flex-1" preload="metadata"></audio>
                {/if}
                {#if au.durationMs}<span class="text-[11px] text-deep/55">{fmtDur(au.durationMs)}</span>{/if}
                <button onclick={() => deleteAudioFromAlbum(au.id)} class="grid h-8 w-8 place-items-center rounded-full text-deep/55" aria-label="Excluir">🗑️</button>
              </li>
            {/each}
          </ul>
        {/if}

        {#if d.photos.length}
          <div class="mt-2 flex gap-2">
            <button onclick={() => startSlideshow(d)} class="flex-1 rounded-xl bg-teal py-2 text-sm font-semibold text-white">▶️ Slideshow</button>
            {#if canVideo}
              <button onclick={() => makeDayVideo(d)} disabled={videoBusy} class="flex-1 rounded-xl border border-deep/20 bg-white py-2 text-sm font-semibold text-deep disabled:opacity-60">🎬 Gerar vídeo</button>
            {/if}
          </div>
        {/if}
      </section>
    {/each}

    <div class="space-y-2 pt-2">
      <a href="{base}/album/mapa" class="flex items-center justify-center gap-2 rounded-xl border border-deep/20 bg-white py-2.5 text-sm font-semibold text-deep">🗺️ Mapa das fotos</a>
      <button
        onclick={exportZip}
        disabled={exporting}
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {#if exporting}⏳ {exportProgress || 'Exportando…'}{:else}💾 Baixar viagem inteira (ZIP){/if}
      </button>
      <p class="text-center text-[11px] text-deep/45">Gera um ZIP com fotos + áudios + notas organizados por dia. Use no PC pra montar o álbum/vídeo final.</p>
      {#if !canVideo}
        <p class="text-center text-[11px] text-deep/45">ℹ️ Este aparelho não gera vídeo no navegador — use o ZIP e monte no computador (fica bem melhor).</p>
      {/if}
      <button onclick={clearAllMedia} class="mt-1 w-full rounded-xl border border-rose-300 py-2 text-xs font-semibold text-rose-600">🧹 Limpar todas as mídias do aparelho</button>
      {#if storagePct !== null}
        <p class="text-center text-[11px] text-deep/40">Armazenamento usado no aparelho: {storagePct}%</p>
      {/if}
    </div>
  {/if}
</main>

{#if showDay}
  <div class="fixed inset-0 z-50 flex flex-col bg-black" role="dialog" aria-modal="true">
    <div class="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 pb-2 text-white" style="padding-top: calc(env(safe-area-inset-top) + 0.5rem)">
      <span class="rounded-full bg-black/40 px-3 py-1 text-xs capitalize">{showDay.label} · {slideIdx + 1}/{showDay.photos.length}</span>
      <button onclick={closeSlideshow} class="grid h-9 w-9 place-items-center rounded-full bg-black/40 text-2xl" aria-label="Fechar">×</button>
    </div>
    <div class="relative flex-1 overflow-hidden">
      {#each showDay.photos as p, i (p.id)}
        {#if i === slideIdx && photoURLs[p.id]}
          <img
            src={photoURLs[p.id]}
            alt={p.caption ?? 'foto'}
            class="kenburns absolute inset-0 h-full w-full object-contain"
          />
          {#if p.caption}
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pb-20 text-center text-lg font-semibold text-white">
              {p.caption}
            </div>
          {/if}
        {/if}
      {/each}
    </div>
    <div class="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 p-4 pb-8 text-white">
      <button onclick={toggleSlidePlay} class="grid h-14 w-14 place-items-center rounded-full bg-white/20 text-2xl">
        {slidePlaying ? '⏸' : '▶️'}
      </button>
    </div>
  </div>
{/if}

{#if lightboxIdx >= 0 && lightboxList[lightboxIdx]}
  {@const cur = lightboxList[lightboxIdx]}
  <div class="fixed inset-0 z-50 flex flex-col bg-black/95" role="dialog" aria-modal="true">
    <div class="flex items-center justify-between px-3 pb-2 text-white" style="padding-top: calc(env(safe-area-inset-top) + 0.5rem)">
      <span class="text-xs opacity-80">{lightboxIdx + 1}/{lightboxList.length} · {placeName(cur.placeId)} · {new Date(cur.ts).toLocaleString('pt-BR')}</span>
      <button onclick={closeLightbox} class="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-2xl" aria-label="Fechar">×</button>
    </div>
    <div class="relative flex flex-1 items-center justify-center px-2">
      {#if photoURLs[cur.id]}
        <img src={photoURLs[cur.id]} alt={cur.caption ?? 'foto'} class="max-h-full max-w-full object-contain" />
      {/if}
      {#if lightboxIdx > 0}
        <button onclick={prevPhoto} class="absolute left-1 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-3xl text-white" aria-label="Anterior">‹</button>
      {/if}
      {#if lightboxIdx < lightboxList.length - 1}
        <button onclick={nextPhoto} class="absolute right-1 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-3xl text-white" aria-label="Próxima">›</button>
      {/if}
    </div>
    <div class="space-y-1 bg-black/70 p-3 text-white" style="padding-bottom: calc(env(safe-area-inset-bottom) + 0.75rem)">
      {#if cur.caption}<p class="text-sm">{cur.caption}</p>{/if}
      <div class="flex items-center justify-between gap-2 text-[11px] text-white/55">
        {#if cur.lat && cur.lng}<span>📍 {cur.lat.toFixed(4)}, {cur.lng.toFixed(4)}</span>{:else}<span>📍 sem GPS</span>{/if}
        <a href="{base}/local/{cur.placeId}" class="rounded-md bg-white/10 px-2 py-1 text-white">Abrir local →</a>
        <button onclick={deleteOpen} class="rounded-md border border-rose-400 px-2 py-1 text-rose-300">🗑️ Excluir</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .kenburns {
    animation: kenburns 4.6s ease-out forwards;
  }
  @keyframes kenburns {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(1.08);
    }
  }
</style>
