import { browser } from '$app/environment';

// Optional PIN that encrypts on-device data (trip plan + attachments + couple photo)
// with AES-GCM, key derived from the PIN via PBKDF2. Nothing here ever leaves the device.
// The published site/repo never contains this data — this protects the data AT REST on the phone.

const SALT_KEY = 'gtl-sec-salt';
const VERIFY_KEY = 'gtl-sec-verify';

export const lock = $state<{ enabled: boolean; locked: boolean; ready: boolean }>({
  enabled: false,
  locked: false,
  ready: false
});

let key: CryptoKey | null = null;

export function initLock() {
  if (!browser) return;
  lock.enabled = !!localStorage.getItem(VERIFY_KEY);
  lock.locked = lock.enabled; // if a PIN exists, start locked each session
  lock.ready = true;
}

export function hasKey(): boolean {
  return !!key;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function bufToB64(b: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(b)));
}
function b64ToBuf(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function derive(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Encrypt a string. If no PIN is active, returns plaintext unchanged. */
export async function encryptStr(plain: string): Promise<string> {
  if (!key) return plain;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
  return `enc:${bufToB64(iv.buffer)}:${bufToB64(ct)}`;
}

export async function decryptStr(payload: string): Promise<string> {
  if (!payload.startsWith('enc:')) return payload; // plaintext (no PIN was set)
  if (!key) throw new Error('locked');
  const [, ivB, ctB] = payload.split(':');
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBuf(ivB) }, key, b64ToBuf(ctB));
  return dec.decode(pt);
}

/** Encrypt a Blob into raw bytes (iv + ciphertext); type tag carries the original MIME. */
export async function encryptBlob(blob: Blob): Promise<Blob> {
  if (!key) return blob;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, await blob.arrayBuffer());
  const out = new Uint8Array(12 + ct.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ct), 12);
  return new Blob([out], { type: `application/x-gtl-enc;orig=${blob.type}` });
}

export async function decryptBlob(blob: Blob): Promise<Blob> {
  if (!blob.type.includes('x-gtl-enc')) return blob; // plaintext
  if (!key) throw new Error('locked');
  const raw = new Uint8Array(await blob.arrayBuffer());
  const iv = raw.slice(0, 12);
  const ct = raw.slice(12);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  const orig = blob.type.split('orig=')[1] || '';
  return new Blob([pt], { type: orig });
}

// Portable, self-contained seed (embeds its own salt) so ANY device can decrypt it with the
// shared password — used for the encrypted trip bundle committed to the repo.
export async function seedEncrypt(plain: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const k = await derive(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(plain));
  return `gtlseed:${bufToB64(salt.buffer)}:${bufToB64(iv.buffer)}:${bufToB64(ct)}`;
}

export async function seedDecrypt(payload: string, password: string): Promise<string> {
  const [, saltB, ivB, ctB] = payload.trim().split(':');
  const k = await derive(password, b64ToBuf(saltB));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBuf(ivB) }, k, b64ToBuf(ctB));
  return dec.decode(pt);
}

export async function setPin(pin: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  key = await derive(pin, salt);
  localStorage.setItem(SALT_KEY, bufToB64(salt.buffer));
  localStorage.setItem(VERIFY_KEY, await encryptStr('gtl-ok'));
  lock.enabled = true;
  lock.locked = false;
}

export async function unlock(pin: string): Promise<boolean> {
  const saltB = localStorage.getItem(SALT_KEY);
  const ver = localStorage.getItem(VERIFY_KEY);
  if (!saltB || !ver) return false;
  key = await derive(pin, b64ToBuf(saltB));
  try {
    if ((await decryptStr(ver)) === 'gtl-ok') {
      lock.locked = false;
      return true;
    }
  } catch {
    /* wrong pin */
  }
  key = null;
  return false;
}

/** Forgot PIN: wipe all protected data so the user isn't locked out. */
export function resetProtected() {
  if (!browser) return;
  localStorage.removeItem(SALT_KEY);
  localStorage.removeItem(VERIFY_KEY);
  localStorage.removeItem('gtl-trip');
  localStorage.removeItem('gtl-attach-meta');
  // attachment + couple-photo blobs are cleared by their stores on next write; drop the DB:
  indexedDB?.deleteDatabase?.('gtl');
  key = null;
  lock.enabled = false;
  lock.locked = false;
}
