// Roteiro fixo do casal — 19/11 → 05/12/2026.
// Cada dia amarra uma cidade (com coordenada pro clima) e os lugares curados do guia.
// Fonte: itinerário enviado pelos viajantes.

export interface ItineraryDay {
  date: string; // yyyy-mm-dd
  city: string;
  lat: number;
  lng: number;
  emoji: string;
  title: string; // tema do dia
  note?: string;
  placeIds: string[]; // ids de attractions (contentExtra) do dia
  categoryId?: string; // categoria principal pra explorar
  highlight?: boolean;
}

// Coordenadas de cada cidade-base (pro clima do dia).
const C = {
  bangkok: { lat: 13.7563, lng: 100.5018 },
  ayutthaya: { lat: 14.355, lng: 100.5677 },
  chiangmai: { lat: 18.7883, lng: 98.9853 },
  chiangrai: { lat: 19.9105, lng: 99.8406 },
  krabi: { lat: 8.0328, lng: 98.8218 },
  phiphi: { lat: 7.7407, lng: 98.7784 },
  phuket: { lat: 7.8804, lng: 98.3923 }
};

export const itinerary: ItineraryDay[] = [
  {
    date: '2026-11-19', city: 'Bangkok', ...C.bangkok, emoji: '🛬',
    title: 'Chegada em Bangkok',
    note: 'Pouso às 18h05. Chegada, hotel e descanso — se sobrar pique, um primeiro jantar de rua na Yaowarat (Chinatown).',
    placeIds: ['chinatown_yaowarat'], categoryId: 'bangkok'
  },
  {
    date: '2026-11-20', city: 'Bangkok', ...C.bangkok, emoji: '🛕',
    title: 'Templos de Bangkok',
    note: 'O trio de ouro: Grande Palácio, Wat Pho e Wat Arun. Comecem cedo (dress code: ombros e joelhos cobertos).',
    placeIds: ['grande_palacio_wat_phra_kaew', 'wat_pho', 'wat_arun', 'wat_saket_golden_mount', 'wat_pho_massage_school'],
    categoryId: 'bangkok'
  },
  {
    date: '2026-11-21', city: 'Bangkok', ...C.bangkok, emoji: '🛍️',
    title: 'Mercados de Bangkok',
    note: 'Sábado pega o Chatuchak (só fim de semana). À noite, mercado de flores e um night market.',
    placeIds: ['chatuchak_weekend_market', 'iconsiam', 'pak_khlong_talat_flores', 'talad_rot_fai_srinakarin', 'jodd_fairs_ratchada'],
    categoryId: 'mercados'
  },
  {
    date: '2026-11-22', city: 'Ayutthaya', ...C.ayutthaya, emoji: '🏯',
    title: 'Bate-volta a Ayutthaya',
    note: 'A antiga capital do Sião. Vá de trem cedo, alugue bike e explore as ruínas antes do calor. (Domingo)',
    placeIds: ['ayutthaya_como_chegar', 'ayutthaya_wat_mahathat', 'ayutthaya_wat_phra_si_sanphet', 'ayutthaya_wat_chaiwatthanaram', 'ayutthaya_bike_nao_elefante'],
    categoryId: 'ayutthaya'
  },
  {
    date: '2026-11-23', city: 'Chiang Mai', ...C.chiangmai, emoji: '✈️',
    title: 'Ida para Chiang Mai',
    note: 'Voo BKK → CNX (de Don Mueang, ~1h15). À tarde, aclimatize a pé pela Cidade Velha e o fosso.',
    placeIds: ['cm_cidade_velha_fosso', 'cm_wat_phra_singh', 'cm_nimmanhaemin'],
    categoryId: 'chiangmai'
  },
  {
    date: '2026-11-24', city: 'Chiang Mai', ...C.chiangmai, emoji: '🪔',
    title: 'Festival das Lanternas',
    note: 'O grande dia! Yi Peng & Loy Krathong (2026: 24-25/11). Krathongs no rio Ping, lanternas no céu. Lanterna aérea só em evento licenciado fora da cidade.',
    placeIds: ['lanternas_yipeng_vs_loykrathong', 'lanternas_tha_phae_gate', 'lanternas_nawarat_ping', 'lanternas_cad_khomloy', 'lanternas_etiqueta_seguranca'],
    categoryId: 'lanternas', highlight: true
  },
  {
    date: '2026-11-25', city: 'Chiang Mai', ...C.chiangmai, emoji: '🏮',
    title: 'Templos de Chiang Mai',
    note: 'Suba a Doi Suthep pela manhã (vista da cidade) e volte pelos templos Lanna e os cafés de Nimman.',
    placeIds: ['cm_doi_suthep', 'cm_wat_chedi_luang', 'cm_wat_phra_singh', 'cm_nimmanhaemin', 'cm_cooking_class'],
    categoryId: 'chiangmai'
  },
  {
    date: '2026-11-26', city: 'Chiang Rai', ...C.chiangrai, emoji: '⛩️',
    title: 'Templos de Chiang Rai',
    note: 'Bate-volta (~3h de van). O Templo Branco, o Azul e a Casa Negra num dia. Saiam bem cedo.',
    placeIds: ['cr_wat_rong_khun', 'cr_wat_rong_suea_ten', 'cr_baan_dam'],
    categoryId: 'chiangrai'
  },
  {
    date: '2026-11-27', city: 'Krabi', ...C.krabi, emoji: '🏝️',
    title: 'Ida para Krabi',
    note: 'Voo para o sul (Krabi). Base em Ao Nang — orla, jantar de frutos do mar e o night market.',
    placeIds: ['ao_nang', 'nopparat_thara_beach', 'krabi_town_night_market'],
    categoryId: 'krabi'
  },
  {
    date: '2026-11-28', city: 'Krabi', ...C.krabi, emoji: '⛵',
    title: 'Hong Islands',
    note: 'Passeio de barco às Koh Hong: lagoa esmeralda e o mirante 360°. Saiam cedo pro mar mais liso.',
    placeIds: ['hong_islands', 'railay_beach', 'phra_nang_sunset'],
    categoryId: 'krabi'
  },
  {
    date: '2026-11-29', city: 'Krabi', ...C.krabi, emoji: '🌅',
    title: 'Tour das 7 ilhas',
    note: 'Sunset entre as ilhas e, ao escurecer, o plâncton bioluminescente (depende da lua — perto da lua nova brilha mais).',
    placeIds: ['seven_islands_sunset', 'tiger_cave_temple'],
    categoryId: 'krabi'
  },
  {
    date: '2026-11-30', city: 'Phi Phi', ...C.phiphi, emoji: '🚤',
    title: 'Ida para Phi Phi',
    note: 'Ferry/lancha para Phi Phi Don (sem carros na ilha). À tarde, o mirante das baías gêmeas; à noite, o fire show.',
    placeIds: ['loh_dalum_tonsai', 'phi_phi_viewpoint', 'phi_phi_nightlife'],
    categoryId: 'ilhas'
  },
  {
    date: '2026-12-01', city: 'Phi Phi', ...C.phiphi, emoji: '🏖️',
    title: 'Passeio pelas ilhas / Maya Bay',
    note: 'Maya Bay renascida (sem banho de mar, cota de visitantes — vão no 1º horário), Pileh Lagoon e Bamboo Island.',
    placeIds: ['maya_bay', 'pileh_lagoon', 'bamboo_island', 'phi_phi_snorkel_dive'],
    categoryId: 'ilhas', highlight: true
  },
  {
    date: '2026-12-02', city: 'Phuket', ...C.phuket, emoji: '🌴',
    title: 'Ida para Phuket',
    note: 'Travessia para Phuket. À tarde, a colorida Cidade Velha sino-portuguesa e um fim de tarde na praia de Kata.',
    placeIds: ['phuket_old_town', 'kata_karon_beach', 'beachfront_spa_kata_phuket'],
    categoryId: 'phuket'
  },
  {
    date: '2026-12-03', city: 'Phuket', ...C.phuket, emoji: '🐘',
    title: 'Phuket com calma',
    note: 'Big Buddha e Wat Chalong pela manhã, pôr do sol no Cabo Promthep e a noite em Patong (Bangla / cena LGBTQ+).',
    placeIds: ['big_buddha_phuket', 'wat_chalong', 'promthep_cape', 'bangla_road_patong', 'simon_cabaret'],
    categoryId: 'phuket'
  },
  {
    date: '2026-12-04', city: 'Bangkok', ...C.bangkok, emoji: '🌃',
    title: 'Volta para Bangkok',
    note: 'Voo de volta a Bangkok. Última noite: um rooftop icônico e um mercado noturno pra fechar a viagem.',
    placeIds: ['sky_bar_lebua', 'jodd_fairs_ratchada', 'silom_soi_4'],
    categoryId: 'noite'
  },
  {
    date: '2026-12-05', city: 'Bangkok', ...C.bangkok, emoji: '👋',
    title: 'Volta para o Brasil',
    note: 'Dia de embarque para casa. Se sobrar tempo antes do aeroporto, uma última massagem tailandesa. Boa viagem!',
    placeIds: ['health_land_spa'],
    categoryId: 'bemestar'
  }
];

