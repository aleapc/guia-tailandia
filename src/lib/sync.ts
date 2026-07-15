// Sincronização entre os dois celulares do casal, sem servidor: os lugares
// feitos, favoritos e notas viram um código compacto que viaja pelo WhatsApp.
// Quem recebe importa (colando ou abrindo o link /sync#s=...) e o app funde
// tudo por união — trocar códigos nos dois sentidos deixa os aparelhos iguais.
// Fotos e áudios do diário NÃO entram (grandes demais): ficam por aparelho.

import { exportSyncData, mergeFromPeer, type SyncData } from './state.svelte';

interface Payload {
  v: 1;
  d: string[];
  f: string[];
  n: Record<string, string>;
}

function b64uEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64uDecode(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(b64)));
}

export function encodeSync(): string {
  const data = exportSyncData();
  // notas muito longas estouram o tamanho confortável de mensagem — corta com aviso
  const notes: Record<string, string> = {};
  for (const [id, text] of Object.entries(data.notes)) {
    if (text) notes[id] = text.length > 280 ? text.slice(0, 277) + '…' : text;
  }
  const payload: Payload = { v: 1, d: data.done, f: data.fav, n: notes };
  return 'GT1.' + b64uEncode(JSON.stringify(payload));
}

export function decodeSync(code: string): SyncData | null {
  try {
    const m = code.trim().match(/GU1\.([A-Za-z0-9_-]+)/);
    if (!m) return null;
    const p = JSON.parse(b64uDecode(m[1])) as Payload;
    if (p.v !== 1 || !Array.isArray(p.d)) return null;
    return { done: p.d, fav: p.f ?? [], notes: p.n ?? {} };
  } catch {
    return null;
  }
}

/** Decodifica e funde. Retorna o que entrou de novo, ou null se o código for inválido. */
export function importSync(code: string): { done: number; fav: number; notes: number } | null {
  const data = decodeSync(code);
  if (!data) return null;
  return mergeFromPeer(data);
}

export function shareUrl(code: string): string {
  return `https://aleapc.github.io/guia-tailandia/sync#s=${code}`;
}

export function whatsappUrl(code: string): string {
  const text =
    `🇹🇭 *Guia Tailândia* — meus lugares marcados!\n` +
    `Abre esse link que o app junta tudo no seu celular:\n${shareUrl(code)}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
