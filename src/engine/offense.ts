/**
 * Pipeline ofensivo (Seção 5.2/5.3 do PLANO-MVP).
 * Puro: sem React, sem fetch, sem DOM.
 */

import {
  ATTACK_INTERVAL_SEC,
  ATTACK_VALUE_DIVISOR,
  ATTACK_VALUE_SKILL_OFFSET,
  ATTACK_VALUE_WEAPON_FACTOR,
  BASE_CRIT_CHANCE_PCT,
  BASE_CRIT_EXTRA_DMG_PCT,
  BASE_DAMAGE_CONST,
  BASE_DAMAGE_LEVEL_OFFSET,
  BASE_DAMAGE_SQRT_OFFSET,
  BASE_DAMAGE_STEP_FACTOR,
  SPELL_LEVEL_COEF,
  WEAPON_SPELL_LEVEL_DIVISOR,
} from './constants';
import { WEAPON_SKILL } from './schemas/enums';
import type { AttackMode, Element } from './schemas/enums';
import type { Spell } from './schemas/spell';
import type { AutoAttackResult, SpellResult } from './schemas/result';
import type { CharacterSheet } from './character';

/**
 * Dano base por level.
 * S = floor((sqrt(2L + 2025) + 5)/10);  B = floor((L+1000)/S) + 50S - 450
 * fonte: https://tibia.fandom.com/wiki/Formulae#Base_Damage_and_Healing
 */
export function baseDamage(level: number): number {
  const step = Math.floor((Math.sqrt(2 * level + BASE_DAMAGE_SQRT_OFFSET) + 5) / 10);
  return (
    Math.floor((level + BASE_DAMAGE_LEVEL_OFFSET) / step) +
    BASE_DAMAGE_STEP_FACTOR * step -
    BASE_DAMAGE_CONST
  );
}

/**
 * Attack Value da Cyclopedia (= dano MÉDIO contra alvo sem defesas).
 * fonte: https://tibia.fandom.com/wiki/Formulae#Attack_Value
 */
export function attackValue(
  level: number,
  weaponAttack: number,
  skill: number,
  mode: AttackMode,
): number {
  const { factor, round } = ATTACK_VALUE_WEAPON_FACTOR[mode];
  const raw = weaponAttack * factor;
  const w = round === 'floor' ? Math.floor(raw) : round === 'ceil' ? Math.ceil(raw) : raw;
  return (
    baseDamage(level) + Math.floor((w * (skill + ATTACK_VALUE_SKILL_OFFSET)) / ATTACK_VALUE_DIVISOR)
  );
}

/** Fontes de crítico agregadas (aditivo — premissa documentada). */
export interface CritSources {
  chancePct: number;
  extraDmgPct: number;
}

export function collectCrit(sheet: CharacterSheet, includeCharm: boolean): CritSources {
  let chance = BASE_CRIT_CHANCE_PCT;
  let extra = BASE_CRIT_EXTRA_DMG_PCT;
  for (const e of sheet.equipped) {
    chance += e.item.attributes?.critChancePct ?? 0;
    extra += e.item.attributes?.critExtraDmgPct ?? 0;
    for (const imb of e.imbuements) {
      if (imb.effect.kind === 'critical') {
        chance += imb.effect.chancePct;
        extra += imb.effect.extraDmgPct;
      }
    }
  }
  if (includeCharm && sheet.charm) {
    const stage = sheet.charmStage - 1;
    if (sheet.charm.effect.kind === 'critChance') {
      chance += sheet.charm.effect.chancePctByStage[stage];
    }
    if (sheet.charm.effect.kind === 'critExtra') {
      extra += sheet.charm.effect.extraDmgPctByStage[stage];
    }
  }
  return { chancePct: Math.min(chance, 100), extraDmgPct: extra };
}

/** Multiplicador esperado do crítico: 1 + chance% * extra%. */
export function expectedCritMultiplier(crit: CritSources): number {
  return 1 + (crit.chancePct / 100) * (crit.extraDmgPct / 100);
}

export interface AutoAttackComputation {
  result: AutoAttackResult | null;
  unavailableReason?: string;
}

/**
 * Auto-attack com split elemental:
 * 1) soma attack físico+elemental da arma (e munição, para distance),
 * 2) média = Attack Value; min = dano base; max = 2*média - min
 *    (distribuição uniforme — consistente com as fórmulas históricas da wiki,
 *     onde min = lvl/5 e média = (min+max)/2),
 * 3) conversão de imbuement move % da PARTE FÍSICA para o elemento
 *    ("Part of Physical Damage is converted to X" — wiki/Imbuing),
 * 4) crit esperado multiplica a média (não os limites min/max).
 * Wands/rods: faixa fixa do item (sem skill/modo de ataque).
 */
