import { attractions } from '$lib/content';

export const prerender = true;

export function entries() {
  return attractions.map((a) => ({ id: a.id }));
}

export function load({ params }: { params: { id: string } }) {
  return { id: params.id };
}
