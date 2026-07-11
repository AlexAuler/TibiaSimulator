/**
 * Gerador dos datasets de data/seed/*.json a partir da TibiaWiki (Fandom).
 *
 * - Busca wikitext via API do MediaWiki (lotes de 50 títulos).
 * - Faz parse dos infoboxes (Creature/Object/Spell) e converte para os
 *   schemas do projeto. Nenhum valor de mecânica é inventado: tudo sai do
 *   infobox; as FÓRMULAS de spell vêm da página Formulae (constantes abaixo,
 *   com fonte) — a disponibilidade de imbuement por tipo de item segue a
 *   página Imbuing.
 * - Emite também docs/data-review.md (tabela item -> fonte p/ revisão humana).
 *
 * Uso: node scripts/fetch-wiki-data.mjs
 * (Conteúdo da TibiaWiki é CC-BY-SA — atribuição em /creditos.)
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'TibiaSimDev/0.1 (fan project; contact via repo)';
const API = 'https://tibia.fandom.com/api.php';
const DATA_VERSION = '15.x';
const TODAY = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Listas curadas (Seção 6.1 do plano). Páginas ausentes são apenas reportadas.
// ---------------------------------------------------------------------------

const CREATURES = [
  'Dragon',
  'Dragon Lord',
  'Demon',
  'Hydra',
  'Giant Spider',
  'Behemoth',
  'Warlock',
  'Juggernaut',
  'Grim Reaper',
  'Hellspawn',
  'Guzzlemaw',
  'Frazzlemaw',
  'Silencer',
  'Dawnfire Asura',
  'Midnight Asura',
  'True Dawnfire Asura',
  'True Midnight Asura',
  'Falcon Knight',
  'Falcon Paladin',
  'Burster Spectre',
  'Cloak of Terror',
  'Brachiodemon',
  'Turbulent Elemental',
  'Rotten Golem',
  'Sopping Corpus',
  'Vexclaw',
  'Grimeleech',
  'Hellflayer',
  'Werelion',
  'Werelioness',
  'Burning Gladiator',
  'Priestess of the Wild Sun',
  'Cobra Assassin',
  'Cobra Scout',
  'Cobra Vizier',
];

/**
 * Catálogo COMPLETO de equipamentos: os títulos são enumerados das
 * categorias da TibiaWiki (list=categorymembers) em vez de lista curada.
 * O parse continua vindo do Infobox Object de cada página; páginas com o
 * banner {{Deprecated}} (conteúdo removido do jogo) são puladas.
 */
const ITEM_CATEGORIES = [
  'Sword Weapons',
  'Axe Weapons',
  'Club Weapons',
  'Fist Fighting Weapons',
  'Distance Weapons',
  'Wands',
  'Rods',
  'Ammunition',
  'Quivers',
  'Shields',
  'Spellbooks',
  'Helmets',
  'Armors',
  'Legs',
  'Boots',
  'Amulets and Necklaces',
  'Rings',
];

/**
 * Fórmulas de spell — página Formulae da TibiaWiki
 * (https://tibia.fandom.com/wiki/Formulae#Spell/Rune_Damage/Healing e
 *  #Melee-Based_Spells / #Distance-Based_Spells, acessado em 2026-07-10).
 * A wiki marca como observacionais/possivelmente desatualizadas desde 2020 —
 * refletido em assumptions na UI.
 *
 * levelMl:  dmg = floor(0.2*lvl) + b*ML + c
 * cd:       dmg = 0.2*lvl + ml*b (grupo "c/d" da wiki; sem constante)
 * weaponSkill: dmg = f*(skill + atkMult*atk + offset) + lvl/5
 */
