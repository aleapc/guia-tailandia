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
  { id: 'bangkok', title: 'Bangkok', emoji: '🛕', summary: 'Templos dourados, o Grande Palácio, o rio Chao Phraya e a metrópole que não dorme.', gradient: ['#B5121B', '#E4572E'], image: 'bangkok.jpg' },
  { id: 'ayutthaya', title: 'Ayutthaya', emoji: '🏯', summary: 'A antiga capital do Sião: ruínas de tijolo e a cabeça de Buda nas raízes — bate-volta de Bangkok.', gradient: ['#8A5A2B', '#C89B5A'], image: 'ayutthaya.jpg' },
  { id: 'comida', title: 'Comida & street food', emoji: '🍜', summary: 'Pad thai, som tam, khao soi, mango sticky rice e a rua que vira cozinha ao anoitecer.', gradient: ['#B5121B', '#E8622C'], image: 'comida.jpg' },
  { id: 'mercados', title: 'Mercados & compras', emoji: '🛍️', summary: 'Chatuchak, mercados flutuantes, night markets e o mercado de flores 24h.', gradient: ['#B5651D', '#E0A458'], image: 'mercados.jpg' },
  { id: 'chiangmai', title: 'Chiang Mai', emoji: '🏮', summary: 'A cidade murada do norte: templos Lanna, Doi Suthep na montanha, cafés e cultura.', gradient: ['#0E7C6B', '#3FA796'], image: 'chiangmai.jpg' },
  { id: 'lanternas', title: 'Festival das Lanternas', emoji: '🪔', summary: 'Yi Peng & Loy Krathong (24-25/11): o céu e o rio de Chiang Mai cobertos de luz.', gradient: ['#C2410C', '#F59E0B'], image: 'lanternas.jpg' },
  { id: 'chiangrai', title: 'Chiang Rai', emoji: '⛩️', summary: 'O Templo Branco, o Azul, a Casa Negra e o Triângulo Dourado no extremo norte.', gradient: ['#1E5E8E', '#4FA3D1'], image: 'chiangrai.jpg' },
  { id: 'natureza', title: 'Natureza & elefantes', emoji: '🐘', summary: 'Santuários éticos, o teto da Tailândia e a cachoeira em que dá pra subir.', gradient: ['#2E7D5B', '#5FB88A'], image: 'natureza.jpg' },
  { id: 'krabi', title: 'Krabi & Railay', emoji: '🏝️', summary: 'Falésias de calcário, praias só de barco, Hong Islands e o tour das 7 ilhas.', gradient: ['#0E8388', '#4FC1B0'], image: 'krabi.jpg' },
  { id: 'ilhas', title: 'Phi Phi & ilhas', emoji: '⛵', summary: 'Maya Bay renascida, lagoas esmeralda, snorkel e a festa na areia.', gradient: ['#1C77C3', '#5BC0EB'], image: 'ilhas.jpg' },
  { id: 'phuket', title: 'Phuket', emoji: '🌴', summary: 'Cidade velha sino-portuguesa, Big Buddha, praias, pôr do sol e vida noturna.', gradient: ['#6A4C93', '#B084CC'], image: 'phuket.jpg' },
  { id: 'bemestar', title: 'Massagem & bem-estar', emoji: '💆', summary: 'A massagem tailandesa na fonte, spas à beira-mar e relaxamento pós-templo.', gradient: ['#7A5230', '#B98E5E'], image: 'bemestar.jpg' },
  { id: 'noite', title: 'Vida noturna & rooftops', emoji: '🌃', summary: 'Rooftops icônicos, mercados noturnos, a cena LGBTQ+ acolhedora e o pôr do sol.', gradient: ['#3A2A5A', '#7A5FA0'], image: 'noite.jpg' }
];

// Fotos próprias de lugares-ícone (para variedade dentro de cada categoria).
// Chave = id do Attraction; arquivo em static/photos/. Quem não estiver aqui herda a foto da categoria.
const placeImages: Record<string, string> = {
  grande_palacio_wat_phra_kaew: 'grande_palacio_wat_phra_kaew.jpg',
  wat_pho: 'wat_pho.jpg',
  wat_arun: 'wat_arun.jpg',
  chatuchak_weekend_market: 'chatuchak_weekend_market.jpg',
  ayutthaya_wat_chaiwatthanaram: 'ayutthaya_wat_chaiwatthanaram.jpg',
  cm_wat_chedi_luang: 'cm_wat_chedi_luang.jpg',
  lanternas_nawarat_ping: 'lanternas_nawarat_ping.jpg',
  cr_wat_rong_suea_ten: 'cr_wat_rong_suea_ten.jpg',
  natureza_elephant_nature_park: 'natureza_elephant_nature_park.jpg',
  natureza_doi_inthanon: 'natureza_doi_inthanon.jpg',
  hong_islands: 'hong_islands.jpg',
  maya_bay: 'maya_bay.jpg',
  phi_phi_viewpoint: 'phi_phi_viewpoint.jpg',
  big_buddha_phuket: 'big_buddha_phuket.jpg',
  phuket_old_town: 'phuket_old_town.jpg',
  promthep_cape: 'promthep_cape.jpg'
};

// Todo o catálogo curado vive em contentExtra.ts (gerado por scripts/gen-thai.mjs).
const baseAttractions: Attraction[] = [];

// Merge in the researched places, and attach official links to any existing place
// that has one (links generated in contentExtra.ts). Existing `links` win.
export const attractions: Attraction[] = [...baseAttractions, ...extraAttractions].map((a) => {
  const withLinks = a.links || !linksByName[a.name] ? a : { ...a, links: linksByName[a.name] };
  // Prioridade da foto: própria > foto de lugar-ícone > foto temática da categoria.
  const image = withLinks.image ?? placeImages[a.id] ?? categories.find((c) => c.id === a.categoryId)?.image;
  return { ...withLinks, image };
});

export const categoryById = (id: string) => categories.find((c) => c.id === id);
export const attractionsOf = (categoryId: string) => attractions.filter((a) => a.categoryId === categoryId);
export const attractionById = (id: string) => attractions.find((a) => a.id === id);
