import { z } from 'zod';
import {
  ElementSchema,
  ImbuementCategorySchema,
  SkillKeySchema,
  SlotSchema,
  VocationSchema,
} from './enums';

/**
 * Item equipável (Seção 4 do PLANO-MVP).
 * Desvio documentado vs. plano: campo extra `wandDamage` para wands/rods,
 * cujo auto-attack usa uma faixa fixa de dano elemental do próprio item
 * (não há fórmula por skill na TibiaWiki para wands).
 */

export const ItemAttackSchema = z.object({
  physical: z.number().int().min(0),
  element: z
    .object({
      type: ElementSchema,
      value: z.number().int().min(0),
    })
    .optional(),
});

export const ItemSchema = z.object({
  /** slug estável, ex.: "falcon-longsword" */
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** nome em inglês, como no jogo */
  name: z.string().min(1),
  slots: z.array(SlotSchema).min(1),
  /** vazio = todas as vocações */
  vocations: z.array(VocationSchema),
  minLevel: z.number().int().min(0),
  weaponType: z
    .enum(['sword', 'axe', 'club', 'fist', 'distance', 'wand', 'rod', 'none'])
    .optional(),
  /**
   * Tipo do item de offhand. Regra do jogo: arma de duas mãos bloqueia o
   * offhand, EXCETO quiver com arma de distância
   * (https://tibia.fandom.com/wiki/Quivers).
   */
  offhandKind: z.enum(['shield', 'spellbook', 'quiver']).optional(),
  hands: z.union([z.literal(1), z.literal(2)]).optional(),
  attack: ItemAttackSchema.optional(),
  /** faixa de dano fixa de wands/rods */
  wandDamage: z
    .object({
      min: z.number().int().min(0),
      max: z.number().int().min(0),
      element: ElementSchema,
    })
    .optional(),
  defense: z.number().int().min(0).optional(),
  armor: z.number().int().min(0).optional(),
  attributes: z
    .object({
      skillBonuses: z.record(SkillKeySchema, z.number().int()).optional(),
      critChancePct: z.number().min(0).max(100).optional(),
      critExtraDmgPct: z.number().min(0).max(100).optional(),
      /** % de proteção por elemento (positivo protege, negativo é fraqueza) */
      resistances: z.record(ElementSchema, z.number().min(-100).max(100)).optional(),
    })
    .optional(),
  imbuementSlots: z
    .object({
      count: z.number().int().min(1).max(3),
      allowed: z.array(ImbuementCategorySchema).min(1),
    })
    .optional(),
  /** URL da página da TibiaWiki de onde os valores foram extraídos */
  source: z.string().url(),
});

export type Item = z.infer<typeof ItemSchema>;
export type ItemAttack = z.infer<typeof ItemAttackSchema>;
