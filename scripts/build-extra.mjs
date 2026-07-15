// Gera src/lib/contentExtra.ts a partir de scripts/data/*.json (saída dos pesquisadores).
// Dedup contra os âncoras de content.ts e entre si; limpa &amp; → &; calcula distanceKm se faltar.
// Uso: node scripts/build-extra.mjs
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const CONTENT = path.join(ROOT, 'src', 'lib', 'content.ts');
const OUT = path.join(ROOT, 'src', 'lib', 'contentExtra.ts');

const HOME = { lat: -34.9243, lng: -56.1565 }; // Punta Carretas (base)
const EXCLUDE_IDS = new Set([
  'ap_pocitos', 'ap_punta_carretas_faro', 'ap_ciudad_vieja', 'ap_prado',
  'comp_feria_villa_biarritz', 'ap_mercado_del_puerto'
]);
const VALID_FIT = new Set(['CLEAR_SKY', 'RAIN_OK', 'INDOOR', 'ANY']);

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const deamp = (s) => (typeof s === 'string' ? s.replace(/&amp;/g, '&') : s);
function deepDeamp(o) {
  if (Array.isArray(o)) return o.map(deepDeamp);
  if (o && typeof o === 'object') { const r = {}; for (const k in o) r[k] = deepDeamp(o[k]); return r; }
  return deamp(o);
}
function haversineKm(a, b) {
  const R = 6371, t = (d) => (d * Math.PI) / 180;
  const dLat = t(b.lat - a.lat), dLng = t(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

const content = await fs.readFile(CONTENT, 'utf8');
const anchorNames = new Set([...content.matchAll(/name: '((?:[^'\\]|\\')*)'/g)].map((m) => norm(m[1].replace(/\\'/g, "'"))));
const anchorIds = new Set([...content.matchAll(/\bid: '([^']+)'/g)].map((m) => m[1]));

let files = [];
try { files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.json')).sort(); } catch {}
if (!files.length) { console.error('Nenhum arquivo em scripts/data/*.json'); process.exit(1); }

const all = [];
for (const f of files) {
  const arr = JSON.parse(await fs.readFile(path.join(DATA_DIR, f), 'utf8'));
  for (const it of (Array.isArray(arr) ? arr : [])) all.push(it);
}

const seenId = new Set(), seenName = new Set(), out = [], dropped = [];
for (let it of all) {
  it = deepDeamp(it);
  if (!it.id || !it.name) { dropped.push(`${it.name || '?'} (sem id/name)`); continue; }
  if (EXCLUDE_IDS.has(it.id)) { dropped.push(`${it.name} (excluído)`); continue; }
  if (anchorIds.has(it.id) || anchorNames.has(norm(it.name))) { dropped.push(`${it.name} (dup âncora)`); continue; }
  if (seenId.has(it.id) || seenName.has(norm(it.name))) { dropped.push(`${it.name} (dup)`); continue; }
  seenId.add(it.id); seenName.add(norm(it.name));
  if (!VALID_FIT.has(it.fit)) it.fit = 'ANY';
  if (!(it.distanceKm > 0) && typeof it.lat === 'number' && typeof it.lng === 'number') {
    const d = Math.round(haversineKm(HOME, { lat: it.lat, lng: it.lng }));
    if (d > 0) it.distanceKm = d;
  }
  out.push(it);
}

const counts = {};
for (const a of out) counts[a.categoryId] = (counts[a.categoryId] || 0) + 1;
const header = `// AUTO-GERADO por scripts/build-extra.mjs — não editar à mão.\n// ${out.length} locais (pesquisa por região). Fonte: scripts/data/*.json\nimport type { Attraction, LinkRef } from './content';\n\n`;
const body = `export const extraAttractions: Attraction[] = ${JSON.stringify(out, null, 2)};\n\nexport const linksByName: Record<string, LinkRef[]> = {};\n`;
await fs.writeFile(OUT, header + body, 'utf8');
console.log('Escrito', path.relative(ROOT, OUT), '—', out.length, 'locais');
console.log('Por categoria:', counts);
if (dropped.length) console.log('Removidos:', dropped.join('; '));
