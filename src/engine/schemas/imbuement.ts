import { z } from 'zod';
import {
  ElementSchema,
  ImbuementCategorySchema,
  ImbuementTierSchema,
  SkillKeySchema,
} from './enums';

/**
 * Imbuement (Seção 4 do PLANO-MVP).
 * Valores por tier extraídos de https://tibia.fandom.com/wiki/Imbuing
 * (conversão elemental 10/25/50%, Vampirism 5/10/25%, Void 3/5/8%,
 * Strike +5% chance e +5/15/40% de dano crítico, skills +1/+2/+4,
 * proteções 3/8/15% — death 2/5/10%).
 */

export const ImbuementEffectSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('elementalConversion'),
    element: ElementSchema,
    /** % do dano físico da arma convertido para o elemento */
    pct: z.number().min(0).max(100),
  }),
  z.object({
    kind: z.literal('critical'),
    chancePct: z.number().min(0).max(100),
    extraDmgPct: z.number().min(0).max(100),
  }),
  z.object({
    kind: z.literal('leech'),
    resource: z.enum(['hp', 'mana']),
    pct: z.number().min(0).max(100),
  }),
  z.object({
    kind: z.literal('skillBoost'),
    skill: SkillKeySchema,
    value: z.number().int().min(0),
  }),
  z.object({
    kind: z.literal('protection'),
    element: ElementSchema,
    pct: z.number().min(0).max(100),
  }),
]);

export const ImbuementSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** ex.: "Powerful Strike" */
  name: z.string().min(1),
  tier: ImbuementTierSchema,
  category: ImbuementCategorySchema,
  effect: ImbuementEffectSchema,
  source: z.string().url(),
});

export type Imbuement = z.infer<typeof ImbuementSchema>;
export type ImbuementEffect = z.infer<typeof ImbuementEffectSchema>;
