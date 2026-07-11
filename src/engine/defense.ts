/**
 * Pipeline defensivo (Seção 5.4 do PLANO-MVP).
 * Puro: sem React, sem fetch, sem DOM.
 */

import {
  DEFENSE_VALUE_DIVISOR,
  DEFENSE_VALUE_FACTOR,
  DEFENSE_VALUE_SKILL_OFFSET,
  HP_FORMULA,
  MANA_FORMULA,
  armorReductionRange,
} from './constants';
import { WEAPON_SKILL } from './schemas/enums';
import type { Element } from './schemas/enums';
import type { Creature } from './schemas/creature';
import type { DefenseResult } from './schemas/result';
import type { CharacterSheet } from './character';

/** Armor total = soma do armor dos itens equipados. */
export function totalArmor(sheet: CharacterSheet): number {
  return sheet.equipped.reduce((sum, e) => sum + (e.item.armor ?? 0), 0);
}

/** Redução esperada de armor = média da faixa uniforme [r, R]. */
export function expectedArmorReduction(armor: number): number {
  if (armor <= 0) return 0;
  const { min, max } = armorReductionRange(armor);
  return (min + max) / 2;
}

/**
 * Proteções consolidadas por elemento.
 * A wiki documenta a aplicação POR ITEM, sequencial:
 * d = floor((100-p)/100 * d) para cada item com redução percentual
 * (https://tibia.fandom.com/wiki/Formulae#Percentage_Reduction) — ou seja,
 * agregação multiplicativa: total% = (1 - Π(1 - p_i/100)) * 100.
 * Imbuements de proteção entram como mais um fator.
 */
export function aggregateResistances(sheet: CharacterSheet): Partial<Record<Element, number>> {
  const factors: Partial<Record<Element, number>> = {};
  const apply = (el: Element, pct: number) => {
    if (pct === 0) return;
    factors[el] = (factors[el] ?? 1) * (1 - pct / 100);
  };
  for (const e of sheet.equipped) {
    const res = e.item.attributes?.resistances;
    if (res) {
      for (const [el, pct] of Object.entries(res) as Array<[Element, number]>) {
        apply(el, pct);
      }
    }
    for (const imb of e.imbuements) {
      if (imb.effect.kind === 'protection') apply(imb.effect.element, imb.effect.pct);
    }
  }
  const out: Partial<Record<Element, number>> = {};
  for (const [el, f] of Object.entries(factors) as Array<[Element, number]>) {
    out[el] = (1 - f) * 100;
  }
  return out;
}

/**
 * Defense Value da Cyclopedia (informativo).
 * Com escudo/spellbook: D = defense do offhand, S = shielding.
 * Sem escudo: D = defense da arma, S = skill da arma.
 * fonte: https://tibia.fandom.com/wiki/Formulae#Defense_Value
 */
export function defenseValue(sheet: CharacterSheet): number {
  const mode = sheet.build.attackMode;
  let d = 0;
  let skill = 0;
  if (sheet.offhand?.item.defense) {
    d = sheet.offhand.item.defense;
    skill = sheet.effectiveSkill('shielding');
  } else if (sheet.weapon?.item.defense) {
    d = sheet.weapon.item.defense;
    const wt = sheet.weapon.item.weaponType;
    const key = wt ? WEAPON_SKILL[wt] : null;
    skill = key ? sheet.effectiveSkill(key) : 0;
  } else {
    return 0;
  }
  const { factor, round } = DEFENSE_VALUE_FACTOR[mode];
  const raw = d * factor;
  const dMod = round === 'floor' ? Math.floor(raw) : round === 'ceil' ? Math.ceil(raw) : raw;
  return Math.floor((dMod * (skill + DEFENSE_VALUE_SKILL_OFFSET)) / DEFENSE_VALUE_DIVISOR);
}

/**
 * Dano esperado de um ataque da criatura contra o personagem:
 * 1) média simples entre min e max do ataque,
 * 2) reduções percentuais (itens+imbuements) — multiplicativas,
 * 3) físico: redução esperada de armor (as % vêm antes do armor na wiki).
 */
export function expectedIncomingDamage(
  sheet: CharacterSheet,
  creature: Creature,
): DefenseResult['perCreatureAttack'] {
  const resist = aggregateResistances(sheet);
  const armor = totalArmor(sheet);
  return creature.attacks.map((atk) => {
    let dmg = (atk.min + atk.max) / 2;
    const pct = resist[atk.element] ?? 0;
    dmg *= 1 - pct / 100;
    if (atk.element === 'physical') {
      dmg = Math.max(0, dmg - expectedArmorReduction(armor));
    }
    return { attackName: atk.name, element: atk.element, expectedDamage: dmg };
  });
}

export function computeDefense(sheet: CharacterSheet): DefenseResult {
  const { build, target } = sheet;
  const charHp = HP_FORMULA[build.vocation](build.level);
  const charMana = Math.max(0, MANA_FORMULA[build.vocation](build.level));
  const perCreatureAttack = target ? expectedIncomingDamage(sheet, target) : [];
  const avgIncomingPerTurn = perCreatureAttack.reduce((s, a) => s + a.expectedDamage, 0);
  return {
    totalArmor: totalArmor(sheet),
    resistances: aggregateResistances(sheet),
    charHp,
    charMana,
    defenseValue: defenseValue(sheet),
    perCreatureAttack,
    avgIncomingPerTurn,
    hitsToDie: avgIncomingPerTurn > 0 ? charHp / avgIncomingPerTurn : null,
  };
}