const STRIKE = {
  kind: 'levelMl',
  min: { b: 1.403, c: 8 },
  max: { b: 2.203, c: 13 },
  levelCoef: 0.2,
};
const SPELL_DEFS = {
  'Flame Strike': { formula: STRIKE, aoe: false },
  'Energy Strike': { formula: STRIKE, aoe: false },
  'Ice Strike': { formula: STRIKE, aoe: false },
  'Terra Strike': { formula: STRIKE, aoe: false },
  'Death Strike': { formula: STRIKE, aoe: false },
  'Physical Strike': { formula: STRIKE, aoe: false },
  'Divine Missile': {
    formula: { kind: 'levelMl', min: { b: 1.79, c: 11 }, max: { b: 3, c: 18 }, levelCoef: 0.2 },
    aoe: false,
  },
  'Fire Wave': {
    formula: { kind: 'levelMl', min: { b: 1.25, c: 4 }, max: { b: 2, c: 12 }, levelCoef: 0.2 },
    aoe: true,
  },
  'Ice Wave': {
    formula: { kind: 'levelMl', min: { b: 0.81, c: 4 }, max: { b: 2, c: 12 }, levelCoef: 0.2 },
    aoe: true,
  },
  'Energy Beam': {
    formula: { kind: 'levelMl', min: { b: 2.5, c: 0 }, max: { b: 4, c: 0 }, levelCoef: 0.2 },
    aoe: true,
  },
  'Great Energy Beam': {
    formula: { kind: 'levelMl', min: { b: 4, c: 0 }, max: { b: 7, c: 0 }, levelCoef: 0.2 },
    aoe: true,
  },
  'Divine Caldera': {
    formula: { kind: 'levelMl', min: { b: 4, c: 0 }, max: { b: 6, c: 0 }, levelCoef: 0.2 },
    aoe: true,
  },
  'Terra Wave': {
    formula: { kind: 'levelMl', min: { b: 3.5, c: 0 }, max: { b: 7, c: 0 }, levelCoef: 0.2 },
    aoe: true,
  },
  'Energy Wave': {
    formula: { kind: 'levelMl', min: { b: 4.5, c: 0 }, max: { b: 9, c: 0 }, levelCoef: 0.2 },
    aoe: true,
  },
  "Hell's Core": {
    formula: { kind: 'levelMl', min: { b: 7, c: 0 }, max: { b: 14, c: 0 }, levelCoef: 0.2 },
    aoe: true,
  },
  'Rage of the Skies': {
    formula: { kind: 'levelMl', min: { b: 5, c: 0 }, max: { b: 12, c: 0 }, levelCoef: 0.2 },
    aoe: true,
  },
  'Wrath of Nature': {
    formula: { kind: 'levelMl', min: { b: 5, c: 0 }, max: { b: 10, c: 0 }, levelCoef: 0.2 },
    aoe: true,
  },
  'Eternal Winter': {
    formula: { kind: 'levelMl', min: { b: 6, c: 0 }, max: { b: 12, c: 0 }, levelCoef: 0.2 },
    aoe: true,
  },
  Berserk: {
    formula: {
      kind: 'weaponSkill',
      atkMultiplier: 1,
      offset: 0,
      ignoresWeaponAttack: false,
      minFactor: 0.5,
      maxFactor: 1.5,
    },
    aoe: true,
  },
  'Fierce Berserk': {
    formula: {
      kind: 'weaponSkill',
      atkMultiplier: 2,
      offset: 0,
      ignoresWeaponAttack: false,
      minFactor: 1.1,
      maxFactor: 3,
    },
    aoe: true,
  },
  Groundshaker: {
    formula: {
      kind: 'weaponSkill',
      atkMultiplier: 1,
      offset: 0,
      ignoresWeaponAttack: false,
      minFactor: 0.5,
      maxFactor: 1.1,
    },
    aoe: true,
  },
  'Whirlwind Throw': {
    formula: {
      kind: 'weaponSkill',
      atkMultiplier: 1,
      offset: 0,
      ignoresWeaponAttack: false,
      minFactor: 1 / 3,
      maxFactor: 1,
    },
    aoe: false,
  },
  'Ethereal Spear': {
    formula: {
      kind: 'weaponSkill',
      atkMultiplier: 0,
      offset: 25,
      ignoresWeaponAttack: true,
      minFactor: 1 / 3,
      maxFactor: 1,
    },
    aoe: false,
  },
};

// ---------------------------------------------------------------------------
// Utilidades de fetch e parse
// ---------------------------------------------------------------------------

const slug = (t) =>
  t
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const pageUrl = (title) =>
  'https://tibia.fandom.com/wiki/' + encodeURIComponent(title.replace(/ /g, '_'));

/**
 * Enumera TODAS as páginas (ns=0) que transcluem um template. Cobre itens
 * cuja página ainda não recebeu as tags de categoria (comum em conteúdo
 * recém-lançado) — a conversão filtra depois pelo primarytype do infobox.
 */
async function fetchEmbeddedIn(template) {
  const titles = [];
  let cont = '';
  do {
    const url =
      `${API}?action=query&list=embeddedin&eititle=${encodeURIComponent('Template:' + template)}` +
      `&einamespace=0&eilimit=500&format=json&formatversion=2` +
      (cont ? `&eicontinue=${encodeURIComponent(cont)}` : '');
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status} em embeddedin ${template}`);
    const data = await res.json();
    for (const p of data?.query?.embeddedin ?? []) titles.push(p.title);
    cont = data?.continue?.eicontinue ?? '';
    await new Promise((r) => setTimeout(r, 300));
  } while (cont);
  return titles;
}

/** Enumera os títulos (ns=0) de uma categoria, seguindo cmcontinue. */
async function fetchCategoryMembers(category) {
  const titles = [];
  let cont = '';
  do {
    const url =
      `${API}?action=query&list=categorymembers&cmtitle=${encodeURIComponent('Category:' + category)}` +
      `&cmlimit=500&cmtype=page&format=json&formatversion=2` +
      (cont ? `&cmcontinue=${encodeURIComponent(cont)}` : '');
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status} em Category:${category}`);
    const data = await res.json();
    for (const m of data?.query?.categorymembers ?? []) {
      if (m.ns === 0) titles.push(m.title);
    }
    cont = data?.continue?.cmcontinue ?? '';
    await new Promise((r) => setTimeout(r, 300));
  } while (cont);
  return titles;
}

