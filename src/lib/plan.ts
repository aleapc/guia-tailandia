import { attractionById, attractions, type Attraction } from './content';
import { forDate, isRainy, type WeatherData } from './weather';
import { categoriesForCity, currentOrNextDay, dayFor, itinerary, type ItineraryDay } from './itinerary';
import { parseLocal, ptDate, todayISO } from './dates';

export interface PlanItem {
  when: string;
  id: string;
  name: string;
  why: string;
}

export interface DayPlan {
  title: string;
  reason: string;
  items: PlanItem[];
  emptyMsg?: string;
}

const SLOTS = ['Manhã', 'Tarde', 'Fim de tarde', 'Noite', 'Extra'];

/** Transforma os lugares de um dia do roteiro em itens com horário sugerido. */
function itemsForDay(day: ItineraryDay, done: Set<string>): PlanItem[] {
  return day.placeIds
    .map((id, i) => {
      const a = attractionById(id);
      if (!a) return null;
      const doneMark = done.has(id) ? '✓ ' : '';
      return { when: SLOTS[Math.min(i, SLOTS.length - 1)], id, name: a.name, why: doneMark + a.tagline };
    })
    .filter((x): x is PlanItem => x !== null);
}

/**
 * Plano do dia = o dia correspondente do roteiro fixo (19/11 → 05/12).
 * Antes da viagem: contagem regressiva + prévia do 1º dia.
 * Depois: mensagem de volta. `weather`/`fav` ficam por compatibilidade de assinatura.
 */
export function buildPlan(
  _weather: WeatherData | null,
  doneIds: string[] = [],
  _favIds: string[] = [],
  today = todayISO()
): DayPlan {
  const done = new Set(doneIds);
  const start = itinerary[0].date;
  const end = itinerary[itinerary.length - 1].date;

  // Antes da viagem → contagem regressiva e prévia do primeiro dia.
  if (parseLocal(today) < parseLocal(start)) {
    const d = Math.round((parseLocal(start).getTime() - parseLocal(today).getTime()) / 86_400_000);
    const first = itinerary[0];
    return {
      title: `Faltam ${d} dia(s) ✈️`,
      reason: `A viagem começa em ${ptDate(start)}, em ${first.city}. Toque em "Roteiro" no menu pra ver os 17 dias.`,
      items: itemsForDay(first, done)
    };
  }

  // Depois da viagem → despedida.
  if (parseLocal(today) > parseLocal(end)) {
    return {
      title: 'Boa viagem de volta 👋',
      reason: 'A viagem terminou. Reveja as fotos no álbum e guarde as lembranças!',
      items: []
    };
  }

  // Durante a viagem → o dia do roteiro.
  const day = dayFor(today) ?? currentOrNextDay(today);
  if (!day) {
    return { title: 'Dia livre', reason: 'Sem programação fixa hoje — explore o guia por categoria.', items: [] };
  }
  const idx = itinerary.indexOf(day) + 1;
  return {
    title: `${day.emoji} Dia ${idx} · ${day.city}`,
    reason: `${day.title}. ${day.note ?? ''}`.trim(),
    items: itemsForDay(day, done),
    emptyMsg: day.placeIds.length === 0 ? 'Dia de descanso/transição — aproveitem com calma.' : undefined
  };
}

export interface Extra {
  id: string;
  name: string;
  tagline: string;
  fit: Attraction['fit'];
  category: string;
}

export interface Extras {
  city: string;
  reason: string;
  items: Extra[];
}

/**
 * "O que mais fazer hoje?" — sugestões ao redor da programação do dia: outros lugares
 * do guia na MESMA cidade que não estão no plano fixo, priorizados pelo clima de hoje.
 * Antes da viagem, mostra os extras da primeira cidade (Bangkok) como prévia.
 */
export function extrasForToday(
  weather: WeatherData | null,
  doneIds: string[] = [],
  favIds: string[] = [],
  today = todayISO(),
  limit = 4
): Extras {
  const done = new Set(doneIds);
  const fav = new Set(favIds);
  const day = dayFor(today) ?? currentOrNextDay(today) ?? itinerary[0];
  const inPlan = new Set(day.placeIds);
  const cats = categoriesForCity(day.city);

  // Clima de hoje → modo (só quando estamos de fato no dia).
  const todayFc = weather ? (forDate(weather, today) ?? weather.days[0]) : undefined;
  const rainy = todayFc ? isRainy(todayFc) : false;

  const fitsRain = (a: Attraction) => a.fit === 'RAIN_OK' || a.fit === 'INDOOR' || a.fit === 'ANY';
  const fitsClear = (a: Attraction) => a.fit === 'CLEAR_SKY' || a.fit === 'ANY';

  const pool = attractions.filter(
    (a) => cats.includes(a.categoryId) && !inPlan.has(a.id) && !done.has(a.id) && !a.isDish
  );

  // Ordena: favoritos primeiro, depois quem combina com o tempo, depois o resto.
  const scored = pool
    .map((a) => {
      let score = 0;
      if (fav.has(a.id)) score += 10;
      if (todayFc) score += (rainy ? fitsRain(a) : fitsClear(a)) ? 3 : 0;
      return { a, score };
    })
    .sort((x, y) => y.score - x.score);

  const items: Extra[] = scored
    .slice(0, limit)
    .map(({ a }) => ({ id: a.id, name: a.name, tagline: a.tagline, fit: a.fit, category: a.categoryId }));

  const reason = !todayFc
    ? `Já que a base do dia é ${day.city}, dá pra encaixar também:`
    : rainy
      ? `Chovendo em ${day.city}? Estes cabem bem no plano coberto:`
      : `Sobrou tempo em ${day.city}? Que tal também:`;

  return { city: day.city, reason, items };
}
