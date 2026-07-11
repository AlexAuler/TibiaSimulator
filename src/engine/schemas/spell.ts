import { z } from 'zod';
import { ElementSchema, VocationSchema } from './enums';

/**
 * Spell ofensiva (Seção 4 do PLANO-MVP).
 * As fórmulas vêm da página Formulae da TibiaWiki
 * (https://tibia.fandom.com/wiki/Formulae, acessado em 2026-07-10).
 * A wiki marca essas fórmulas como baseadas em observação e possivelmente
 * desatualizadas desde o Vocation Adjustment de 2020 — isso é exibido nas
 * `assumptions` do resultado (princípio de honestidade, Seção 1 do plano).
 *
 * Dois formatos documentados:
 * - levelMl:  dmg = floor(0.2*level) + b*effectiveML + c   (min/max com b/c próprios)
 * - weaponSkill: dmg = f*(skill + atkMult*atk + offset) + level/5
 *   (spells físicas de knight e Ethereal Spear de paladin)
 */

export const SpellFormulaSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('levelMl'),
    min: z.object({ b: z.number(), c: z.number() }),
    max: z.object({ b: z.number(), c: z.number() }),
    /** coeficiente do termo de level (0.2 nas fórmulas da wiki) */
    levelCoef: z.number().default(0.2),
  }),
  z.object({
    kind: z.literal('weaponSkill'),
    /** multiplicador do attack da arma dentro do termo de skill (2 no Fierce Berserk) */
    atkMultiplier: z.number().default(1),
    /** constante somada ao termo de skill (25 no Ethereal Spear, que ignora atk) */
    offset: z.number().default(0),
    /** true quando a spell ignora o attack da arma (Ethereal Spear) */
    ignoresWeaponAttack: z.boolean().default(false),
    minFactor: z.number(),
    maxFactor: z.number(),
  }),
]);

export const SpellSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** nome em inglês, ex.: "Fierce Berserk" */
  name: z.string().min(1),
  /** palavras mágicas, ex.: "exori gran" (exibição) */
  words: z.string().min(1),
  vocations: z.array(VocationSchema).min(1),
  minLevel: z.number().int().min(1),
  manaCost: z.number().int().min(0),
  cooldownSec: z.number().min(0),
  element: ElementSchema,
  formula: SpellFormulaSchema,
  /** métrica "Base Power" do cliente (14.10+), exibida como referência */
  basePower: z.number().optional(),
  /** true quando o alvo é área/múltiplo — MVP calcula dano single-target */
  isAoe: z.boolean().default(false),
  source: z.string().url(),
});

export type Spell = z.infer<typeof SpellSchema>;
export type SpellFormula = z.infer<typeof SpellFormulaSchema>;