// Categorias do guia "ao redor" de cada cidade — usadas pelo "O que mais fazer hoje?".
const CITY_CATEGORIES: Record<string, string[]> = {
  Bangkok: ['bangkok', 'mercados', 'comida', 'bemestar', 'noite'],
  Ayutthaya: ['ayutthaya', 'comida'],
  'Chiang Mai': ['chiangmai', 'lanternas', 'natureza', 'comida'],
  'Chiang Rai': ['chiangrai'],
  Krabi: ['krabi', 'bemestar', 'comida'],
  'Phi Phi': ['ilhas'],
  Phuket: ['phuket', 'bemestar', 'noite']
};

export function categoriesForCity(city: string): string[] {
  return CITY_CATEGORIES[city] ?? [];
}

export function dayFor(iso: string): ItineraryDay | undefined {
  return itinerary.find((d) => d.date === iso);
}

/** O dia do roteiro para "hoje", ou o próximo dia se a viagem ainda não começou. */
export function currentOrNextDay(iso: string): ItineraryDay | undefined {
  return dayFor(iso) ?? itinerary.find((d) => d.date >= iso);
}

/** Cidade "de hoje" (ou a primeira do roteiro antes de começar). */
export function currentCity(iso: string): string {
  const d = dayFor(iso) ?? (iso < itinerary[0].date ? itinerary[0] : itinerary[itinerary.length - 1]);
  return d.city;
}
