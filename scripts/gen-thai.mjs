// Gera src/lib/contentExtra.ts a partir dos datasets de pesquisa da Tailândia.
// Uso: node scripts/gen-thai.mjs <dir-dos-json>
import fs from 'node:fs';
import path from 'node:path';

const dataDir = process.argv[2];
if (!dataDir) {
  console.error('Informe o diretório dos JSONs de dados.');
  process.exit(1);
}

const read = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));

const bangkok = read('bangkok.json');
const norte = read('norte.json');
const sul = read('sul-ilhas.json');
const tc = read('thailand_content.json'); // { dishes, useful }

// Bangkok central (âncora dos pratos, que não têm lugar fixo).
const BKK = { lat: 13.7466, lng: 100.5347 };

// Pratos viram cards da categoria "comida". Sem lugar fixo: ancoramos em Bangkok
// com um leve leque (pra não empilhar no mapa) e mapQuery = nome do prato, então
// tocar no mapa procura restaurantes que servem o prato onde quer que estejam.
const dishes = tc.dishes.map((d, i) => ({
  ...d,
  lat: +(BKK.lat + (i - tc.dishes.length / 2) * 0.0016).toFixed(5),
  lng: +(BKK.lng + ((i % 2 ? 1 : -1) * (1 + (i % 3))) * 0.0016).toFixed(5),
  mapQuery: d.mapQuery ?? `${d.name} Thailand`,
  isDish: true
}));

const all = [...bangkok, ...norte, ...sul, ...dishes];

// Sanidade: ids únicos, coords presentes.
const ids = new Set();
for (const a of all) {
  if (ids.has(a.id)) throw new Error(`id duplicado: ${a.id}`);
  ids.add(a.id);
  if (typeof a.lat !== 'number' || typeof a.lng !== 'number')
    throw new Error(`sem coordenadas: ${a.id}`);
  // limpa campos vazios que não agregam
  if (a.whereToEat === '') delete a.whereToEat;
}

const header = `// AUTO-GERADO por scripts/gen-thai.mjs — não editar à mão.
// ${all.length} locais (pesquisa por região) + pratos típicos. Fonte: scratchpad/thai-data + thailand_content.json
import type { Attraction, LinkRef } from './content';

export const extraAttractions: Attraction[] = `;

const body = JSON.stringify(all, null, 2);

const footer = `;

// Nenhum link oficial por-nome nesta versão (as fontes vão em usefulInfo/links por card).
export const linksByName: Record<string, LinkRef[]> = {};
`;

const out = path.resolve('src/lib/contentExtra.ts');
fs.writeFileSync(out, header + body + footer, 'utf8');
console.log(`✓ ${out} — ${all.length} attractions (${dishes.length} pratos)`);