async function fetchWikitext(titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    const url =
      `${API}?action=query&prop=revisions&rvslots=main&rvprop=content&format=json&formatversion=2&redirects=1&titles=` +
      encodeURIComponent(chunk.join('|'));
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    for (const p of data?.query?.pages ?? []) {
      if (!p.missing) out.set(p.title, p.revisions?.[0]?.slots?.main?.content ?? '');
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  return out;
}

/** Extrai o corpo do primeiro template {{name ...}} com contagem de chaves. */
function extractTemplate(text, name) {
  const start = text.search(new RegExp('\\{\\{\\s*' + name, 'i'));
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length - 1; i++) {
    if (text[i] === '{' && text[i + 1] === '{') {
      depth++;
      i++;
    } else if (text[i] === '}' && text[i + 1] === '}') {
      depth--;
      i++;
      if (depth === 0) return text.slice(start + 2, i - 1);
    }
  }
  return null;
}

/** Divide parâmetros top-level de um corpo de template (| fora de {{}}/[[]]). */
function splitParams(body) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === '{{' || two === '[[') {
      depth++;
      cur += two;
      i++;
    } else if (two === '}}' || two === ']]') {
      depth--;
      cur += two;
      i++;
    } else if (body[i] === '|' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else {
      cur += body[i];
    }
  }
  parts.push(cur);
  return parts;
}

/** Corpo de infobox -> mapa chave->valor (chaves nomeadas). */
function parseInfobox(text, templateName) {
  const body = extractTemplate(text, templateName);
  if (!body) return null;
  const map = {};
  for (const part of splitParams(body).slice(1)) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim().toLowerCase();
    const value = part.slice(eq + 1).trim();
    if (key) map[key] = value;
  }
  return map;
}

