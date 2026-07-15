import type { Attraction } from './content';
import { clearScore, forDate, isRainy, sunshineFraction, type WeatherData } from './weather';
import { ptDateShort, ptWeekday, todayISO } from './dates';

export interface FitHint {
  emoji: string;
  text: string;
  positive: boolean;
}

/** Weather-aware one-liner for a place ("Melhor dia: Quinta ☀️"). */
export function fitHint(a: Attraction, w: WeatherData | null, today = todayISO()): FitHint | null {
  if (!w || w.days.length === 0) return null;
  const horizon = w.days.filter((d) => d.date >= today).slice(0, 8);
  if (!horizon.length) return null;
  const todayFc = forDate(w, today) ?? horizon[0];

  if (a.fit === 'CLEAR_SKY') {
    const best = horizon.reduce((b, d) => (clearScore(b) >= clearScore(d) ? b : d), horizon[0]);
    if (clearScore(best) < 0.4)
      return { emoji: '🌥️', text: 'Sem céu limpo à vista nos próximos dias — vá num dia que abrir.', positive: false };
    if (best.date === today)
      return { emoji: '☀️', text: `Hoje o céu ajuda (${Math.round(sunshineFraction(best) * 100)}% de sol) — aproveite!`, positive: true };
    return {
      emoji: '☀️',
      text: `Melhor dia: ${ptWeekday(best.date)} (${ptDateShort(best.date)}), ${Math.round(sunshineFraction(best) * 100)}% de sol.`,
      positive: true
    };
  }
  if (a.fit === 'RAIN_OK') {
    return isRainy(todayFc)
      ? { emoji: '🌧️', text: 'Chovendo hoje — é um ótimo dia pra cá.', positive: true }
      : { emoji: '🌦️', text: 'Bom em qualquer tempo; na chuva fica ainda melhor.', positive: true };
  }
  if (a.fit === 'INDOOR') {
    return isRainy(todayFc)
      ? { emoji: '☔', text: 'Plano coberto — ideal pra um dia de chuva como hoje.', positive: true }
      : null;
  }
  return null;
}

export function fitLabel(fit: Attraction['fit']): string {
  switch (fit) {
    case 'CLEAR_SKY':
      return '☀️ melhor com sol';
    case 'RAIN_OK':
      return '🌧️ ok na chuva';
    case 'INDOOR':
      return '☔ coberto';
    default:
      return '🌥️ qualquer tempo';
  }
}
