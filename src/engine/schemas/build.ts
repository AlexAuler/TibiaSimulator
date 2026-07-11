import { z } from 'zod';
import { AttackModeSchema, SkillKeySchema, SlotSchema, VocationSchema } from './enums';

/**
 * Estado serializável da build (permalink). Manter PEQUENO e versionado
 * (Seção 4 do PLANO-MVP).
 */

export const EquippedItemSchema = z.object({
  itemId: z.string(),
  imbuementIds: z.array(z.string()).default([]),
});

export const BuildSchema = z.object({
  v: z.literal(1),
  vocation: VocationSchema,
  level: z.number().int().min(1).max(3000),
  skills: z.record(SkillKeySchema, z.number().int().min(0).max(500)),
  attackMode: AttackModeSchema,
  equipment: z.record(SlotSchema, EquippedItemSchema),
  charmId: z.string().optional(),
  /** estágio de upgrade do charm (rework 2024): 1..3 */
  charmStage: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(3),
  targetCreatureId: z.string().optional(),
  selectedSpellIds: z.array(z.string()).default([]),
});

export type Build = z.infer<typeof BuildSchema>;
export type EquippedItem = z.infer<typeof EquippedItemSchema>;

export function emptyBuild(): Build {
  return {
    v: 1,
    vocation: 'knight',
    level: 8,
    skills: { magic: 0, fist: 10, club: 10, sword: 10, axe: 10, distance: 10, shielding: 10 },
    attackMode: 'offensive',
    equipment: {},
    charmStage: 3,
    selectedSpellIds: [],
  };
}
