import { browser } from '$app/environment';
import localforage from 'localforage';
import { encryptBlob, decryptBlob, hasKey } from './secure.svelte';

// Travel diary: many photos + audios per place, stored only on the device (IndexedDB).
// Blobs are AES-GCM encrypted at rest when a PIN is active (see secure.svelte.ts).
// Meta (placeId / timestamp / GPS / caption) is stored in plaintext so we can list/sort efficiently.

export interface MediaMeta {
  id: string; // unique
  placeId: string;
  ts: number; // epoch ms when captured
  lat?: number;
  lng?: number;
  caption?: string;
  mime?: string; // original blob MIME (since encrypted blob loses it)
  durationMs?: number; // for audios
}

export interface MediaRecord extends MediaMeta {
  blob: Blob; // possibly encrypted (application/x-gtl-enc;orig=...)
}

const photos = browser ? localforage.createInstance({ name: 'gtl', storeName: 'placephotos' }) : null;
const audios = browser ? localforage.createInstance({ name: 'gtl', storeName: 'placeaudios' }) : null;

function newId(prefix: 'p' | 'a'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Try to read current GPS once. Resolves to null if unavailable / denied / too slow. */
export function captureGPS(timeoutMs = 4000): Promise<{ lat: number; lng: number } | null> {
  if (!browser || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    const done = (v: { lat: number; lng: number } | null) => {
      clearTimeout(t);
      resolve(v);
    };
    const t = setTimeout(() => done(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (p) => done({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => done(null),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: timeoutMs }
    );
  });
}

// ─────────────── PHOTOS ───────────────

export async function addPlacePhoto(
  placeId: string,
  blob: Blob,
  opts: { lat?: number; lng?: number; caption?: string; ts?: number } = {}
): Promise<MediaMeta> {
  if (!photos) throw new Error('not browser');
  const encBlob = await encryptBlob(blob);
  const rec: MediaRecord = {
    id: newId('p'),
    placeId,
    ts: opts.ts ?? Date.now(),
    lat: opts.lat,
    lng: opts.lng,
    caption: opts.caption,
    mime: blob.type || 'image/jpeg',
    blob: encBlob
  };
  await photos.setItem(rec.id, rec);
  return stripBlob(rec);
}

export async function listPlacePhotos(placeId: string): Promise<MediaMeta[]> {
  if (!photos) return [];
  await migrateLegacyPhotos();
  const out: MediaMeta[] = [];
  await photos.iterate<MediaRecord, void>((val) => {
    if (val && typeof val === 'object' && 'placeId' in val && val.placeId === placeId) {
      out.push(stripBlob(val));
    }
  });
  return out.sort((a, b) => a.ts - b.ts);
}

export async function listAllPhotos(): Promise<MediaMeta[]> {
  if (!photos) return [];
  await migrateLegacyPhotos();
  const out: MediaMeta[] = [];
  await photos.iterate<MediaRecord, void>((val) => {
    if (val && typeof val === 'object' && 'placeId' in val) {
      out.push(stripBlob(val));
    }
  });
  return out.sort((a, b) => a.ts - b.ts);
}

/** Materialize a usable object URL for a stored photo (decrypts on the fly). */
export async function getPhotoURL(id: string): Promise<string | null> {
  if (!photos) return null;
  const rec = await photos.getItem<MediaRecord>(id);
  if (!rec) return null;
  let blob = rec.blob;
  if (blob.type.includes('x-gtl-enc')) {
    if (!hasKey()) return null; // locked → cannot decrypt
    blob = await decryptBlob(blob);
  }
  return URL.createObjectURL(blob);
}

export async function getPhotoBlob(id: string): Promise<Blob | null> {
  if (!photos) return null;
  const rec = await photos.getItem<MediaRecord>(id);
  if (!rec) return null;
  let blob = rec.blob;
  if (blob.type.includes('x-gtl-enc')) {
    if (!hasKey()) return null;
    blob = await decryptBlob(blob);
  }
  return blob;
}

export async function removePhoto(id: string): Promise<void> {
  if (photos) await photos.removeItem(id);
}

export async function setPhotoCaption(id: string, caption: string): Promise<void> {
  if (!photos) return;
  const rec = await photos.getItem<MediaRecord>(id);
  if (!rec) return;
  rec.caption = caption;
  await photos.setItem(id, rec);
}

// ─────────────── AUDIOS ───────────────

export async function addPlaceAudio(
  placeId: string,
  blob: Blob,
  opts: { lat?: number; lng?: number; durationMs?: number; ts?: number } = {}
): Promise<MediaMeta> {
  if (!audios) throw new Error('not browser');
  const encBlob = await encryptBlob(blob);
  const rec: MediaRecord = {
    id: newId('a'),
    placeId,
    ts: opts.ts ?? Date.now(),
    lat: opts.lat,
    lng: opts.lng,
    mime: blob.type || 'audio/webm',
    durationMs: opts.durationMs,
    blob: encBlob
  };
  await audios.setItem(rec.id, rec);
  return stripBlob(rec);
}

export async function listPlaceAudios(placeId: string): Promise<MediaMeta[]> {
  if (!audios) return [];
  const out: MediaMeta[] = [];
  await audios.iterate<MediaRecord, void>((val) => {
    if (val && val.placeId === placeId) out.push(stripBlob(val));
  });
  return out.sort((a, b) => a.ts - b.ts);
}

export async function listAllAudios(): Promise<MediaMeta[]> {
  if (!audios) return [];
  const out: MediaMeta[] = [];
  await audios.iterate<MediaRecord, void>((val) => {
    if (val && val.placeId) out.push(stripBlob(val));
  });
  return out.sort((a, b) => a.ts - b.ts);
}

export async function getAudioURL(id: string): Promise<string | null> {
  if (!audios) return null;
  const rec = await audios.getItem<MediaRecord>(id);
  if (!rec) return null;
  let blob = rec.blob;
  if (blob.type.includes('x-gtl-enc')) {
    if (!hasKey()) return null;
    blob = await decryptBlob(blob);
  }
  return URL.createObjectURL(blob);
}

export async function getAudioBlob(id: string): Promise<Blob | null> {
  if (!audios) return null;
  const rec = await audios.getItem<MediaRecord>(id);
  if (!rec) return null;
  let blob = rec.blob;
  if (blob.type.includes('x-gtl-enc')) {
    if (!hasKey()) return null;
    blob = await decryptBlob(blob);
  }
  return blob;
}

export async function removeAudio(id: string): Promise<void> {
  if (audios) await audios.removeItem(id);
}

// ─────────────── LEGACY MIGRATION ───────────────

let migrationDone = false;
/**
 * Old schema: each placePhoto key = placeId, value = encrypted Blob (no record wrapper).
 * New schema: key = mediaId (p_xxx), value = MediaRecord.
 * We convert one-off so existing single photos survive.
 */
export async function migrateLegacyPhotos(): Promise<void> {
  if (!photos || migrationDone) return;
  migrationDone = true;
  const legacyKeys: string[] = [];
  await photos.iterate<unknown, void>((val, key) => {
    if (val instanceof Blob) legacyKeys.push(key);
  });
  for (const placeId of legacyKeys) {
    const blob = await photos.getItem<Blob>(placeId);
    if (!blob) continue;
    const rec: MediaRecord = {
      id: newId('p'),
      placeId,
      ts: Date.now() - 86_400_000, // mark as "yesterday" so it sorts before fresh photos
      mime: blob.type || 'image/jpeg',
      blob
    };
    await photos.setItem(rec.id, rec);
    await photos.removeItem(placeId);
  }
}

// ─────────────── BACK-COMPAT (kept so existing callers still build) ───────────────

/** @deprecated use listPlacePhotos + getPhotoURL */
export async function getPlacePhoto(placeId: string): Promise<string | null> {
  const list = await listPlacePhotos(placeId);
  if (!list.length) return null;
  return getPhotoURL(list[list.length - 1].id);
}

/** @deprecated use addPlacePhoto */
export async function setPlacePhoto(placeId: string, file: File): Promise<string | null> {
  const gps = await captureGPS();
  const meta = await addPlacePhoto(placeId, file, { lat: gps?.lat, lng: gps?.lng });
  return getPhotoURL(meta.id);
}

/** @deprecated use removePhoto(photoId). This now removes ALL photos for placeId. */
export async function removePlacePhoto(placeId: string): Promise<void> {
  const list = await listPlacePhotos(placeId);
  for (const m of list) await removePhoto(m.id);
}

// ─────────────── helpers ───────────────

function stripBlob(rec: MediaRecord): MediaMeta {
  const { blob: _b, ...meta } = rec;
  void _b;
  return meta;
}
