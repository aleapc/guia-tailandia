import type { Attraction } from './content';

/**
 * Deep link that opens the device's map app (Google Maps on Android, Google/Apple on iOS).
 * Named places (shops, restaurants) search by name; nature spots route to coordinates.
 */
export function mapsUrl(a: Attraction): string {
  return a.mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.mapQuery)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`;
}

/** Build a "search by name" query that lands on the place card with rating/reviews/photos. */
function nameQuery(a: Attraction): string {
  return a.mapQuery ?? `${a.name}, Thailand`;
}

/** Opens Google Maps on the place's card (rating + reviews + photos + hours). */
export function googleReviewsUrl(a: Attraction): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nameQuery(a))}`;
}

/** Opens TripAdvisor search for the place name. */
export function tripadvisorUrl(a: Attraction): string {
  return `https://www.tripadvisor.com/Search?q=${encodeURIComponent(nameQuery(a))}`;
}
