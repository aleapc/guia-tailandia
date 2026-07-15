import { categories } from '$lib/content';

export const prerender = true;

export function entries() {
  return categories.map((c) => ({ id: c.id }));
}

export function load({ params }: { params: { id: string } }) {
  return { id: params.id };
}
