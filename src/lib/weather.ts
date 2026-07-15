import { browser } from '$app/environment';
import { trip } from './content';

export interface DayForecast {
  date: string; // yyyy-mm-dd (timezone do trip)
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipProbMax: number;
  precipSum: number;
  windMax: number;
  /** Open-Meteo daily uv_index_max (escala WHO 0–11+). */
  uvIndexMax: number;
  sunshineSeconds: number;
  daylightSeconds: number;
  sunrise: string; // ISO local (e.g. 2026-12-28T05:46)
  sunset: string;
}

export interface CurrentWeather {
  temp: number;
  weatherCode: number;
  wind: number;
  cloudCover: number;
  isDay: boolean;
}

export interface WeatherData {
  current: CurrentWeather | null;
  days: DayForecast[];
  fetchedAt: number;
  fromCache: boolean;
}

const CACHE_KEY = 'gtl-weather-raw';
const TS_KEY = 'gtl-weather-ts';

function url(): string {
  return (
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${trip.weatherLat}&longitude=${trip.weatherLng}` +
    `&timezone=${encodeURIComponent(trip.timezone)}` +
    '&forecast_days=10' +
    '&current=temperature_2m,weather_code,wind_speed_10m,cloud_cover,is_day' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,' +
    'precipitation_probability_max,precipitation_sum,wind_speed_10m_max,' +
    'uv_index_max,sunshine_duration,daylight_duration,sunrise,sunset'
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toDomain(json: any, fetchedAt: number, fromCache: boolean): WeatherData {
  const c = json?.current;
  const current: CurrentWeather | null = c
    ? {
        temp: c.temperature_2m ?? 0,
        weatherCode: c.weather_code ?? 3,
        wind: c.wind_speed_10m ?? 0,
        cloudCover: c.cloud_cover ?? 0,
        isDay: (c.is_day ?? 1) === 1
      }
    : null;
  const d = json?.daily;
  const days: DayForecast[] = d?.time
    ? d.time.map((date: string, i: number) => ({
        date,
        weatherCode: d.weather_code?.[i] ?? 3,
        tempMax: d.temperature_2m_max?.[i] ?? 0,
        tempMin: d.temperature_2m_min?.[i] ?? 0,
        precipProbMax: d.precipitation_probability_max?.[i] ?? 0,
        precipSum: d.precipitation_sum?.[i] ?? 0,
        windMax: d.wind_speed_10m_max?.[i] ?? 0,
        uvIndexMax: d.uv_index_max?.[i] ?? 0,
        sunshineSeconds: d.sunshine_duration?.[i] ?? 0,
        daylightSeconds: d.daylight_duration?.[i] ?? 0,
        sunrise: d.sunrise?.[i] ?? '',
        sunset: d.sunset?.[i] ?? ''
      }))
    : [];
  return { current, days, fetchedAt, fromCache };
}

async function fetchAndCache(): Promise<WeatherData> {
  const res = await fetch(url());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const json = JSON.parse(text);
  const now = Date.now();
  if (browser) {
    try {
      localStorage.setItem(CACHE_KEY, text);
      localStorage.setItem(TS_KEY, String(now));
    } catch {
      /* storage full / private mode — ignore */
    }
  }
  return toDomain(json, now, false);
}

function loadCached(): WeatherData | null {
  if (!browser) return null;
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    return toDomain(JSON.parse(raw), Number(localStorage.getItem(TS_KEY) ?? '0'), true);
  } catch {
    return null;
  }
}

/** Network-first with cache fallback. Returns null only if both fail. */
export async function loadWeather(force = true): Promise<WeatherData | null> {
  if (force) {
    try {
      return await fetchAndCache();
    } catch {
      /* offline — fall through to cache */
    }
  }
  return loadCached();
}

// ---------- derived helpers ----------

export function sunshineFraction(d: DayForecast): number {
  if (d.daylightSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, d.sunshineSeconds / d.daylightSeconds));
}

/** 0..1 "great clear day" score: lots of sun, low rain chance, clear code. */
export function clearScore(d: DayForecast): number {
  const sun = sunshineFraction(d);
  const dry = Math.min(1, Math.max(0, 1 - d.precipProbMax / 100));
  const codeBonus = d.weatherCode <= 1 ? 0.15 : d.weatherCode <= 3 ? 0 : -0.1;
  return Math.min(1, Math.max(0, sun * 0.6 + dry * 0.4 + codeBonus));
}

export function isRainy(d: DayForecast): boolean {
  return d.precipProbMax >= 55 || d.precipSum >= 4 || (d.weatherCode >= 51 && d.weatherCode <= 99);
}

export type SkyKind = 'sun' | 'part' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';
export interface DaySky {
  kind: SkyKind;
  emoji: string;
  label: string;
}

/**
 * Single source of truth for "the sky of the DAY" — based on ACTUAL sunshine + precipitation,
 * not the daily WMO weather_code (Open-Meteo reports it pessimistically as "overcast" even on
 * days with plenty of sun). The forecast strip, the day alert and the daily suggestion all read
 * from here so they never contradict each other. (The "now" line still uses the instant code.)
 */
export function daySky(d: DayForecast): DaySky {
  const code = d.weatherCode;
  // Precipitation/hazards: the WMO code is reliable for these, so honour it first.
  if (code >= 95) return { kind: 'storm', emoji: '⛈️', label: 'Tempestade' };
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return { kind: 'snow', emoji: '🌨️', label: 'Neve' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { kind: 'rain', emoji: '🌧️', label: 'Chuva' };
  if (code >= 51 && code <= 57) return { kind: 'drizzle', emoji: '🌦️', label: 'Garoa' };
  if (code === 45 || code === 48) return { kind: 'fog', emoji: '🌫️', label: 'Neblina' };
  // Dry day → classify by how much of the daylight is actually sunny.
  const sun = sunshineFraction(d);
  if (sun >= 0.6) return { kind: 'sun', emoji: '☀️', label: 'Ensolarado' };
  if (sun >= 0.3) return { kind: 'part', emoji: '⛅', label: 'Sol entre nuvens' };
  return { kind: 'cloud', emoji: '☁️', label: 'Nublado' };
}

export function ageHours(w: WeatherData): number {
  return Math.floor((Date.now() - w.fetchedAt) / 3_600_000);
}
export function isStale(w: WeatherData): boolean {
  return ageHours(w) >= 6;
}
export function forDate(w: WeatherData, date: string): DayForecast | undefined {
  return w.days.find((d) => d.date === date);
}

export function wmoEmoji(code: number, isDay = true): string {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code === 1) return isDay ? '🌤️' : '🌙';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 57) return '🌦️';
  if (code >= 61 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '🌨️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code >= 85 && code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}

export function wmoLabel(code: number): string {
  if (code === 0) return 'Céu limpo';
  if (code === 1) return 'Predomínio de sol';
  if (code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code === 45 || code === 48) return 'Neblina';
  if (code >= 51 && code <= 57) return 'Garoa';
  if (code >= 61 && code <= 67) return 'Chuva';
  if (code >= 71 && code <= 77) return 'Neve';
  if (code >= 80 && code <= 82) return 'Pancadas de chuva';
  if (code >= 85 && code <= 86) return 'Pancadas de neve';
  if (code >= 95) return 'Tempestade';
  return '—';
}

/** "2026-06-04T17:52" → "17:52". */
export function hhmm(iso: string): string {
  return iso && iso.length >= 16 ? iso.slice(11, 16) : '';
}

/** Golden hour ≈ 50 min before sunset → "17:02". */
export function goldenHour(sunsetIso: string): string {
  const t = hhmm(sunsetIso);
  if (!t) return '';
  let [h, m] = t.split(':').map(Number);
  m -= 50;
  if (m < 0) {
    m += 60;
    h -= 1;
  }
  return `${String((h + 24) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
