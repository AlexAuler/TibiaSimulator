/**
 * ÚNICA casa das constantes de mecânica do jogo (CLAUDE.md / Seção 5.1 do plano).
 * Cada constante cita a fonte (TibiaWiki) e a data de acesso.
 * NUNCA adicionar números de mecânica fora deste arquivo.
 */

import type { AttackMode, Vocation } from './schemas/enums';

/**
 * Intervalo base entre auto-attacks, em segundos.
 * "Since charges are used every 2 seconds, like attack turns, ..."
 * fonte: https://tibia.fandom.com/wiki/Exercise_Weapons (acessado em 2026-07-10)
 */
export const ATTACK_INTERVAL_SEC = 2;

/**
 * Fatores do "Attack Value" da Cyclopedia por modo de ataque.
 * Offensive: B + floor( floor(6/5 * W) * (S+4)/28 )
 * Balanced:  B + floor(        W       * (S+4)/28 )
 * Defensive: B + floor( ceil(3/5 * W)  * (S+4)/28 )
 * fonte: https://tibia.fandom.com/wiki/Formulae#Attack_Value (acessado em 2026-07-10)
 */
export const ATTACK_VALUE_SKILL_OFFSET = 4;
export const ATTACK_VALUE_DIVISOR = 28;
export const ATTACK_VALUE_WEAPON_FACTOR: Record<
  AttackMode,
  { factor: number; round: 'floor' | 'ceil' | 'none' }
> = {
  offensive: { factor: 6 / 5, round: 'floor' },
  balanced: { factor: 1, round: 'none' },
  defensive: { factor: 3 / 5, round: 'ceil' },
};

/**
 * Fatores do "Defense Value" da Cyclopedia por modo de ataque.
 * Offensive: floor( ceil(7/10 * D) * (S+10)/40 )
 * Balanced:  floor(       D        * (S+10)/40 )
 * Defensive: floor( floor(8/5 * D) * (S+10)/40 )
 * fonte: https://tibia.fandom.com/wiki/Formulae#Defense_Value (acessado em 2026-07-10)
 */
export const DEFENSE_VALUE_SKILL_OFFSET = 10;
export const DEFENSE_VALUE_DIVISOR = 40;
export const DEFENSE_VALUE_FACTOR: Record<
  AttackMode,
  { factor: number; round: 'floor' | 'ceil' | 'none' }
> = {
  offensive: { factor: 7 / 10, round: 'ceil' },
  balanced: { factor: 1, round: 'none' },
  defensive: { factor: 8 / 5, round: 'floor' },
};

/**
 * Dano/cura base por level ("Base Damage and Healing"):
 * step  S = floor( (sqrt(2L + 2025) + 5) / 10 )
 * base  B = floor( (L + 1000) / S ) + 50*S - 450
 * fonte: https://tibia.fandom.com/wiki/Formulae#Base_Damage_and_Healing (acessado em 2026-07-10)
 */
export const BASE_DAMAGE_SQRT_OFFSET = 2025;
export const BASE_DAMAGE_LEVEL_OFFSET = 1000;
export const BASE_DAMAGE_STEP_FACTOR = 50;
export const BASE_DAMAGE_CONST = 450;

/**
 * Redução de dano físico por armor: uniforme entre
 * r = floor(t/2) e R = floor(t/2)*2 - 1  (t = armor total).
 * fonte: https://tibia.fandom.com/wiki/Formulae#Armor_Reduction (acessado em 2026-07-10)
 */
export const armorReductionRange = (totalArmor: number): { min: number; max: number } => {
  const r = Math.floor(totalArmor / 2);
  return { min: r, max: Math.max(r, r * 2 - 1) };
};

/**
 * HP e Mana totais por vocação/level (level >= 8, sem promoção; fórmulas fechadas).
 * Knight:   HP 5(3L+13)  Mana 5(L+10)
 * Paladin:  HP 5(2L+21)  Mana 5(3L-6)
 * Monk:     HP 5(2L+21)  Mana 5(2L-9)
 * Sorc/Druid: HP 5(L+29) Mana 5(6L-30)
 * fonte: https://tibia.fandom.com/wiki/Formulae#Hitpoints,_Mana,_and_Capacity (acessado em 2026-07-10)
 */
export const HP_FORMULA: Record<Vocation, (level: number) => number> = {
  knight: (l) => 5 * (3 * l + 13),
  paladin: (l) => 5 * (2 * l + 21),
  monk: (l) => 5 * (2 * l + 21),
  sorcerer: (l) => 5 * (l + 29),
  druid: (l) => 5 * (l + 29),
};
export const MANA_FORMULA: Record<Vocation, (level: number) => number> = {
  knight: (l) => 5 * (l + 10),
  paladin: (l) => 5 * (3 * l - 6),
  monk: (l) => 5 * (2 * l - 9),
  sorcerer: (l) => 5 * (6 * l - 30),
  druid: (l) => 5 * (6 * l - 30),
};

/**
 * Crítico intrínseco: "Since the Summer Update 2025, every character has
 * intrinsic 5% chance to deal 10% extra critical damage."
 * fonte: https://tibia.fandom.com/wiki/Critical_Hit (acessado em 2026-07-10)
 */
export const BASE_CRIT_CHANCE_PCT = 5;
export const BASE_CRIT_EXTRA_DMG_PCT = 10;

/**
 * Coeficiente do termo de level nas fórmulas de spell da wiki:
 * dmg = floor(lvl * 0.2) + mlvl * x + y
 * fonte: https://tibia.fandom.com/wiki/Formulae#Spell/Rune_Damage/Healing (acessado em 2026-07-10)
 * Obs.: a wiki marca essas fórmulas como possivelmente desatualizadas desde o
 * Vocation Adjustment de 2020 — sempre listado em assumptions.
 */
export const SPELL_LEVEL_COEF = 0.2;

/** Divisor do termo de level nas spells físicas: + lvl/5 (mesma fonte acima). */
export const WEAPON_SPELL_LEVEL_DIVISOR = 5;
