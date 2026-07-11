/**
 * Dataset sintético mínimo para testes do engine.
 * Os VALORES DE MECÂNICA (imbuements, charms, coeficientes de spell) são os
 * reais da TibiaWiki (mesmas fontes de data/seed); itens/criaturas são
 * fictícios para facilitar derivações manuais nos golden tests.
 */

import type { Datasets } from '../schemas/dataset';
import type { Build } from '../schemas/build';

const SRC = 'https://tibia.fandom.com/wiki/Formulae';

export const fixtureData: Datasets = {
  items: {
    dataVersion: 'test',
    generatedAt: '2026-07-10',
    items: [
      {
        id: 'test-sword',
        name: 'Test Sword',
        slots: ['weapon'],
        vocations: [],
        minLevel: 0,
        weaponType: 'sword',
        hands: 1,
        attack: { physical: 50 },
        defense: 30,
        imbuementSlots: {
          count: 2,
          allowed: ['elementalDamage', 'critical', 'leechHp', 'leechMana', 'skillBoost'],
        },
        source: SRC,
      },
      {
        id: 'test-death-axe',
        name: 'Test Death Axe',
        slots: ['weapon'],
        vocations: [],
        minLevel: 0,
        weaponType: 'axe',
        hands: 2,
        attack: { physical: 48, element: { type: 'death', value: 55 } },
        source: SRC,
      },
      {
        id: 'test-bow',
        name: 'Test Bow',
        slots: ['weapon'],
        vocations: ['paladin'],
        minLevel: 0,
        weaponType: 'distance',
        hands: 2,
        attack: { physical: 8 },
        source: SRC,
      },
      {
        id: 'test-arrow',
        name: 'Test Arrow',
        slots: ['ammo'],
        vocations: ['paladin'],
        minLevel: 0,
        attack: { physical: 42 },
        source: SRC,
      },
      {
        id: 'test-wand',
        name: 'Test Wand',
        slots: ['weapon'],
        vocations: ['sorcerer'],
        minLevel: 0,
        weaponType: 'wand',
        hands: 1,
        wandDamage: { min: 56, max: 74, element: 'energy' },
        source: SRC,
      },
      {
        id: 'test-shield',
        name: 'Test Shield',
        slots: ['offhand'],
        vocations: [],
        minLevel: 0,
        defense: 36,
        source: SRC,
      },
      {
        id: 'test-helmet',
        name: 'Test Helmet',
        slots: ['helmet'],
        vocations: [],
        minLevel: 0,
        armor: 9,
        attributes: { resistances: { fire: 10 } },
        source: SRC,
      },
      {
        id: 'test-armor',
        name: 'Test Armor',
        slots: ['armor'],
        vocations: [],
        minLevel: 0,
        armor: 16,
        attributes: { resistances: { fire: 5, energy: 8 }, skillBonuses: { sword: 3 } },
        source: SRC,
      },
      {
        id: 'test-crit-legs',
        name: 'Test Crit Legs',
        slots: ['legs'],
        vocations: [],
        minLevel: 0,
        armor: 10,
        attributes: { critChancePct: 10, critExtraDmgPct: 5 },
        source: SRC,
      },
    ],
  },
  imbuements: {
    dataVersion: 'test',
    generatedAt: '2026-07-10',
    imbuements: [
      // fonte: https://tibia.fandom.com/wiki/Imbuing (valores reais)
      {
        id: 'powerful-scorch',
        name: 'Powerful Scorch',
        tier: 'powerful',
        category: 'elementalDamage',
        effect: { kind: 'elementalConversion', element: 'fire', pct: 50 },
        source: 'https://tibia.fandom.com/wiki/Imbuing',
      },
      {
        id: 'powerful-strike',
        name: 'Powerful Strike',
        tier: 'powerful',
        category: 'critical',
        effect: { kind: 'critical', chancePct: 5, extraDmgPct: 40 },
        source: 'https://tibia.fandom.com/wiki/Imbuing',
      },
      {
        id: 'powerful-slash',
        name: 'Powerful Slash',
        tier: 'powerful',
        category: 'skillBoost',
        effect: { kind: 'skillBoost', skill: 'sword', value: 4 },
        source: 'https://tibia.fandom.com/wiki/Imbuing',
      },
      {
        id: 'powerful-dragon-hide',
        name: 'Powerful Dragon Hide',
        tier: 'powerful',
        category: 'protection',
        effect: { kind: 'protection', element: 'fire', pct: 15 },
        source: 'https://tibia.fandom.com/wiki/Imbuing',
      },
      {
        id: 'powerful-vampirism',
        name: 'Powerful Vampirism',
        tier: 'powerful',
        category: 'leechHp',
        effect: { kind: 'leech', resource: 'hp', pct: 25 },
        source: 'https://tibia.fandom.com/wiki/Imbuing',
      },
    ],
  },
  charms: {
    dataVersion: 'test',
    generatedAt: '2026-07-10',
    charms: [
      // fonte: https://tibia.fandom.com/wiki/Wound (valores reais pós-rework)
      {
        id: 'wound',
        name: 'Wound',
        procChancePctByStage: [5, 10, 11],
        effect: {
          kind: 'proc',
          element: 'physical',
          creatureMaxHpPct: 5,
          capCharacterLevelMultiplier: 2,
        },
        source: 'https://tibia.fandom.com/wiki/Wound',
      },
      {
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
        source: 'https://tibia.fandom.com/wiki/Overpower',
      },
      {
        id: 'low-blow',
        name: 'Low Blow',
        effect: { kind: 'critChance', chancePctByStage: [4, 8, 9] },
        source: 'https://tibia.fandom.com/wiki/Low_Blow',
      },
      {
        id: 'savage-blow',
        name: 'Savage Blow',
        effect: { kind: 'critExtra', extraDmgPctByStage: [20, 40, 44] },
        source: 'https://tibia.fandom.com/wiki/Savage_Blow',
      },
    ],
  },
  spells: {
    dataVersion: 'test',
    generatedAt: '2026-07-10',
    spells: [
      // fonte: https://tibia.fandom.com/wiki/Formulae (strike: x=1.403/2.203, y=8/13)
      {
        id: 'energy-strike',
        name: 'Energy Strike',
        words: 'exori vis',
        vocations: ['sorcerer', 'druid'],
        minLevel: 12,
        manaCost: 20,
        cooldownSec: 2,
        element: 'energy',
        formula: {
          kind: 'levelMl',
          min: { b: 1.403, c: 8 },
          max: { b: 2.203, c: 13 },
          levelCoef: 0.2,
        },
        isAoe: false,
        source: 'https://tibia.fandom.com/wiki/Energy_Strike',
      },
      // fonte: Formulae#Melee-Based_Spells: min 1.1(skill+2atk)+lvl/5, max 3(skill+2atk)+lvl/5
      {
        id: 'fierce-berserk',
        name: 'Fierce Berserk',
        words: 'exori gran',
        vocations: ['knight'],
        minLevel: 90,
        manaCost: 340,
        cooldownSec: 6,
        element: 'physical',
        formula: {
          kind: 'weaponSkill',
          atkMultiplier: 2,
          offset: 0,
          ignoresWeaponAttack: false,
          minFactor: 1.1,
          maxFactor: 3,
        },
        isAoe: true,
        source: 'https://tibia.fandom.com/wiki/Fierce_Berserk',
      },
      // fonte: Formulae#Distance-Based_Spells: min (skill+25)/3+lvl/5, max (skill+25)+lvl/5
      {
        id: 'ethereal-spear',
        name: 'Ethereal Spear',
        words: 'exori con',
        vocations: ['paladin'],
        minLevel: 23,
        manaCost: 25,
        cooldownSec: 2,
        element: 'physical',
        formula: {
          kind: 'weaponSkill',
          atkMultiplier: 0,
          offset: 25,
          ignoresWeaponAttack: true,
          minFactor: 1 / 3,
          maxFactor: 1,
        },
        isAoe: false,
        source: 'https://tibia.fandom.com/wiki/Ethereal_Spear',
      },
    ],
  },
  creatures: {
    dataVersion: 'test',
    generatedAt: '2026-07-10',
    creatures: [
      {
        id: 'test-dummy',
        name: 'Test Dummy',
        hitpoints: 1000,
        elementModifiers: {
          physical: 1,
          fire: 1,
          ice: 1,
          energy: 1,
          earth: 1,
          death: 1,
          holy: 1,
        },
        attacks: [],
        source: SRC,
      },
      {
        id: 'test-drake',
        name: 'Test Drake',
        hitpoints: 5000,
        // imune a fire, fraco a ice (+10%), resiste physical (-10%)
        elementModifiers: {
          physical: 0.9,
          fire: 0,
          ice: 1.1,
          energy: 1,
          earth: 0.8,
          death: 1,
          holy: 1,
        },
        armor: 20,
        mitigationPct: 5,
        attacks: [
          { name: 'melee', element: 'physical', min: 100, max: 300 },
          { name: 'fire wave', element: 'fire', min: 100, max: 200 },
        ],
        source: SRC,
      },
    ],
  },
  huntingPlaces: {
    dataVersion: 'test',
    generatedAt: '2026-07-10',
    huntingPlaces: [
      {
        id: 'test-lair',
        name: 'Test Lair',
        levelHint: { knight: 100 },
        creatureIds: ['test-drake', 'test-dummy'],
        source: SRC,
      },
    ],
  },
};

export function makeBuild(partial: Partial<Build>): Build {
  return {
    v: 1,
    vocation: 'knight',
    level: 300,
    skills: { magic: 10, fist: 10, club: 10, sword: 120, axe: 120, distance: 120, shielding: 110 },
    attackMode: 'offensive',
    equipment: {},
    charmStage: 3,
    targetCreatureIds: [],
    selectedSpellIds: [],
    ...partial,
  };
}