export function computeAutoAttack(
  sheet: CharacterSheet,
  includeCharmCrit: boolean,
): AutoAttackComputation {
  const { weapon, ammo, build } = sheet;
  if (!weapon || !weapon.item.weaponType || weapon.item.weaponType === 'none') {
    return { result: null, unavailableReason: 'no-weapon' };
  }
  const wt = weapon.item.weaponType;
  const crit = collectCrit(sheet, includeCharmCrit);
  const critMult = expectedCritMultiplier(crit);

  // Wands/rods: faixa fixa de dano elemental do item.
  if (wt === 'wand' || wt === 'rod') {
    const wd = weapon.item.wandDamage;
    if (!wd) return { result: null, unavailableReason: 'wand-without-range' };
    const avg = ((wd.min + wd.max) / 2) * critMult;
    return {
      result: {
        min: wd.min,
        avg,
        max: wd.max,
        dps: avg / ATTACK_INTERVAL_SEC,
        breakdownByElement: { [wd.element]: avg },
        critMultiplier: critMult,
      },
    };
  }

  // Componentes de attack: arma + munição (distance de duas mãos exige munição).
  const parts: Partial<Record<Element, number>> = {};
  const addPart = (el: Element, v: number) => {
    if (v > 0) parts[el] = (parts[el] ?? 0) + v;
  };
  addPart('physical', weapon.item.attack?.physical ?? 0);
  if (weapon.item.attack?.element) {
    addPart(weapon.item.attack.element.type, weapon.item.attack.element.value);
  }
  if (wt === 'distance' && weapon.item.hands === 2) {
    if (!ammo) return { result: null, unavailableReason: 'no-ammo' };
    addPart('physical', ammo.item.attack?.physical ?? 0);
    if (ammo.item.attack?.element) {
      addPart(ammo.item.attack.element.type, ammo.item.attack.element.value);
    }
  }

  const totalAttack = Object.values(parts).reduce((a, b) => a + b, 0);
  if (totalAttack <= 0) return { result: null, unavailableReason: 'no-attack-value' };

  // Conversão de imbuement (arma e munição): move % da parte física.
  const imbuements = [...weapon.imbuements, ...(ammo?.imbuements ?? [])];
  for (const imb of imbuements) {
    if (imb.effect.kind === 'elementalConversion' && (parts.physical ?? 0) > 0) {
      const moved = (parts.physical ?? 0) * (imb.effect.pct / 100);
      parts.physical = (parts.physical ?? 0) - moved;
      addPart(imb.effect.element, moved);
    }
  }

  const skillKey = WEAPON_SKILL[wt];
  const skill = skillKey ? sheet.effectiveSkill(skillKey) : 0;
  const min = baseDamage(build.level);
  const avgBase = attackValue(build.level, totalAttack, skill, build.attackMode);
  const max = 2 * avgBase - min;
  const avg = avgBase * critMult;

  const breakdown: Partial<Record<Element, number>> = {};
  for (const [el, v] of Object.entries(parts) as Array<[Element, number]>) {
    if (v > 0) breakdown[el] = (v / totalAttack) * avg;
  }

  return {
    result: {
      min,
      avg,
      max,
      dps: avg / ATTACK_INTERVAL_SEC,
      breakdownByElement: breakdown,
      critMultiplier: critMult,
    },
  };
}

/**
 * Dano de spell (Seção 5.3).
 * levelMl:      dmg = floor(0.2*lvl) + b*effML + c
 * weaponSkill:  dmg = f*(skill + atkMult*atk + offset) + lvl/5
 * fonte: https://tibia.fandom.com/wiki/Formulae#Spell/Rune_Damage/Healing e #Melee-Based_Spells
 */
export function computeSpell(sheet: CharacterSheet, spell: Spell): SpellResult {
  const { build } = sheet;
  let min = 0;
  let max = 0;

  if (spell.formula.kind === 'levelMl') {
    const effMl = sheet.effectiveSkill('magic');
    const levelTerm = Math.floor(build.level * (spell.formula.levelCoef ?? SPELL_LEVEL_COEF));
    min = levelTerm + spell.formula.min.b * effMl + spell.formula.min.c;
    max = levelTerm + spell.formula.max.b * effMl + spell.formula.max.c;
  } else {
    const f = spell.formula;
    const weapon = sheet.weapon;
    const skillKey =
      weapon?.item.weaponType && WEAPON_SKILL[weapon.item.weaponType]
        ? WEAPON_SKILL[weapon.item.weaponType]!
        : spell.element === 'physical' && spell.vocations.includes('paladin')
          ? 'distance'
          : 'fist';
    const skill = sheet.effectiveSkill(skillKey);
    const weaponAtk = f.ignoresWeaponAttack
      ? 0
      : (weapon?.item.attack?.physical ?? 0) +
        (weapon?.item.attack?.element?.value ?? 0) +
        (weapon?.item.weaponType === 'distance' && weapon.item.hands === 2
          ? (sheet.ammo?.item.attack?.physical ?? 0) +
            (sheet.ammo?.item.attack?.element?.value ?? 0)
          : 0);
    const term = skill + (f.atkMultiplier ?? 1) * weaponAtk + (f.offset ?? 0);
    const levelTerm = build.level / WEAPON_SPELL_LEVEL_DIVISOR;
    min = f.minFactor * term + levelTerm;
    max = f.maxFactor * term + levelTerm;
  }

  min = Math.max(0, min);
  max = Math.max(min, max);
  const avg = (min + max) / 2;

  return {
    spellId: spell.id,
    name: spell.name,
    element: spell.element,
    min,
    avg,
    max,
    dmgPerCooldownSec: spell.cooldownSec > 0 ? avg / spell.cooldownSec : avg,
    manaPerDamage: avg > 0 ? spell.manaCost / avg : 0,
  };
}
