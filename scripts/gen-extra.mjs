// Generates src/lib/contentExtra.ts from scripts/data/*.json (research output).
// Usage:
//   node scripts/gen-extra.mjs --urls   -> prints every website URL (for validation)
//   node scripts/gen-extra.mjs          -> writes contentExtra.ts (reads urlcheck.json if present)
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const CONTENT = path.join(ROOT, 'src', 'lib', 'content.ts');
const OUT = path.join(ROOT, 'src', 'lib', 'contentExtra.ts');
const URLCHECK = path.join(__dirname, 'urlcheck.json');

// file -> default category (complementar uses per-item "cat")
const FILE_CAT = {
  'restaurantes.json': 'restaurantes',
  'cafe.json': 'cafe',
  'cerveja.json': 'cerveja',
  'chiloe.json': 'chiloe',
  'cidades.json': 'cidades',
  'apie.json': 'apie',
  'carro.json': 'carro',
  'cultura.json': 'cultura',
  'mercados.json': 'mercados',
  'roupa.json': 'roupa',
  'extra.json': null // per-item cat
};

// processing order (extra.json last so dedup keeps primary-file entries)
const ORDER = ['restaurantes.json','cafe.json','cerveja.json','chiloe.json','cidades.json','apie.json','carro.json','cultura.json','mercados.json','roupa.json','extra.json'];

const PREFIX = { restaurantes:'rest', cafe:'cafe', cerveja:'cerv', chiloe:'chil', cidades:'cid', apie:'ap', carro:'car', cultura:'cult', mercados:'merc', roupa:'roupa' };

// Names to drop (duplicates of places already in the app, or cross-file dups)
const EXCLUDE = new Set(['mesa tropera','la chalota','ensenada','las cascadas','iglesia parroquial sagrado corazon de jesus','la minga concept store']);
// der kuchenladen appears in cafe.json AND extra.json mercados -> global dedup keeps cafe.json (processed first)

const NAMED_CATS = new Set(['restaurantes','cafe','cerveja','mercados','roupa','cultura','cidades','chiloe']);
const VALID_FIT = new Set(['CLEAR_SKY','RAIN_OK','INDOOR','ANY']);

// Airbnb on Ruta 225, east of town (matches the existing places' "X km do Airbnb").
const HOME = { lat: -41.3108, lng: -72.9455 };

function stripAccents(s){ return s.normalize('NFD').replace(/[̀-ͯ]/g,''); }
function norm(s){ return stripAccents(String(s||'')).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
function slug(s){ return stripAccents(String(s||'')).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40); }

function haversineKm(a, b){
  const R=6371, toRad=d=>d*Math.PI/180;
  const dLat=toRad(b.lat-a.lat), dLng=toRad(b.lng-a.lng);
  const s=Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}

function imageFor(cat, name){
  const n = norm(name);
  switch(cat){
    case 'apie': return 'puerto-varas.jpg';
    case 'carro': return 'osorno.jpg';
    case 'cidades': return 'frutillar.jpg';
    case 'chiloe': return 'castro.jpg';
    case 'cultura': return /(iglesia|igreja|templo|catedral|capilla)/.test(n) ? 'iglesia.jpg' : 'museo.jpg';
    case 'mercados': return 'mercado.jpg';
    case 'restaurantes': return /(mar|marisco|curanto|pescado|chilot|ostra|angelmo)/.test(n) ? 'seafood.jpg' : 'grill.jpg';
    case 'cafe': return 'kuchen.jpg';
    case 'cerveja': return 'beer.jpg';
    case 'roupa': return /(salomon|bota|boots|calzad|rockford)/.test(n) ? 'boots.jpg' : 'jacket.jpg';
    default: return undefined;
  }
}

function durationFor(cat, drive){
  switch(cat){
    case 'apie': return '1–2h sem pressa';
    case 'carro': return drive>=150?'dia inteiro':drive>=75?'meio dia':'meio período';
    case 'cidades': return drive>=150?'dia inteiro':drive>=75?'meio dia / dia':'meio dia';
    case 'chiloe': return drive>=300?'dia inteiro / pernoite':'dia inteiro';
    case 'cultura': return '30–60 min';
    case 'mercados': return '30–45 min';
    case 'restaurantes': return 'almoço / jantar';
    case 'cafe': return 'parada de café';
    case 'cerveja': return 'fim de tarde';
    case 'roupa': return '30–45 min';
    default: return '1h';
  }
}

function fitFor(cat, raw){
  if (raw && VALID_FIT.has(raw)) return raw;
  if (raw === 'OUTDOOR') return 'CLEAR_SKY';
  // defaults
  if (['restaurantes','cafe','cerveja','roupa','mercados'].includes(cat)) return 'INDOOR';
  if (cat === 'cultura') return 'ANY';
  return 'ANY';
}

