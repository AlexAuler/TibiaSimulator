import { z } from 'zod';
import { ElementSchema } from './enums';

/**
 * Criatura-alvo (Seção 4 do PLANO-MVP).
 * `elementModifiers`: fração do dano recebido por elemento
 * (1.0 = neutro, 1.1 = fraco/+10%, 0 = imune) — campos *DmgMod do infobox
 * da TibiaWiki convertidos de % para fração.
 * `armor` e `mitigationPct` vêm do Bestiário quando disponíveis; quando
 * ausentes, o engine aplica 1.0 e registra em `assumptions`.
 */

export const CreatureAttackSchema = z.object({
  name: z.string().min(1),
  element: ElementSchema,
  min: z.number().min(0),
  max: z.number().min(0),
});

export const CreatureSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  hitpoints: z.number().int().min(1),
  elementModifiers: z.record(ElementSchema, z.number().min(0)),
  /** armor do Bestiário (reduz dano físico recebido pela criatura) */
  armor: z.number().int().min(0).optional(),
  /** mitigation do Bestiário, em % (reduz todo dano comum) */
  mitigationPct: z.number().min(0).max(100).optional(),
  attacks: z.array(CreatureAttackSchema),
  source: z.string().url(),
});

export type Creature = z.infer<typeof CreatureSchema>;
export type CreatureAttack = z.infer<typeof CreatureAttackSchema>;
