import { attractions, trip } from './content';
import {
  ageHours,
  clearScore,
  daySky,
  forDate,
  isRainy,
  isStale,
  sunshineFraction,
  type WeatherData
} from './weather';
import { isoWeekday, parseLocal, ptDate, ptDateShort, ptWeekday, todayISO } from './dates';

export type AlertLevel = 'GREAT' | 'GOOD' | 'WARN' | 'INFO';

export interface Alert {
  level: AlertLevel;
  emoji: string;
  title: string;
  body: string;
  attractionId?: string;
}

const LEVEL_ORDER: Record<AlertLevel, number> = { GREAT: 0, GOOD: 1, WARN: 2, INFO: 3 };

/** Pick the first attraction id from a preference list that hasn't been done yet. */
function firstNotDone(ids: string[], done: Set<string>): string | undefined {
  return ids.find((id) => !done.has(id));
}

export function buildAlerts(
  weather: WeatherData | null,
  doneIds: string[] = [],
  today = todayISO()
): Alert[] {
  const done = new Set(doneIds);
  const out: Alert[] = [];
  const start = trip.startDate;
  const end = trip.endDate;

  if (parseLocal(today) < parseLocal(start)) {
    const d = Math.round((parseLocal(start).getTime() - parseLocal(today).getTime()) / 86_400_000);
    out.push({
      level: 'INFO',
      emoji: '✈️',
      title: `Faltam ${d} dia(s) para a Tailândia`,
      body: `A viagem começa em ${ptDate(start)}. Os alertas de clima ficam afiados quando vocês chegarem.`
    });
  }

  if (!weather || weather.days.length === 0) {
    out.push({
      level: 'WARN',
      emoji: '📡',
      title: 'Sem previsão no momento',
      body: 'Conecte ao wi-fi e atualize. Depois disso o guia funciona offline.'
    });
    return out;
  }

  const todayFc = forDate(weather, today) ?? weather.days[0];

  // 1) Pinned: today's weather (sky based on real sunshine so it matches the strip + suggestion).
  const todaySky = daySky(todayFc);
  out.push({
    level: 'INFO',
    emoji: todaySky.emoji,
    title: `Hoje: ${todaySky.label}`,
    body:
      `${Math.round(todayFc.tempMin)}–${Math.round(todayFc.tempMax)}°C · ${Math.round(sunshineFraction(todayFc) * 100)}% de sol · chuva ${todayFc.precipProbMax}% · vento até ${Math.round(todayFc.windMax)} km/h` +
      (isStale(weather) ? ` · (previsão de ${ageHours(weather)}h atrás)` : '')
  });

  // Horizon: upcoming days, preferably within the trip window.
  const horizon = weather.days
    .filter((d) => d.date >= today)
    .filter((d) => (d.date >= start && d.date <= end) || today < start || today > end)
    .slice(0, 8);
  const horizonOrAll = horizon.length ? horizon : weather.days.filter((d) => d.date >= today).slice(0, 8);

  // 2) Best clear-sky day → praia / passeio de barco / pôr do sol (skipping already-done spots).
  const bestClear = horizonOrAll.reduce(
    (best, d) => (best && clearScore(best) >= clearScore(d) ? best : d),
    horizonOrAll[0]
  );
  if (bestClear && clearScore(bestClear) >= 0.4) {
    const target = firstNotDone(['railay_beach', 'phra_nang_sunset', 'promthep_cape', 'kata_karon_beach', 'hong_islands'], done);
    if (target) {
      const isToday = bestClear.date === today;
      const level: AlertLevel = clearScore(bestClear) >= 0.55 ? 'GREAT' : 'GOOD';
      const whenTxt = isToday ? 'Hoje' : `${ptWeekday(bestClear.date)} (${ptDateShort(bestClear.date)})`;
      const name = attractions.find((a) => a.id === target)?.name ?? 'a praia';
      out.push({
        level,
        emoji: '🌞',
        title: `${whenTxt}: melhor céu da semana`,
        body: `Sol previsto (${Math.round(sunshineFraction(bestClear) * 100)}% do dia) e chuva só ${bestClear.precipProbMax}%. Dia ideal pra praia, passeio de barco e pôr do sol no Andaman.`,
        attractionId: target
      });
    }
  }

  // 3) Rainy today → indoor plan (malls, templos cobertos, museus, spa).
  if (isRainy(todayFc)) {
    const indoor = firstNotDone(['iconsiam', 'jim_thompson_house', 'wat_pho', 'health_land_spa', 'phuket_old_town'], done);
    out.push({
      level: 'GOOD',
      emoji: '🌧️',
      title: 'Dia de chuva — vá pro plano coberto',
      body: 'Bom dia pra um mall climatizado (ICONSIAM), templos cobertos, um museu ou uma massagem tailandesa.',
      attractionId: indoor
    });
  }

  // 4) Schedule notes — Sunday Walking Street de Chiang Mai (domingos).
  if (isoWeekday(today) === 7) {
    out.push({
      level: 'GOOD',
      emoji: '🛍️',
      title: 'Domingo é dia de Walking Street',
      body: 'Se estiverem em Chiang Mai, a Sunday Walking Street toma a cidade velha à noite: artesanato, comida e música. Chegue por volta das 17h.',
      attractionId: 'cm_sunday_walking_street'
    });
  }

  // 5) Strong wind — afeta os passeios de barco no Andaman (Hong, 7 ilhas, Phi Phi).
  if (todayFc.windMax >= 38) {
    out.push({
      level: 'WARN',
      emoji: '💨',
      title: `Vento forte hoje (${Math.round(todayFc.windMax)} km/h)`,
      body: 'Os passeios de barco (Hong Islands, 7 ilhas, Phi Phi, Maya Bay) podem ficar agitados ou ser cancelados. Confirme com a operadora e considere um programa em terra.'
    });
  }

  // 6) Calor + hidratação (Tailândia passa fácil dos 32 °C).
  if (todayFc.tempMax >= 30) {
    out.push({
      level: 'WARN',
      emoji: '🥵',
      title: `Calor hoje (até ${Math.round(todayFc.tempMax)} °C)`,
      body: 'Beba muita água (e água de coco gelada), evite caminhar exposto entre 11h e 16h e prefira sombra. Templos ao ar livre no meio do dia castigam.'
    });
  }

  // 7) UV (WHO: 6–7 alto, 8–10 muito alto, 11+ extremo). Perto do equador chega fácil a 11+.
  //    UV é sempre precaução (WARN), nunca "oportunidade" — UV alto não é coisa boa.
  if (todayFc.uvIndexMax >= 8) {
    const uv = Math.round(todayFc.uvIndexMax);
    const extremo = uv >= 11;
    out.push({
      level: 'WARN',
      emoji: extremo ? '☢️' : '☀️',
      title: `Índice UV ${extremo ? 'extremo' : 'muito alto'} hoje (UV ${uv})`,
      body: extremo
        ? 'UV extremo no pico do dia. Protetor FPS 50+ a cada 2 h, chapéu, óculos e camisa UV. Evite sol direto entre 11h e 16h — a queimadura aparece em minutos.'
        : 'UV muito alto entre 11h e 16h. Protetor FPS 30+, chapéu e reaplicação após o mar.'
    });
  } else if (todayFc.uvIndexMax >= 6) {
    out.push({
      level: 'WARN',
      emoji: '☀️',
      title: `Índice UV alto hoje (UV ${Math.round(todayFc.uvIndexMax)})`,
      body: 'Protetor solar antes da praia e reaplique após o mergulho. Boné/chapéu ajudam. Use protetor reef-safe nos passeios de barco.'
    });
  }

  const pinned = out[0];
  // Cap em 5 (não 4): com calor + UV o card stack pode ter 5+ WARNs num dia de verão.
  const rest = out.slice(1).sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]).slice(0, 5);
  return [pinned, ...rest];
}