async function main(){
  const urlsOnly = process.argv.includes('--urls');

  // URL validation map (optional)
  let urlcheck = {};
  try { urlcheck = JSON.parse(await fs.readFile(URLCHECK,'utf8')); } catch {}
  const isIgFb = (u) => /instagram\.com|facebook\.com/i.test(u);
  const urlOk = (u) => {
    if (!u) return false;
    if (isIgFb(u)) return true;            // social: trust (bots blocked)
    if (!(u in urlcheck)) return true;     // not tested: trust
    return urlcheck[u] === true;           // tested: must pass
  };

  // existing names from content.ts (for linksByName matching)
  const contentSrc = await fs.readFile(CONTENT,'utf8');
  const existingNames = [...contentSrc.matchAll(/name: '((?:[^'\\]|\\')*)'/g)].map(m=>m[1].replace(/\\'/g,"'"));
  const existingByNorm = new Map(existingNames.map(n=>[norm(n), n]));

  // load data files
  const items = [];
  const existingLinksRaw = [];
  for (const file of ORDER){
    let txt;
    try { txt = await fs.readFile(path.join(DATA_DIR,file),'utf8'); } catch { continue; }
    const obj = JSON.parse(txt);
    const cat0 = FILE_CAT[file];
    for (const it of (obj.new||[])) items.push({ ...it, _cat: it.cat || cat0 });
    for (const el of (obj.existingLinks||[])) existingLinksRaw.push(el);
  }

  if (urlsOnly){
    const set = new Set();
    for (const it of items){ if (it.website && !isIgFb(it.website)) set.add(it.website); }
    for (const el of existingLinksRaw){ if (el.website && !isIgFb(el.website)) set.add(el.website); }
    process.stdout.write([...set].join('\n')+'\n');
    return;
  }

  // build extraAttractions
  const seen = new Set();
  const usedIds = new Set();
  const extra = [];
  let dropped = [];
  for (const it of items){
    const cat = it._cat;
    if (!cat || !PREFIX[cat]) continue;
    const nname = norm(it.name);
    if (EXCLUDE.has(nname)) { dropped.push(it.name+' (excluded)'); continue; }
    if (seen.has(nname)) { dropped.push(it.name+' (dup)'); continue; }
    seen.add(nname);

    let id = `${PREFIX[cat]}_${slug(it.name)}`;
    let k=2; while(usedIds.has(id)){ id = `${PREFIX[cat]}_${slug(it.name)}_${k++}`; } usedIds.add(id);

    const drive = Number(it.driveMinutesFromPV)||0;
    const dist = Math.round(haversineKm(HOME, {lat:it.lat,lng:it.lng}));
    const links = [];
    if (it.website && urlOk(it.website)) links.push({ label:'Site oficial', url: it.website });
    if (it.instagram) links.push({ label:'Instagram', url: it.instagram });

    const a = { id, categoryId: cat, name: it.name, tagline: it.tagline||'', description: it.description||'' };
    if (Array.isArray(it.whatToDo) && it.whatToDo.filter(Boolean).length) a.whatToDo = it.whatToDo.filter(Boolean);
    if (it.kingTip) a.kingTip = it.kingTip;
    a.lat = it.lat; a.lng = it.lng;
    if (dist>0) a.distanceKm = dist;
    if (drive>0) a.driveMinutes = drive;
    a.durationLabel = durationFor(cat, drive);
    a.fit = fitFor(cat, it.fit);
    if (it.windSensitive) a.windSensitive = true;
    if (it.note) a.hours = { note: it.note };
    // mapQuery: named places -> search by name; nature -> coords unless approx
    if (NAMED_CATS.has(cat)) a.mapQuery = `${it.name}${it.area? ', '+it.area:''}, Chile`;
    else if (it.approxCoords) a.mapQuery = `${it.name}, Chile`;
    a.image = imageFor(cat, it.name);
    if (links.length) a.links = links;
    extra.push(a);
  }

  // linksByName for EXISTING places
  const linksByName = {};
  let unmatched = [];
  for (const el of existingLinksRaw){
    const match = existingByNorm.get(norm(el.name))
      || existingNames.find(n => { const a=norm(n), b=norm(el.name); return a.startsWith(b)||b.startsWith(a); });
    if (!match){ unmatched.push(el.name); continue; }
    const links = [];
    if (el.website && urlOk(el.website)) links.push({ label:'Site oficial', url: el.website });
    if (el.instagram) links.push({ label:'Instagram', url: el.instagram });
    if (links.length && !linksByName[match]) linksByName[match] = links;
  }

  const header = `// AUTO-GENERATED by scripts/gen-extra.mjs — do not edit by hand.\n// ${extra.length} extra attractions + links for existing places.\nimport type { Attraction, LinkRef } from './content';\n\n`;
  const body = `export const extraAttractions: Attraction[] = ${JSON.stringify(extra, null, 2)};\n\nexport const linksByName: Record<string, LinkRef[]> = ${JSON.stringify(linksByName, null, 2)};\n`;
  await fs.writeFile(OUT, header+body, 'utf8');

  // counts per category
  const counts = {};
  for (const a of extra) counts[a.categoryId]=(counts[a.categoryId]||0)+1;
  console.log('Wrote', path.relative(ROOT,OUT));
  console.log('Extra per category:', counts);
  console.log('Total extra:', extra.length, '| linksByName:', Object.keys(linksByName).length);
  if (dropped.length) console.log('Dropped:', dropped.join('; '));
  if (unmatched.length) console.log('Unmatched existingLinks:', unmatched.join('; '));
}
main().catch(e=>{ console.error(e); process.exit(1); });
