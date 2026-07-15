import { browser } from '$app/environment';
import localforage from 'localforage';
import { encryptBlob, decryptBlob } from './secure.svelte';

// "Foto de nós 2" — guardada SÓ no aparelho (IndexedDB), cifrada se houver PIN. Nunca sobe.
const store = browser ? localforage.createInstance({ name: 'gtl', storeName: 'personalize' }) : null;

export const couple = $state<{ url: string | null }>({ url: null });

export async function loadCouple() {
  if (!store) return;
  const blob = await store.getItem<Blob>('photo');
  couple.url = blob ? URL.createObjectURL(await decryptBlob(blob)) : null;
}

export async function setCouple(file: File) {
  if (!store) return;
  await store.setItem('photo', await encryptBlob(file));
  couple.url = URL.createObjectURL(file);
}

/** Set the couple photo from a data URL (used when it arrives inside the encrypted trip bundle). */
export async function setCoupleFromDataURL(dataUrl: string) {
  couple.url = dataUrl;
  if (!store) return;
  try {
    const blob = await (await fetch(dataUrl)).blob();
    await store.setItem('photo', await encryptBlob(blob));
  } catch {
    /* keep in-memory url even if persistence fails */
  }
}

/** Re-encrypt the couple photo after a PIN is set. */
export async function reencryptCouple() {
  if (!store) return;
  const blob = await store.getItem<Blob>('photo');
  if (blob && !blob.type.includes('x-gtl-enc')) {
    await store.setItem('photo', await encryptBlob(blob));
  }
}
