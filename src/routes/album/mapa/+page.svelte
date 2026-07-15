<script lang="ts">
  import { base } from '$app/paths';
  import { onDestroy, onMount } from 'svelte';
  import TopBar from '$lib/components/TopBar.svelte';
  import {
    listAllPhotos,
    getPhotoURL,
    type MediaMeta
  } from '$lib/diary.svelte';
  import { attractionById } from '$lib/content';

  let mapEl: HTMLDivElement | null = null;
  let leafletMap: any = null;
  let L: any = null;
  let gpsPhotos: MediaMeta[] = [];
  let markerByKey: Map<string, any> = new Map();
  let routeLine: any = null;
  let loading = $state(true);
  let noGPS = $state(false);
  let total = $state(0);
  let playing = $state(false);
  let urls: Record<string, string> = {};

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Puerto Varas region center (Lago Llanquihue)
  const FALLBACK_CENTER: [number, number] = [-41.32, -72.98];

  function placeName(id: string): string {
    return attractionById(id)?.name ?? id;
  }

  async function init() {
    if (!mapEl) return;
    // Dynamic import → Leaflet only loads on this page (saves ~40KB elsewhere)
    L = (await import('leaflet')).default;
    // CSS via CDN (so we don't have to wire it through Vite)
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.setAttribute('data-leaflet-css', '1');
      document.head.appendChild(link);
    }

    const all = await listAllPhotos();
    total = all.length;
    const withGPS = all
      .filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number')
      .sort((a, b) => a.ts - b.ts);
    gpsPhotos = withGPS;

    if (withGPS.length === 0) {
      noGPS = true;
      loading = false;
      return;
    }

    // Bounds
    const lats = withGPS.map((p) => p.lat!);
    const lngs = withGPS.map((p) => p.lng!);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const bounds: [[number, number], [number, number]] = [[minLat, minLng], [maxLat, maxLng]];

    leafletMap = L.map(mapEl).fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    if (lats.length === 1) leafletMap.setView([lats[0], lngs[0]], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18
    }).addTo(leafletMap);

    // Group close-by photos (simple round to 4 decimals ≈ 11 m)
    const groups = new Map<string, MediaMeta[]>();
    for (const p of withGPS) {
      const k = `${p.lat!.toFixed(4)},${p.lng!.toFixed(4)}`;
      const arr = groups.get(k) ?? [];
      arr.push(p);
      groups.set(k, arr);
    }

    for (const [, members] of groups) {
      const lead = members[0];
      const url = await getPhotoURL(lead.id);
      if (url) urls[lead.id] = url;
      const html = `
        <div style="background:#fff;border:2px solid #0E7C7B;border-radius:8px;overflow:hidden;width:48px;height:48px;box-shadow:0 2px 8px rgba(0,0,0,.25)">
          ${url ? `<img src="${url}" style="width:100%;height:100%;object-fit:cover" />` : ''}
          ${members.length > 1 ? `<span style="position:absolute;right:-6px;top:-6px;background:#E89651;color:#fff;border-radius:9999px;font-size:10px;font-weight:700;padding:1px 5px">${members.length}</span>` : ''}
        </div>`;
      const icon = L.divIcon({ html, className: '', iconSize: [48, 48], iconAnchor: [24, 24] });
      const marker = L.marker([lead.lat!, lead.lng!], { icon }).addTo(leafletMap);
      markerByKey.set(`${lead.lat!.toFixed(4)},${lead.lng!.toFixed(4)}`, marker);
      const placeIds = Array.from(new Set(members.map((m) => m.placeId)));
      const placeLinks = placeIds
        .map((pid) => `<a href="${base}/local/${pid}" style="color:#0E7C7B;text-decoration:underline;font-weight:600">${placeName(pid)}</a>`)
        .join(' · ');
      marker.bindPopup(`
        <div style="min-width:160px;font:13px system-ui">
          ${url ? `<img src="${url}" style="width:100%;height:120px;object-fit:cover;border-radius:6px;margin-bottom:6px" />` : ''}
          <div>${placeLinks}</div>
          <div style="color:#888;font-size:11px;margin-top:4px">${members.length} foto${members.length > 1 ? 's' : ''} · ${new Date(lead.ts).toLocaleString('pt-BR')}</div>
        </div>`);
    }

    loading = false;
  }

  async function playRoute() {
    if (playing || !leafletMap || gpsPhotos.length < 1) return;
    playing = true;

    // Chronological sequence of distinct locations
    const seq: { lat: number; lng: number; key: string }[] = [];
    for (const p of gpsPhotos) {
      const key = `${p.lat!.toFixed(4)},${p.lng!.toFixed(4)}`;
      if (!seq.length || seq[seq.length - 1].key !== key) {
        seq.push({ lat: p.lat!, lng: p.lng!, key });
      }
    }

    // Reset route line
    if (routeLine) {
      routeLine.remove();
      routeLine = null;
    }
    routeLine = L.polyline([], { color: '#E89651', weight: 4, opacity: 0.9 }).addTo(leafletMap);

    leafletMap.closePopup();
    for (let i = 0; i < seq.length && playing; i++) {
      const pt = seq[i];
      leafletMap.flyTo([pt.lat, pt.lng], 14, { duration: 1.2 });
      await wait(1300);
      if (!playing) break;
      routeLine.addLatLng([pt.lat, pt.lng]);
      const mk = markerByKey.get(pt.key);
      if (mk) mk.openPopup();
      await wait(1500);
    }
    playing = false;
  }

  function stopRoute() {
    playing = false;
  }

  onMount(init);
  onDestroy(() => {
    if (leafletMap) leafletMap.remove();
    for (const url of Object.values(urls)) URL.revokeObjectURL(url);
  });
</script>

<TopBar title="Mapa das fotos" />

<main class="relative" style="height: calc(100dvh - 4rem)">
  <div bind:this={mapEl} class="h-full w-full"></div>

  {#if loading}
    <div class="absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-white px-4 py-2 text-xs shadow">Carregando mapa…</div>
  {/if}

  {#if noGPS}
    <div class="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 text-center shadow-xl">
      <p class="text-4xl">📍</p>
      <p class="mt-2 font-bold">Nenhuma foto com GPS</p>
      <p class="mt-1 text-sm text-deep/65">{total === 0 ? 'Tire fotos pelos locais e elas aparecerão aqui no mapa.' : 'Suas fotos não têm coordenadas — permita o GPS no app pra georreferenciar próximas capturas.'}</p>
      <a href="{base}/album" class="mt-4 inline-block rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white">Voltar ao álbum</a>
    </div>
  {/if}

  {#if !loading && !noGPS}
    <div class="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex justify-center p-4" style="padding-bottom: calc(env(safe-area-inset-bottom) + 1rem)">
      {#if !playing}
        <button onclick={playRoute} class="pointer-events-auto flex items-center gap-2 rounded-full bg-ember px-5 py-3 font-semibold text-white shadow-lg">
          🎬 Reproduzir trajeto
        </button>
      {:else}
        <button onclick={stopRoute} class="pointer-events-auto flex items-center gap-2 rounded-full bg-rose-500 px-5 py-3 font-semibold text-white shadow-lg">
          ⏹ Parar
        </button>
      {/if}
    </div>
  {/if}
</main>
