import { browser } from '$app/environment';

// "Nossa viagem" — reservas editáveis pelos viajantes, guardadas SÓ no aparelho
// (localStorage). Nada vai pra internet. Dá pra compartilhar com o parceiro por um
// código que viaja no WhatsApp (merge por substituição, com confirmação na tela).

export interface FlightLeg {
  journey: string; // ex.: "Ida" / "GRU → BKK"
  date: string;
  airline: string;
  flightNo: string;
  from: string;
  to: string;
  depart: string;
  arrive: string;
}

export interface Lodging {
  name: string;
  kind?: string;
  address: string;
  checkin: string;
  checkout: string;
  code?: string;
  host?: string;
  phone?: string;
  note?: string;
  mapQuery?: string;
}

export interface Car {
  company: string;
  confirmation?: string;
  code?: string;
  pickup: string;
  pickupAt: string;
  dropoff: string;
  dropoffAt: string;
  phone?: string;
  note?: string;
}

export interface Insurance {
  company: string;
  insured?: string;
  policy: string;
  plan?: string;
  validity?: string;
  phone: string;
  email?: string;
  note?: string;
}

export interface TripPlan {
  flights: FlightLeg[];
  lodgings: Lodging[];
  cars: Car[];
  insurances: Insurance[];
  docsNote: string;
}

const KEY = 'gtl-trip';

export function emptyTrip(): TripPlan {
  return { flights: [], lodgings: [], cars: [], insurances: [], docsNote: '' };
}

export const tripPlan = $state<TripPlan>(emptyTrip());

/** Carrega as reservas guardadas neste aparelho. */
export function loadTrip(): void {
  if (!browser) return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) Object.assign(tripPlan, { ...emptyTrip(), ...JSON.parse(raw) });
  } catch {
    /* ignore */
  }
}

/** Salva as reservas neste aparelho (chame após qualquer edição). */
export function saveTrip(): void {
  if (!browser) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(tripPlan));
  } catch {
    /* ignore */
  }
}

/** Substitui todas as reservas (usado ao importar do parceiro). */
export function replaceTrip(t: Partial<TripPlan>): void {
  Object.assign(tripPlan, { ...emptyTrip(), ...t });
  saveTrip();
}

export function tripIsEmpty(): boolean {
  return (
    tripPlan.flights.length === 0 &&
    tripPlan.lodgings.length === 0 &&
    tripPlan.cars.length === 0 &&
    tripPlan.insurances.length === 0 &&
    tripPlan.docsNote.trim() === ''
  );
}

// ---- Compartilhar / importar entre os dois celulares (via código no WhatsApp) ----

function b64uEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64uDecode(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(b64)));
}

/** Código compacto com TODAS as reservas (prefixo GTT1.). */
export function encodeTrip(): string {
  const plain: TripPlan = {
    flights: tripPlan.flights,
    lodgings: tripPlan.lodgings,
    cars: tripPlan.cars,
    insurances: tripPlan.insurances,
    docsNote: tripPlan.docsNote
  };
  return 'GTT1.' + b64uEncode(JSON.stringify(plain));
}

export function decodeTrip(code: string): TripPlan | null {
  try {
    const m = code.trim().match(/GTT1\.([A-Za-z0-9_-]+)/);
    if (!m) return null;
    const t = JSON.parse(b64uDecode(m[1])) as TripPlan;
    if (!t || !Array.isArray(t.flights)) return null;
    return { ...emptyTrip(), ...t };
  } catch {
    return null;
  }
}

export function tripShareUrl(code: string): string {
  return `https://aleapc.github.io/guia-tailandia/viagem#t=${code}`;
}

export function tripWhatsappUrl(code: string): string {
  const text =
    `🇹🇭 *Guia Tailândia* — nossas reservas (voos, hotéis, carro e seguro)!\n` +
    `Abre esse link que o app carrega tudo no seu celular:\n${tripShareUrl(code)}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
