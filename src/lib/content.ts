// All trip content (type-safe, 100% offline) — Guia Tailândia.
// Roteiro do casal: 19/11 → 05/12/2026, por Bangkok, Ayutthaya, Chiang Mai,
// Chiang Rai, Krabi, Phi Phi e Phuket. Conteúdo curado (93 locais) vive em contentExtra.ts.
// Para adicionar um local: acrescente um Attraction em contentExtra (via scripts/gen-thai.mjs).
import { extraAttractions, linksByName } from './contentExtra';

export type WeatherFit = 'CLEAR_SKY' | 'RAIN_OK' | 'INDOOR' | 'ANY';

export interface OpeningHours {
  openDays?: number[]; // ISO weekday Mon=1..Sun=7; empty/undefined = every day
  openHour?: number;
  closeHour?: number;
  note?: string;
}

export interface LinkRef {
  label: string;
  url: string;
}

export interface Attraction {
  id: string;
  categoryId: string;
  name: string;
  tagline: string;
  description: string;
  whatToDo?: string[];
  whatToBring?: string[];
  whatToWear?: string[];
  kingTip?: string;
  whereToEat?: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  driveMinutes?: number;
  durationLabel: string;
  fit: WeatherFit;
  windSensitive?: boolean;
  hours?: OpeningHours;
  mapQuery?: string;
  image?: string;
  /** Optional history/context shown in an expandable "Mais sobre o local" section. */
  history?: string;
  links?: LinkRef[];
  /** Prato típico (card informativo de comida, sem lugar fixo). */
  isDish?: boolean;
}

export interface Category {
  id: string;
  title: string;
  emoji: string;
  summary: string;
  gradient: [string, string];
  image?: string;
}

// Base da viagem = Bangkok (chegada e saída). O clima segue por cidade no roteiro
// dia-a-dia; aqui fica o ponto padrão (Bangkok) usado quando não há cidade ativa.
export const trip = {
  homeName: 'Bangkok',
  homeLat: 13.7466,
  homeLng: 100.5347,
  weatherLat: 13.7563,
  weatherLng: 100.5018,
  timezone: 'Asia/Bangkok',
  startDate: '2026-11-19',
  endDate: '2026-12-05'
};

export const categories: Category[] = [
  { id: 'bangkok', title: 'Bangkok', emoji: '🛕', summary: 'Templos dourados, o Grande Palácio, o rio Chao Phraya e a metrópole que não dorme.', gradient: ['#B5121B', '#E4572E'] },
  { id: 'ayutthaya', title: 'Ayutthaya', emoji: '🏯', summary: 'A antiga capital do Sião: ruínas de tijolo e a cabeça de Buda nas raízes — bate-volta de Bangkok.', gradient: ['#8A5A2B', '#C89B5A'] },
  { id: 'comida', title: 'Comida & street food', emoji: '🍜', summary: 'Pad thai, som tam, khao soi, mango sticky rice e a rua que vira cozinha ao anoitecer.', gradient: ['#B5121B', '#E8622C'] },
  { id: 'mercados', title: 'Mercados & compras', emoji: '🛍️', summary: 'Chatuchak, mercados flutuantes, night markets e o mercado de flores 24h.', gradient: ['#B5651D', '#E0A458'] },
  { id: 'chiangmai', title: 'Chiang Mai', emoji: '🏮', summary: 'A cidade murada do norte: templos Lanna, Doi Suthep na montanha, cafés e cultura.', gradient: ['#0E7C6B', '#3FA796'] },
  { id: 'lanternas', title: 'Festival das Lanternas', emoji: '🪔', summary: 'Yi Peng & Loy Krathong (24-25/11): o céu e o rio de Chiang Mai cobertos de luz.', gradient: ['#C2410C', '#F59E0B'] },
  { id: 'chiangrai', title: 'Chiang Rai', emoji: '⛩️', summary: 'O Templo Branco, o Azul, a Casa Negra e o Triângulo Dourado no extremo norte.', gradient: ['#1E5E8E', '#4FA3D1'] },
  { id: 'natureza', title: 'Natureza & elefantes', emoji: '🐘', summary: 'Santuários éticos, o teto da Tailândia e a cachoeira em que dá pra subir.', gradient: ['#2E7D5B', '#5FB88A'] },
  { id: 'krabi', title: 'Krabi & Railay', emoji: '🏝️', summary: 'Falésias de calcário, praias só de barco, Hong Islands e o tour das 7 ilhas.', gradient: ['#0E8388', '#4FC1B0'] },
  { id: 'ilhas', title: 'Phi Phi & ilhas', emoji: '⛵', summary: 'Maya Bay renascida, lagoas esmeralda, snorkel e a festa na areia.', gradient: ['#1C77C3', '#5BC0EB'] },
  { id: 'phuket', title: 'Phuket', emoji: '🌴', summary: 'Cidade velha sino-portuguesa, Big Buddha, praias, pôr do sol e vida noturna.', gradient: ['#6A4C93', '#B084CC'] },
  { id: 'bemestar', title: 'Massagem & bem-estar', emoji: '💆', summary: 'A massagem tailandesa na fonte, spas à beira-mar e relaxamento pós-templo.', gradient: ['#7A5230', '#B98E5E'] },
  { id: 'noite', title: 'Vida noturna & rooftops', emoji: '🌃', summary: 'Rooftops icônicos, mercados noturnos, a cena LGBTQ+ acolhedora e o pôr do sol.', gradient: ['#3A2A5A', '#7A5FA0'] }
];

// Todo o catálogo curado vive em contentExtra.ts (gerado por scripts/gen-thai.mjs).
const baseAttractions: Attraction[] = [];

// Merge in the researched places, and attach official links to any existing place
// that has one (links generated in contentExtra.ts). Existing `links` win.
export const attractions: Attraction[] = [...baseAttractions, ...extraAttractions].map((a) => {
  const withLinks = a.links || !linksByName[a.name] ? a : { ...a, links: linksByName[a.name] };
  // Cada local herda a imagem temática da sua categoria, salvo se tiver imagem própria.
  return withLinks.image ? withLinks : { ...withLinks, image: categories.find((c) => c.id === a.categoryId)?.image };
});

export const categoryById = (id: string) => categories.find((c) => c.id === id);
export const attractionsOf = (categoryId: string) => attractions.filter((a) => a.categoryId === categoryId);
export const attractionById = (id: string) => attractions.find((a) => a.id === id);
