/**
 * Resolução da Build (ids) em uma "ficha" concreta com itens/imbuements/charm
 * materializados e skills efetivas. Puro: entrada Build + Datasets.
 */

import { migrateBuild, type Build } from './schemas/build';
import type { Datasets } from './schemas/dataset';
import type { Item } from './schemas/item';
import type { Imbuement } from './schemas/imbuement';
import type { OffensiveCharm, CharmStage } from './schemas/charm';
import type { Creature } from './schemas/creature';
import type { Spell } from './schemas/spell';
import type { SkillKey, Slot } from './schemas/enums';

export interface EquippedEntry {
  slot: Slot;
  item: Item;
  imbuements: Imbuement[];
}

export interface CharacterSheet {
  build: Build;
  equipped: EquippedEntry[];
  weapon: EquippedEntry | null;
  offhand: EquippedEntry | null;
  ammo: EquippedEntry | null;
  charm: OffensiveCharm | null;
  charmStage: CharmStage;
  /** alvos da simulação (um local de caça seleciona vários) */
  targets: Creature[];
  spells: Spell[];
  /** skill base + bônus de equipamento + imbuements skillBoost */
  effectiveSkill: (key: SkillKey) => number;
}

export function resolveSheet(rawBuild: Build, data: Datasets): CharacterSheet {
  const build = migrateBuild(rawBuild); // permalinks antigos: targetCreatureId único
  const itemById = new Map(data.items.items.map((i) => [i.id, i]));
  const imbById = new Map(data.imbuements.imbuements.map((i) => [i.id, i]));
  const spellById = new Map(data.spells.spells.map((s) => [s.id, s]));

  const equipped: EquippedEntry[] = [];
  for (const [slot, eq] of Object.entries(build.equipment)) {
    if (!eq) continue;
    const item = itemById.get(eq.itemId);
    if (!item) continue; // id desconhecido no dataset — ignorado (RF11)
    const imbuements = eq.imbuementIds
      .map((id) => imbById.get(id))
      .filter((x): x is Imbuement => Boolean(x));
    equipped.push({ slot: slot as Slot, item, imbuements });
  }

  const bySlot = (slot: Slot) => equipped.find((e) => e.slot === slot) ?? null;

  const skillBonus = (key: SkillKey): number => {
    let bonus = 0;
    for (const e of equipped) {
      bonus += e.item.attributes?.skillBonuses?.[key] ?? 0;
      for (const imb of e.imbuements) {
        if (imb.effect.kind === 'skillBoost' && imb.effect.skill === key) {
          bonus += imb.effect.value;
        }
      }
    }
    return bonus;
  };

  const charm = build.charmId
    ? (data.charms.charms.find((c) => c.id === build.charmId) ?? null)
    : null;

  const creatureById = new Map(data.creatures.creatures.map((c) => [c.id, c]));
  const targets = build.targetCreatureIds
    .map((id) => creatureById.get(id))
    .filter((c): c is Creature => Boolean(c));

  const spells = build.selectedSpellIds
    .map((id) => spellById.get(id))
    .filter((s): s is Spell => Boolean(s));

  return {
    build,
    equipped,
    weapon: bySlot('weapon'),
    offhand: bySlot('offhand'),
    ammo: bySlot('ammo'),
    charm,
    charmStage: build.charmStage,
    targets,
    spells,
    effectiveSkill: (key) => (build.skills[key] ?? 0) + skillBonus(key),
  };
}
