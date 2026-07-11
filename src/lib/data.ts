/**
 * Carrega e valida os datasets de data/seed (uma vez, em import).
 * Falha de validação => erro de build (dados nunca entram quebrados).
 */

import itemsRaw from '../../data/seed/items.json';
import creaturesRaw from '../../data/seed/creatures.json';
import spellsRaw from '../../data/seed/spells.json';
import imbuementsRaw from '../../data/seed/imbuements.json';
import charmsRaw from '../../data/seed/charms.json';

import {
  ItemsFileSchema,
  CreaturesFileSchema,
  SpellsFileSchema,
  ImbuementsFileSchema,
  CharmsFileSchema,
  type Datasets,
} from '@/engine/schemas/dataset';
import type { Item } from '@/engine/schemas/item';
import type { Creature } from '@/engine/schemas/creature';
import type { Spell } from '@/engine/schemas/spell';
import type { Imbuement } from '@/engine/schemas/imbuement';
import type { OffensiveCharm } from '@/engine/schemas/charm';
import type { Slot, Vocation } from '@/engine/schemas/enums';

export const datasets: Datasets = {
  items: ItemsFileSchema.parse(itemsRaw),
  creatures: CreaturesFileSchema.parse(creaturesRaw),
  spells: SpellsFileSchema.parse(spellsRaw),
  imbuements: ImbuementsFileSchema.parse(imbuementsRaw),
  charms: CharmsFileSchema.parse(charmsRaw),
};

export const allItems: Item[] = datasets.items.items;
export const allCreatures: Creature[] = [...datasets.creatures.creatures].sort((a, b) =>
  a.name.localeCompare(b.name),
);
export const allSpells: Spell[] = datasets.spells.spells;
export const allImbuements: Imbuement[] = datasets.imbuements.imbuements;
export const allCharms: OffensiveCharm[] = datasets.charms.charms;

export const itemById = new Map(allItems.map((i) => [i.id, i]));
export const creatureById = new Map(allCreatures.map((c) => [c.id, c]));
export const spellById = new Map(allSpells.map((s) => [s.id, s]));
export const imbuementById = new Map(allImbuements.map((i) => [i.id, i]));
export const charmById = new Map(allCharms.map((c) => [c.id, c]));

export function itemFitsVocation(item: Item, vocation: Vocation): boolean {
  return item.vocations.length === 0 || item.vocations.includes(vocation);
}

/** Itens candidatos a um slot, filtrados por vocação e level (RF3). */
export function itemsForSlot(slot: Slot, vocation: Vocation, level: number): Item[] {
  return allItems
    .filter((i) => i.slots.includes(slot) && itemFitsVocation(i, vocation) && i.minLevel <= level)
    .sort((a, b) => b.minLevel - a.minLevel || a.name.localeCompare(b.name));
}

export function spellsForVocation(vocation: Vocation): Spell[] {
  return allSpells
    .filter((s) => s.vocations.includes(vocation))
    .sort((a, b) => a.minLevel - b.minLevel);
}

export const dataMeta = {
  dataVersion: datasets.items.dataVersion,
  generatedAt: datasets.items.generatedAt,
};