const stripLinks = (s) =>
  (s ?? '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\{\{[^}]*\}\}/g, '')
    .trim();

const num = (s) => {
  if (s == null) return undefined;
  const m = String(s)
    .replace(/,/g, '')
    .match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : undefined;
};

// ---------------------------------------------------------------------------
// Criaturas
// ---------------------------------------------------------------------------

const ELEMENT_ALIASES = {
  physical: 'physical',
  fire: 'fire',
  ice: 'ice',
  energy: 'energy',
  earth: 'earth',
  poison: 'earth',
  death: 'death',
  holy: 'holy',
};

function parseAbilities(value) {
  const attacks = [];
  if (!value) return attacks;
  // percorre sub-templates top-level do Ability List
  const listBody = extractTemplate(value, 'Ability List') ?? value;
  let i = 0;
  while (i < listBody.length - 1) {
    if (listBody.slice(i, i + 2) === '{{') {
      // captura template completo
      let depth = 0;
      let j = i;
      for (; j < listBody.length - 1; j++) {
        if (listBody.slice(j, j + 2) === '{{') {
          depth++;
          j++;
        } else if (listBody.slice(j, j + 2) === '}}') {
          depth--;
          j++;
          if (depth === 0) break;
        }
      }
      const tpl = listBody.slice(i + 2, j - 1);
      const params = splitParams(tpl);
      const tplName = params[0]?.trim().toLowerCase() ?? '';
      const positional = params.slice(1).filter((p) => !p.includes('='));
      const named = Object.fromEntries(
        params
          .slice(1)
          .filter((p) => p.includes('='))
          .map((p) => {
            const eq = p.indexOf('=');
            return [p.slice(0, eq).trim().toLowerCase(), p.slice(eq + 1).trim()];
          }),
      );
      const range = (s) => {
        const m = String(s ?? '').match(/(\d[\d,.]*)\s*-\s*(\d[\d,.]*)/);
        if (m)
          return { min: Number(m[1].replace(/[,.]/g, '')), max: Number(m[2].replace(/[,.]/g, '')) };
        const single = num(s);
        return single != null ? { min: single, max: single } : null;
      };
      if (tplName === 'melee') {
        const r = range(positional[0]);
        if (r) attacks.push({ name: 'Melee', element: 'physical', ...r });
      } else if (tplName === 'ability') {
        const name = stripLinks(positional[0] ?? '').trim() || 'Ability';
        const r = range(positional[1]);
        const elRaw = (named.element ?? positional[2] ?? '').toLowerCase().trim();
        const el = ELEMENT_ALIASES[elRaw];
        if (r && el) attacks.push({ name, element: el, min: r.min, max: r.max });
      }
      i = j + 1;
    } else {
      i++;
    }
  }
  return attacks;
}

function convertCreature(title, text) {
  const box = parseInfobox(text, 'Infobox[_ ]Creature');
  if (!box) return null;
  const mods = {};
  const modKeys = {
    physical: 'physicaldmgmod',
    earth: 'earthdmgmod',
    fire: 'firedmgmod',
    death: 'deathdmgmod',
    energy: 'energydmgmod',
    holy: 'holydmgmod',
    ice: 'icedmgmod',
  };
  for (const [el, key] of Object.entries(modKeys)) {
    const v = num(box[key]);
    mods[el] = v != null ? v / 100 : 1;
  }
  const hp = num(box.hp);
  if (hp == null) return null;
  const armor = num(box.armor);
  const mitigation = num(box.mitigation);
  return {
    id: slug(title),
    name: box.name?.trim() || title,
    hitpoints: hp,
    elementModifiers: mods,
    ...(armor != null ? { armor } : {}),
    ...(mitigation != null ? { mitigationPct: mitigation } : {}),
    attacks: parseAbilities(box.abilities),
    source: pageUrl(title),
  };
}

// ---------------------------------------------------------------------------
// Itens
// ---------------------------------------------------------------------------

function parseVocations(s) {
  const t = stripLinks(s ?? '').toLowerCase();
  const out = [];
  if (t.includes('knight')) out.push('knight');
  if (t.includes('paladin')) out.push('paladin');
  if (t.includes('sorcerer')) out.push('sorcerer');
  if (t.includes('druid')) out.push('druid');
  if (t.includes('monk')) out.push('monk');
  return out; // vazio = todas
}

function parseAttrib(s) {
  const out = { skillBonuses: {}, critChancePct: undefined, critExtraDmgPct: undefined };
  if (!s) return out;
  for (const raw of stripLinks(s).split(',')) {
    const part = raw.trim().toLowerCase();
    let m;
    if ((m = part.match(/(sword|axe|club|fist|distance) fighting\s*\+\s*(\d+)/))) {
      out.skillBonuses[m[1]] = (out.skillBonuses[m[1]] ?? 0) + Number(m[2]);
    } else if ((m = part.match(/magic level\s*\+\s*(\d+)/))) {
      out.skillBonuses.magic = (out.skillBonuses.magic ?? 0) + Number(m[1]);
    } else if ((m = part.match(/shielding\s*\+\s*(\d+)/))) {
      out.skillBonuses.shielding = (out.skillBonuses.shielding ?? 0) + Number(m[1]);
    } else if ((m = part.match(/critical hit chance\s*\+?\s*(\d+(?:\.\d+)?)%/))) {
      out.critChancePct = (out.critChancePct ?? 0) + Number(m[1]);
    } else if ((m = part.match(/critical extra damage\s*\+?\s*(\d+(?:\.\d+)?)%/))) {
      out.critExtraDmgPct = (out.critExtraDmgPct ?? 0) + Number(m[1]);
    }
  }
  return out;
}

function parseResist(s) {
  if (!s) return undefined;
  const out = {};
  for (const raw of stripLinks(s).split(',')) {
    const m = raw
      .trim()
      .toLowerCase()
      .match(/(physical|fire|ice|energy|earth|death|holy)\s*([+-])\s*(\d+(?:\.\d+)?)%/);
    if (m) out[m[1]] = (m[2] === '-' ? -1 : 1) * Number(m[3]);
  }
  return Object.keys(out).length ? out : undefined;
}

const SLOT_BY_PRIMARYTYPE = {
  'sword weapons': ['weapon'],
  'axe weapons': ['weapon'],
  'club weapons': ['weapon'],
  'fist fighting weapons': ['weapon'],
  'fist weapons': ['weapon'],
  'distance weapons': ['weapon'],
  wands: ['weapon'],
  rods: ['weapon'],
  ammunition: ['ammo'],
  quivers: ['offhand'],
  shields: ['offhand'],
  spellbooks: ['offhand'],
  helmets: ['helmet'],
  armors: ['armor'],
  legs: ['legs'],
  boots: ['boots'],
  'amulets and necklaces': ['amulet'],
  rings: ['ring'],
};

const WEAPONTYPE_BY_PRIMARY = {
  'sword weapons': 'sword',
  'axe weapons': 'axe',
  'club weapons': 'club',
  'fist fighting weapons': 'fist',
  'fist weapons': 'fist',
  'distance weapons': 'distance',
  wands: 'wand',
  rods: 'rod',
};

/** Wands/rods que aceitam Strike (nota da página Imbuing). */
const STRIKE_WANDS = new Set([
  'jungle rod',
  'rod of destruction',
  'wand of destruction',
  'cobra rod',
  'lion wand',
  'naga wand',
  'naga rod',
  'falcon rod',
  'falcon wand',
  'soulhexer',
  'soultainter',
]);

/**
 * Categorias de imbuement permitidas por tipo de item
 * (coluna "Available for" de https://tibia.fandom.com/wiki/Imbuing):
 * - conversão elemental: Melee Weapons, Bows and Crossbows (sem elemento nativo)
 * - Strike (crit): Melee Weapons, Bows, Crossbows e wands/rods da lista
 * - Vampirism: Weapons e Armors | Void: Weapons e Helmets
 * - skills: Helmets + arma correspondente | Blockade: Helmets, Shields, Spellbooks
 * - proteções: Armors, Shields e Spellbooks
 */
function allowedImbuements(kind, item) {
  const hasNativeElement = Boolean(item.attack?.element);
  switch (kind) {
    case 'melee': {
      const cats = ['critical', 'leechHp', 'leechMana', 'skillBoost'];
      return hasNativeElement ? cats : ['elementalDamage', ...cats];
    }
    case 'bow': {
      const cats = ['critical', 'leechHp', 'leechMana', 'skillBoost'];
      return hasNativeElement ? cats : ['elementalDamage', ...cats];
    }
    case 'wand': {
      const cats = ['leechHp', 'leechMana', 'skillBoost'];
      return STRIKE_WANDS.has(item.name.toLowerCase()) ? ['critical', ...cats] : cats;
    }
    case 'helmet':
      return ['leechMana', 'skillBoost'];
    case 'armor':
      return ['leechHp', 'protection'];
    case 'shield':
      return ['protection', 'skillBoost'];
    default:
      return null; // boots etc.: imbuements não modelados no MVP (Swiftness/Vibrancy)
  }
}

function convertItem(title, text) {
  // conteúdo removido do jogo (banner {{Deprecated}} no topo da página)
  if (/\{\{\s*Deprecated\s*[|}]/i.test(text)) return null;
  // itens de servidor de teste (ex.: "Bow of Destruction Test")
  if (/\btest\b/i.test(title)) return null;
  const box = parseInfobox(text, 'Infobox[_ ]Object');
  if (!box) return null;
  // objetos que não podem ser pegos não são equipáveis
  if ((box.pickupable ?? '').trim().toLowerCase() === 'no') return null;
  const primary = (box.primarytype ?? '').toLowerCase().trim();
  const slots = SLOT_BY_PRIMARYTYPE[primary];
  if (!slots) return null;

  const weaponType = WEAPONTYPE_BY_PRIMARY[primary];
  const attrib = parseAttrib(box.attrib);

  // attack físico + elemental (campos <el>_attack); arcos/bestas usam
  // atk_mod (modificador somado ao attack da munição — wiki/Formulae:
  // "Attack = attack da munição + attack modifier da arma de distância")
  const physical =
    (num(box.attack) ?? 0) + (weaponType === 'distance' ? (num(box.atk_mod) ?? 0) : 0);
  let element;
  for (const el of ['fire', 'earth', 'ice', 'energy', 'death', 'holy']) {
    const v = num(box[`${el}_attack`]);
    if (v != null && v > 0) element = { type: el, value: v };
  }
  const attack =
    physical > 0 || element ? { physical, ...(element ? { element } : {}) } : undefined;

  // wands/rods: faixa fixa "97 (94-100)" + damagetype
  let wandDamage;
  if (weaponType === 'wand' || weaponType === 'rod') {
    const m = String(box.damagerange ?? '').match(/(\d+)\s*-\s*(\d+)/);
    const el = ELEMENT_ALIASES[(box.damagetype ?? '').toLowerCase().trim()];
    if (m && el) wandDamage = { min: Number(m[1]), max: Number(m[2]), element: el };
  }

  // crit em campos próprios (wands modernas) ou no attrib
  const critChance = num(box.crithit_ch) ?? attrib.critChancePct;
  const critExtra = num(box.critextra_dmg) ?? attrib.critExtraDmgPct;

  const resistances = parseResist(box.resist);
  const armorVal = num(box.armor);
  const defense = num(box.defense);
  const hands = /two/i.test(box.hands ?? '') ? 2 : /one/i.test(box.hands ?? '') ? 1 : undefined;
  const imbueCount = num(box.imbueslots);

  const kind =
    weaponType === 'distance'
      ? 'bow'
      : weaponType === 'wand' || weaponType === 'rod'
        ? 'wand'
        : weaponType
          ? 'melee'
          : primary === 'helmets'
            ? 'helmet'
            : primary === 'armors'
              ? 'armor'
              : primary === 'shields' || primary === 'spellbooks'
                ? 'shield'
                : 'other';

  const item = {
    id: slug(title),
    name: box.name?.trim() || title,
    slots,
    vocations: parseVocations(box.vocrequired),
    minLevel: num(box.levelrequired) ?? 0,
    ...(weaponType ? { weaponType } : {}),
    ...(hands ? { hands } : {}),
    ...(attack ? { attack } : {}),
    ...(wandDamage ? { wandDamage } : {}),
    ...(defense != null && defense > 0 ? { defense } : {}),
    ...(armorVal != null && armorVal > 0 ? { armor: armorVal } : {}),
    source: pageUrl(title),
  };

  const attributes = {};
  if (Object.keys(attrib.skillBonuses).length) attributes.skillBonuses = attrib.skillBonuses;
  if (critChance != null) attributes.critChancePct = critChance;
  if (critExtra != null) attributes.critExtraDmgPct = critExtra;
  if (resistances) attributes.resistances = resistances;
  if (Object.keys(attributes).length) item.attributes = attributes;

  if (imbueCount && imbueCount > 0) {
    const allowed = allowedImbuements(kind, item);
    if (allowed) item.imbuementSlots = { count: Math.min(imbueCount, 3), allowed };
  }

  return item;
}

// ---------------------------------------------------------------------------
// Spells
// ---------------------------------------------------------------------------

function convertSpell(title, text) {
  const def = SPELL_DEFS[title];
  if (!def) return null;
  const box = parseInfobox(text, 'Infobox[_ ]Spell');
  if (!box) return null;
  const el = ELEMENT_ALIASES[(box.damagetype ?? '').toLowerCase().trim()];
  const vocations = parseVocations(box.voc);
  const mana = num(box.mana);
  const level = num(box.levelrequired);
  const cooldown = num(box.cooldown);
  if (!el || vocations.length === 0 || mana == null || level == null || cooldown == null) {
    console.warn(`spell com campos faltando: ${title}`);
    return null;
  }
  return {
    id: slug(title),
    name: box.name?.trim() || title,
    words: stripLinks(box.words ?? '').trim() || '?',
    vocations,
    minLevel: level,
    manaCost: mana,
    cooldownSec: cooldown,
    element: el,
    formula: def.formula,
    ...(num(box.basepower) != null ? { basePower: num(box.basepower) } : {}),
    isAoe: def.aoe,
    source: pageUrl(title),
  };
}

// ---------------------------------------------------------------------------
// Imbuements e charms (valores das páginas Imbuing/charms — Seção "fontes")
// ---------------------------------------------------------------------------

const IMBUING = 'https://tibia.fandom.com/wiki/Imbuing';
const TIERS = ['basic', 'intricate', 'powerful'];

function buildImbuements() {
  const out = [];
  // Conversão elemental: 10/25/50% (Scorch fire, Venom earth, Frost ice,
  // Electrify energy, Reap death)
  const conv = [
    ['scorch', 'fire'],
    ['venom', 'earth'],
    ['frost', 'ice'],
    ['electrify', 'energy'],
    ['reap', 'death'],
  ];
  const convPct = [10, 25, 50];
  for (const [name, element] of conv) {
    TIERS.forEach((tier, i) => {
      out.push({
        id: `${tier}-${name}`,
        name: `${cap(tier)} ${cap(name)}`,
        tier,
        category: 'elementalDamage',
        effect: { kind: 'elementalConversion', element, pct: convPct[i] },
        source: IMBUING,
      });
    });
  }
  // Strike (crit): chance +5% em todos os tiers; dano +5/15/40%
  const strikeDmg = [5, 15, 40];
  TIERS.forEach((tier, i) => {
    out.push({
      id: `${tier}-strike`,
      name: `${cap(tier)} Strike`,
      tier,
      category: 'critical',
      effect: { kind: 'critical', chancePct: 5, extraDmgPct: strikeDmg[i] },
      source: IMBUING,
    });
  });
  // Vampirism (leech hp): 5/10/25% | Void (leech mana): 3/5/8%
  const vamp = [5, 10, 25];
  const voidPct = [3, 5, 8];
  TIERS.forEach((tier, i) => {
    out.push({
      id: `${tier}-vampirism`,
      name: `${cap(tier)} Vampirism`,
      tier,
      category: 'leechHp',
      effect: { kind: 'leech', resource: 'hp', pct: vamp[i] },
      source: IMBUING,
    });
    out.push({
      id: `${tier}-void`,
      name: `${cap(tier)} Void`,
      tier,
      category: 'leechMana',
      effect: { kind: 'leech', resource: 'mana', pct: voidPct[i] },
      source: IMBUING,
    });
  });
  // Skill boosts: +1/+2/+4 (Slash sword, Chop axe, Bash club, Punch fist,
  // Precision distance, Blockade shielding, Epiphany magic)
  const skills = [
    ['slash', 'sword'],
    ['chop', 'axe'],
    ['bash', 'club'],
    ['punch', 'fist'],
    ['precision', 'distance'],
    ['blockade', 'shielding'],
    ['epiphany', 'magic'],
  ];
  const skillVal = [1, 2, 4];
  for (const [name, skill] of skills) {
    TIERS.forEach((tier, i) => {
      out.push({
        id: `${tier}-${name}`,
        name: `${cap(tier)} ${cap(name)}`,
        tier,
        category: 'skillBoost',
        effect: { kind: 'skillBoost', skill, value: skillVal[i] },
        source: IMBUING,
      });
    });
  }
  // Proteções: fire Dragon Hide, ice Quara Scale, energy Cloud Fabric,
  // earth Snake Skin, holy Demon Presence 3/8/15% | death Lich Shroud 2/5/10%
  const prot = [
    ['dragon-hide', 'Dragon Hide', 'fire', [3, 8, 15]],
    ['quara-scale', 'Quara Scale', 'ice', [3, 8, 15]],
    ['cloud-fabric', 'Cloud Fabric', 'energy', [3, 8, 15]],
    ['snake-skin', 'Snake Skin', 'earth', [3, 8, 15]],
    ['demon-presence', 'Demon Presence', 'holy', [3, 8, 15]],
    ['lich-shroud', 'Lich Shroud', 'death', [2, 5, 10]],
  ];
  for (const [id, name, element, pcts] of prot) {
    TIERS.forEach((tier, i) => {
      out.push({
        id: `${tier}-${id}`,
        name: `${cap(tier)} ${name}`,
        tier,
        category: 'protection',
        effect: { kind: 'protection', element, pct: pcts[i] },
        source: IMBUING,
      });
    });
  }
  return out;
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Charms ofensivos pós-rework (Winter Update 2024) — páginas individuais. */
function buildCharms() {
  const CH = (t) => `https://tibia.fandom.com/wiki/${t}`;
  const elemental = [
    ['wound', 'Wound', 'physical', 'Wound'],
    ['enflame', 'Enflame', 'fire', 'Enflame'],
    ['freeze', 'Freeze', 'ice', 'Freeze'],
    ['zap', 'Zap', 'energy', 'Zap'],
    ['poison-charm', 'Poison', 'earth', 'Poison'],
    ['curse-charm', 'Curse', 'death', 'Curse_(Charm)'],
    ['divine-wrath', 'Divine Wrath', 'holy', 'Divine_Wrath'],
  ];
  const out = elemental.map(([id, name, element, page]) => ({
    id,
    name,
    procChancePctByStage: [5, 10, 11],
    effect: {
      kind: 'proc',
      element,
      creatureMaxHpPct: 5,
      capCharacterLevelMultiplier: 2,
    },
    source: CH(page),
  }));
  out.push({
    id: 'overpower',
    name: 'Overpower',
    procChancePctByStage: [5, 10, 11],
    effect: {
      kind: 'procOwnStat',
      element: 'physical',
      stat: 'hp',
      ownStatPct: 5,
      capCreatureMaxHpPct: 8,
    },
    source: CH('Overpower'),
  });
  out.push({
    id: 'overflux',
    name: 'Overflux',
    procChancePctByStage: [5, 10, 11],
    effect: {
      kind: 'procOwnStat',
      element: 'physical',
      stat: 'mana',
      ownStatPct: 2.5,
      capCreatureMaxHpPct: 8,
    },
    source: CH('Overflux'),
  });
  out.push({
    id: 'low-blow',
    name: 'Low Blow',
    effect: { kind: 'critChance', chancePctByStage: [4, 8, 9] },
    source: CH('Low_Blow'),
  });
  out.push({
    id: 'savage-blow',
    name: 'Savage Blow',
    effect: { kind: 'critExtra', extraDmgPctByStage: [20, 40, 44] },
    source: CH('Savage_Blow'),
  });
  return out;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const spellTitles = Object.keys(SPELL_DEFS);

  console.log('Enumerando categorias de equipamento...');
  const categoryTitles = new Set();
  for (const cat of ITEM_CATEGORIES) {
    const members = await fetchCategoryMembers(cat);
    console.log(`  ${cat}: ${members.length}`);
    for (const t of members) categoryTitles.add(t);
  }
  console.log('Enumerando todas as páginas com Infobox Object (embeddedin)...');
  const embedded = await fetchEmbeddedIn('Infobox_Object');
  console.log(`  páginas com Infobox Object: ${embedded.length}`);
  const itemTitleSet = new Set([...categoryTitles, ...embedded]);
  const ITEMS = [...itemTitleSet].sort();
  console.log(`total de páginas candidatas (únicas): ${ITEMS.length}`);

  console.log('Buscando wikitext...');
  const [creatureTexts, itemTexts, spellTexts] = [
    await fetchWikitext(CREATURES),
    await fetchWikitext(ITEMS),
    await fetchWikitext(spellTitles),
  ];

  const creatures = [];
  for (const t of CREATURES) {
    const text = creatureTexts.get(t);
    if (!text) {
      console.warn('criatura ausente:', t);
      continue;
    }
    const c = convertCreature(t, text);
    if (c) creatures.push(c);
    else console.warn('criatura sem infobox:', t);
  }

  const items = [];
  const skippedFromCategory = [];
  let skippedOther = 0;
  for (const t of ITEMS) {
    const text = itemTexts.get(t);
    const it = text ? convertItem(t, text) : null;
    if (it) {
      items.push(it);
    } else if (categoryTitles.has(t)) {
      // pulado apesar de estar numa categoria de equipamento: listar p/ revisão
      skippedFromCategory.push(text ? t : `${t} (página ausente)`);
    } else {
      // objeto não-equipamento vindo do embeddedin (móveis, comida etc.)
      skippedOther++;
    }
  }
  console.log(`objetos não-equipamento ignorados (embeddedin): ${skippedOther}`);
  if (skippedFromCategory.length) {
    console.log(`itens de categoria pulados (deprecated/test/etc.): ${skippedFromCategory.length}`);
    for (const s of skippedFromCategory) console.log('  -', s);
  }

  const spells = [];
  for (const t of spellTitles) {
    const text = spellTexts.get(t);
    if (!text) {
      console.warn('spell ausente:', t);
      continue;
    }
    const s = convertSpell(t, text);
    if (s) spells.push(s);
  }

  const meta = { dataVersion: DATA_VERSION, generatedAt: TODAY };
  const seedDir = join(ROOT, 'data', 'seed');
  mkdirSync(seedDir, { recursive: true });
  const write = (file, obj) =>
    writeFileSync(join(seedDir, file), JSON.stringify(obj, null, 2) + '\n');

  write('creatures.json', { ...meta, creatures });
  write('items.json', { ...meta, items });
  write('spells.json', { ...meta, spells });
  write('imbuements.json', { ...meta, imbuements: buildImbuements() });
  write('charms.json', { ...meta, charms: buildCharms() });

  // docs/data-review.md
  const lines = [
    '# Revisão de dados (gerado por scripts/fetch-wiki-data.mjs)',
    '',
    `Gerado em ${TODAY} — dataVersion ${DATA_VERSION}. Conteúdo da TibiaWiki (CC-BY-SA).`,
    'Revisar os valores marcantes de cada registro contra a página fonte.',
    '',
    '## Criaturas',
    '',
    '| Criatura | HP | Armor | Mitigation | Ataques | Fonte |',
    '|---|---|---|---|---|---|',
    ...creatures.map(
      (c) =>
        `| ${c.name} | ${c.hitpoints} | ${c.armor ?? '—'} | ${c.mitigationPct ?? '—'} | ${c.attacks.length} | [wiki](${c.source}) |`,
    ),
    '',
    '## Itens',
    '',
    '| Item | Slot | Atk | Def | Arm | Level | Voc | Imbue | Fonte |',
    '|---|---|---|---|---|---|---|---|---|',
    ...items.map((i) => {
      const atk = i.attack
        ? `${i.attack.physical}${i.attack.element ? `+${i.attack.element.value}${i.attack.element.type}` : ''}`
        : i.wandDamage
          ? `${i.wandDamage.min}-${i.wandDamage.max} ${i.wandDamage.element}`
          : '—';
      return `| ${i.name} | ${i.slots.join('/')} | ${atk} | ${i.defense ?? '—'} | ${i.armor ?? '—'} | ${i.minLevel} | ${i.vocations.join(',') || 'todas'} | ${i.imbuementSlots?.count ?? '—'} | [wiki](${i.source}) |`;
    }),
    '',
    '## Spells',
    '',
    '| Spell | Words | Voc | Level | Mana | CD | Elemento | Fórmula | Fonte |',
    '|---|---|---|---|---|---|---|---|---|',
    ...spells.map(
      (s) =>
        `| ${s.name} | ${s.words} | ${s.vocations.join(',')} | ${s.minLevel} | ${s.manaCost} | ${s.cooldownSec}s | ${s.element} | ${s.formula.kind} | [wiki](${s.source}) |`,
    ),
    '',
    '## Observações',
    '',
    '- Fórmulas de spell: página Formulae (marcadas como possivelmente desatualizadas desde 2020).',
    '- Spells do Monk: sem fórmulas documentadas na TibiaWiki — fora do MVP (banner de suporte parcial).',
    '- Boots: slots de imbuement existem no jogo (Swiftness/Vibrancy) mas não são modelados no MVP.',
    '- Leech nativo de itens (hpleech_am/manaleech_am) não modelado no MVP.',
  ];
  writeFileSync(join(ROOT, 'docs', 'data-review.md'), lines.join('\n') + '\n');

  console.log(
    `ok: ${creatures.length} criaturas, ${items.length} itens, ${spells.length} spells, ` +
      `${buildImbuements().length} imbuements, ${buildCharms().length} charms`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
