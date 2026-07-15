import { browser } from '$app/environment';
import { loadWeather, type WeatherData } from './weather';

function load<T>(key: string, fallback: T): T {
  if (!browser) return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, val: unknown) {
  if (!browser) return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore */
  }
}

export const weatherStore = $state<{ loading: boolean; data: WeatherData | null }>({
  loading: true,
  data: null
});

export const doneStore = $state<{ ids: string[] }>({ ids: load<string[]>('gtl-done', []) });
export const favStore = $state<{ ids: string[] }>({ ids: load<string[]>('gtl-fav', []) });
export const notesStore = $state<{ map: Record<string, string> }>({
  map: load<Record<string, string>>('gtl-notes', {})
});

let started = false;
/** Fetch the forecast once per app load (network-first, cache fallback). */
export async function ensureWeather() {
  if (started && weatherStore.data) return;
  started = true;
  weatherStore.loading = true;
  weatherStore.data = await loadWeather(true);
  weatherStore.loading = false;
}

export async function refreshWeather() {
  weatherStore.loading = true;
  weatherStore.data = await loadWeather(true);
  weatherStore.loading = false;
}

export function isDone(id: string): boolean {
  return doneStore.ids.includes(id);
}
export function toggleDone(id: string) {
  const i = doneStore.ids.indexOf(id);
  if (i >= 0) doneStore.ids.splice(i, 1);
  else doneStore.ids.push(id);
  save('gtl-done', doneStore.ids);
}

export function isFav(id: string): boolean {
  return favStore.ids.includes(id);
}
export function toggleFav(id: string) {
  const i = favStore.ids.indexOf(id);
  if (i >= 0) favStore.ids.splice(i, 1);
  else favStore.ids.push(id);
  save('gtl-fav', favStore.ids);
}

export function getNote(id: string): string {
  return notesStore.map[id] ?? '';
}
export function setNote(id: string, value: string) {
  notesStore.map[id] = value;
  save('gtl-notes', notesStore.map);
}

// ───────── Sincronização entre os dois celulares (ver lib/sync.ts) ─────────

export interface SyncData {
  done: string[];
  fav: string[];
  notes: Record<string, string>;
}

export function exportSyncData(): SyncData {
  return { done: doneStore.ids, fav: favStore.ids, notes: notesStore.map };
}

/** Funde os dados vindos do outro celular: união de feitos/favoritos e merge de notas.
 *  Idempotente — importar o mesmo código duas vezes não duplica nada. */
export function mergeFromPeer(data: SyncData): { done: number; fav: number; notes: number } {
  let added = { done: 0, fav: 0, notes: 0 };
  for (const id of data.done ?? []) {
    if (!doneStore.ids.includes(id)) {
      doneStore.ids.push(id);
      added.done++;
    }
  }
  for (const id of data.fav ?? []) {
    if (!favStore.ids.includes(id)) {
      favStore.ids.push(id);
      added.fav++;
    }
  }
  for (const [id, text] of Object.entries(data.notes ?? {})) {
    if (!text) continue;
    const cur = notesStore.map[id] ?? '';
    if (!cur) {
      notesStore.map[id] = text;
      added.notes++;
    } else if (cur !== text && !cur.includes(text)) {
      notesStore.map[id] = `${cur}\n— do outro celular: ${text}`;
      added.notes++;
    }
  }
  save('gtl-done', doneStore.ids);
  save('gtl-fav', favStore.ids);
  save('gtl-notes', notesStore.map);
  return added;
}
