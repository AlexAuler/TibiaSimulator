import { z } from 'zod';
import { ElementSchema } from './enums';

/**
 * Charm ofensivo (Seção 4 do PLANO-MVP), atualizado para o rework de charms
 * (Winter Update 2024): cada charm tem 3 estágios de upgrade com chance de
 * proc própria (ex.: 5%/10%/11%).
 * fontes: páginas individuais dos charms na TibiaWiki, ex.:
 * https://tibia.fandom.com/wiki/Wound (acessado em 2026-07-10)
 *
 * Efeitos modelados:
 * - proc: dano em % do HP máximo da criatura, limitado a 2x o level do
 *   personagem (aplicado ANTES das resistências) — Wound/Enflame/etc.
 * - procOwnStat: dano físico em % do próprio HP/mana máximo, limitado a
 *   8% do HP máximo da criatura — Overpower/Overflux.
 * - critChance / critExtra: bônus de crítico — Low Blow/Savage Blow.
 */

export const CharmEffectSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('proc'),
    element: ElementSchema,
    /** % do HP máximo da criatura */
    creatureMaxHpPct: z.number().min(0).max(100),
    /** teto do dano em múltiplos do level do personagem */
    capCharacterLevelMultiplier: z.number().min(0),
  }),
  z.object({
    kind: z.literal('procOwnStat'),
    element: ElementSchema,
    stat: z.enum(['hp', 'mana']),
    /** % do stat máximo do personagem */
    ownStatPct: z.number().min(0).max(100),
    /** teto em % do HP máximo da criatura */
    capCreatureMaxHpPct: z.number().min(0).max(100),
  }),
  z.object({
    kind: z.literal('critChance'),
    /** bônus de chance de crítico por estágio (1..3), em % */
    chancePctByStage: z.tuple([z.number(), z.number(), z.number()]),
  }),
  z.object({
    kind: z.literal('critExtra'),
    /** bônus de dano extra de crítico por estágio (1..3), em % */
    extraDmgPctByStage: z.tuple([z.number(), z.number(), z.number()]),
  }),
]);

export const OffensiveCharmSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  /** chance de ativação por estágio de upgrade (1..3), em % (efeitos proc*) */
  procChancePctByStage: z.tuple([z.number(), z.number(), z.number()]).optional(),
  effect: CharmEffectSchema,
  source: z.string().url(),
});

export type OffensiveCharm = z.infer<typeof OffensiveCharmSchema>;
export type CharmEffect = z.infer<typeof CharmEffectSchema>;
export type CharmStage = 1 | 2 | 3;
