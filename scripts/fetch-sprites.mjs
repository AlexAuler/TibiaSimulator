/**
 * Baixa sprites da TibiaWiki (Fandom) para public/sprites/.
 * - itens:     File:<Nome>.gif  -> public/sprites/items/<id>.gif
 * - criaturas: File:<Nome>.gif  -> public/sprites/creatures/<id>.gif
 * - spells:    File:<Nome>.gif  -> public/sprites/spells/<id>.gif
 * - elementos: File:<El> Damage Icon.gif -> public/sprites/ui/<el>.gif
 * - outfits:   File:Outfit <Voc> Male.gif -> public/sprites/outfits/<voc>.gif
 *
 * Sprites são © CipSoft GmbH, hospedados pela comunidade na TibiaWiki.
 * Uso em projeto de fã, com atribuição em /creditos (pedido do dono do projeto;
 * ver nota de propriedade intelectual no README).
 *
 * Uso: node scripts/fetch-sprites.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'TibiaSimDev/0.1 (fan project; contact via repo)';
const API = 'https://tibia.fandom.com/api.php';

const read = (f) => JSON.parse(readFileSync(join(ROOT, 'data', 'seed', f), 'utf8'));
const items = read('items.json').items;
const creatures = read('creatures.json').creatures;
const spells = read('spells.json').spells;

const ELEMENTS = ['Physical', 'Fire', 'Ice', 'Energy', 'Earth', 'Death', 'Holy'];
const VOCATIONS = [
  ['knight', 'Outfit Knight Male.gif'],
  ['paladin', 'Outfit Hunter Male.gif'],
  ['sorcerer', 'Outfit Mage Male.gif'],
  ['druid', 'Outfit Druid Male.gif'],
  ['monk', 'Outfit Monk Male.gif'],
];

/** [fileTitle, destino relativo a public/sprites] */
const wanted = [
  ...items.map((i) => [`File:${i.name}.gif`, `items/${i.id}.gif`]),
  ...creatures.map((c) => [`File:${c.name}.gif`, `creatures/${c.id}.gif`]),
  ...spells.map((s) => [`File:${s.name}.gif`, `spells/${s.id}.gif`]),
  ...ELEMENTS.map((el) => [`File:${el} Damage Icon.gif`, `ui/${el.toLowerCase()}.gif`]),
  ...VOCATIONS.map(([voc, file]) => [`File:${file}`, `outfits/${voc}.gif`]),
];

async function resolveUrls(titles) {
  const map = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    const url =
      `${API}?action=query&prop=imageinfo&iiprop=url&format=json&formatversion=2&redirects=1&titles=` +
      encodeURIComponent(chunk.join('|'));
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    for (const p of data?.query?.pages ?? []) {
      const info = p.imageinfo?.[0]?.url;
      if (info) map.set(p.title, info);
    }
    // mapeia redirects/normalizações de volta ao título pedido
    for (const n of data?.query?.normalized ?? []) {
      if (map.has(n.to)) map.set(n.from, map.get(n.to));
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return map;
}

async function main() {
  const urls = await resolveUrls(wanted.map(([t]) => t));
  let ok = 0;
  const missing = [];
  for (const [title, dest] of wanted) {
    const url = urls.get(title);
    const outPath = join(ROOT, 'public', 'sprites', dest);
    if (!url) {
      missing.push(title);
      continue;
    }
    if (existsSync(outPath)) {
      ok++;
      continue;
    }
    mkdirSync(dirname(outPath), { recursive: true });
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(outPath, buf);
      ok++;
    } catch (e) {
      missing.push(`${title} (${e.message})`);
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  console.log(`sprites ok: ${ok}/${wanted.length}`);
  if (missing.length) {
    console.log('ausentes (a UI usa fallback):');
    for (const m of missing) console.log(' -', m);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
