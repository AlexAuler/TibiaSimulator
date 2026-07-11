/**
 * Orquestração: Build + Datasets -> SimulationResult (Seção 5 do PLANO-MVP).
 * Puro e determinístico (valores esperados; sem RNG).
 */

import { ATTACK_INTERVAL_SEC } from './constants';
import { resolveSheet } from './character';
import { computeAutoAttack, computeSpell } from './offense';
import { computeDefense, expectedArmorReduction } from './defense';
import { ASSUMPTION } from './assumptions';
import type { Build } from './schemas/build';
import type { Datasets } from './schemas/dataset';
import type { Creature } from './schemas/creature';
import type { Element } from './schemas/enums';
import type { SimulationResult, SpellResult, VsTargetResult } from './schemas/result';
import type { CharacterSheet } from './character';

/** Modificador elemental da criatura (1.0 quando não informado). */
function elementModifier(creature: Creature, element: Element): number {
  return creature.elementModifiers[element] ?? 1;
}

/** Fração restante após a mitigation da criatura (1.0 quando desconhecida). */
function mitigationFactor(creature: Creature): number {
  return creature.mitigationPct != null ? 1 - creature.mitigationPct / 100 : 1;
}

/**
 * Aplica modificadores do alvo a um dano com composição elemental:
 * componente × modificador elemental; físico ainda sofre redução esperada
 * do armor da criatura (se conhecido); tudo × (1 - mitigation).
 */
function applyTargetToBreakdown(
  breakdown: Partial<Record<Element, number>>,
  creature: Creature,
): number {
  const mit = mitigationFactor(creature);
  let total = 0;
  for (const [el, dmg] of Object.entries(breakdown) as Array<[Element, number]>) {
    let d = dmg * elementModifier(creature, el);
    if (el === 'physical' && creature.armor != null) {
      d = Math.max(0, d - expectedArmorReduction(creature.armor));
    }
    total += d;
  }
  return total * mit;
}

function spellVsTarget(spell: SpellResult, creature: Creature): number {
  return applyTargetToBreakdown({ [spell.element]: spell.avg }, creature);
}

/** Dano esperado do proc do charm contra o alvo (0 quando não aplicável). */
function charmProc(sheet: CharacterSheet, creature: Creature, charHp: number, charMana: number) {
  const charm = sheet.charm;
  if (!charm || !charm.procChancePctByStage) return null;
  const chancePct = charm.procChancePctByStage[sheet.charmStage - 1];
  const mit = mitigationFactor(creature);

  let raw = 0;
  let element: Element = 'physical';
  if (charm.effect.kind === 'proc') {
    element = charm.effect.element;
    raw = Math.min(
      (charm.effect.creatureMaxHpPct / 100) * creature.hitpoints,
      charm.effect.capCharacterLevelMultiplier * sheet.build.level,
    );
  } else if (charm.effect.kind === 'procOwnStat') {
    element = charm.effect.element;
    const stat = charm.effect.stat === 'hp' ? charHp : charMana;
    raw = Math.min(
      (charm.effect.ownStatPct / 100) * stat,
      (charm.effect.capCreatureMaxHpPct / 100) * creature.hitpoints,
    );
  } else {
    return null; // charms de crítico entram via collectCrit
  }

  const perProc = raw * elementModifier(creature, element) * mit;
  const expectedDps = ((chancePct / 100) * perProc) / ATTACK_INTERVAL_SEC;
  return { perProc, expectedDps };
}

export function simulate(build: Build, data: Datasets): SimulationResult {
  const sheet = resolveSheet(build, data);
  const assumptions = new Set<string>();
  assumptions.add(ASSUMPTION.estimates);
  assumptions.add(ASSUMPTION.attackInterval);
  assumptions.add(ASSUMPTION.noAdvancedSystems);
  assumptions.add(ASSUMPTION.playerMitigation);
  assumptions.add(ASSUMPTION.noShieldBlock);
  assumptions.add(ASSUMPTION.resistStacking);

  if (build.vocation === 'monk') assumptions.add(ASSUMPTION.monkPartial);

  // ---------- ofensa (painel neutro: sem charm) ----------
  const neutralAuto = computeAutoAttack(sheet, false);
  if (neutralAuto.result) {
    assumptions.add(ASSUMPTION.autoAttackModel);
    assumptions.add(ASSUMPTION.critModel);
    const wt = sheet.weapon?.item.weaponType;
    if (wt === 'distance') assumptions.add(ASSUMPTION.distanceHitChance);
    if (wt === 'wand' || wt === 'rod') assumptions.add(ASSUMPTION.wandFixedRange);
  }

  const perSpell: SpellResult[] = sheet.spells.map((s) => {
    if (s.isAoe) assumptions.add(ASSUMPTION.aoeSingleTarget);
    if (s.formula.kind === 'weaponSkill' && sheet.weapon?.item.attack?.element) {
      assumptions.add(ASSUMPTION.elementalWeaponSpells);
    }
    return computeSpell(sheet, s);
  });
  if (perSpell.length > 0) assumptions.add(ASSUMPTION.spellFormulasOutdated);

  // ---------- defesa ----------
  const defense = computeDefense(sheet);
  if (sheet.target && sheet.target.attacks.length > 0) assumptions.add(ASSUMPTION.creatureTurn);

  // ---------- contra o alvo ----------
  let vsTarget: VsTargetResult | null = null;
  let charmExpectedDps: number | undefined;
  let charmExpectedDamagePerProc: number | undefined;

  if (sheet.target) {
    const creature = sheet.target;
    if (creature.armor == null) assumptions.add(ASSUMPTION.creatureArmorMissing);
    assumptions.add(
      creature.mitigationPct != null
        ? ASSUMPTION.creatureMitigationApplied
        : ASSUMPTION.creatureMitigationMissing,
    );

    // auto-attack com bônus de crit do charm (charm ativo contra o alvo)
    const targetAuto = computeAutoAttack(sheet, true);
    const autoAvgVsTarget = targetAuto.result
      ? applyTargetToBreakdown(targetAuto.result.breakdownByElement, creature)
      : null;

    for (const s of perSpell) {
      s.avgVsTarget = spellVsTarget(s, creature);
    }

    const charm = charmProc(sheet, creature, defense.charHp, defense.charMana);
    if (charm) {
      assumptions.add(ASSUMPTION.charmOncePerAttack);
      charmExpectedDps = charm.expectedDps;
      charmExpectedDamagePerProc = charm.perProc;
    }

    const autoDps = autoAvgVsTarget != null ? autoAvgVsTarget / ATTACK_INTERVAL_SEC : null;
    const effectiveDps =
      autoDps != null ? autoDps + (charmExpectedDps ?? 0) : (charmExpectedDps ?? null);

    vsTarget = {
      effectiveDps,
      autoAttackAvgVsTarget: autoAvgVsTarget,
      hitsToKill:
        autoAvgVsTarget != null && autoAvgVsTarget > 0
          ? creature.hitpoints / autoAvgVsTarget
          : null,
      timeToKillSec:
        effectiveDps != null && effectiveDps > 0 ? creature.hitpoints / effectiveDps : null,
    };
  }

  return {
    offense: {
      autoAttack: neutralAuto.result,
      autoAttackUnavailableReason: neutralAuto.unavailableReason,
      perSpell,
      charmExpectedDps,
      charmExpectedDamagePerProc,
    },
    defense,
    vsTarget,
    assumptions: [...assumptions],
  };
}
