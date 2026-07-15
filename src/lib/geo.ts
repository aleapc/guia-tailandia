import { attractions, type Attraction } from './content';

/** Great-circle distance in km between two lat/lng points (haversine). */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface NearbyItem {
  a: Attraction;
  km: number;
}

/** Attractions sorted by distance from a point, optionally filtered by category. */
export function nearest(lat: number, lng: number, categoryId?: string, limit = 12): NearbyItem[] {
  return attractions
    .filter((a) => (categoryId ? a.categoryId === categoryId : true))
    .map((a) => ({ a, km: distanceKm(lat, lng, a.lat, a.lng) }))
    .sort((x, y) => x.km - y.km)
    .slice(0, limit);
}

/** Browser geolocation as a promise. */
export function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocalização não suportada'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    });
  });
}
