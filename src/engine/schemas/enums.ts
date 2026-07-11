import { z } from 'zod';

/**
 * Enums básicos do domínio (Seção 4 do PLANO-MVP).
 * Elementos seguem os tipos de dano que jogadores causam/recebem no MVP
 * (drown/lifedrain/manadrain ficam fora — jogadores não os causam).
 * fonte: https://tibia.fandom.com/wiki/Damage (acessado em 2026-07-10)
 */

export const VocationSchema = z.enum(['knight', 'paladin', 'sorcerer', 'druid', 'monk']);
export type Vocation = z.infer<typeof VocationSchema>;

export const ElementSchema = z.enum([
  'physical',
  'fire',
  'ice',
  'energy',
  'earth',
  'death',
  'holy',
]);
export type Element = z.infer<typeof ElementSchema>;

export const SkillKeySchema = z.enum([
  'magic',
  'fist',
  'club',
  'sword',
  'axe',
  'distance',
  'shielding',
]);
export type SkillKey = z.infer<typeof SkillKeySchema>;

export const SlotSchema = z.enum([
  'weapon',
  'offhand',
  'helmet',
  'armor',
  'legs',
  'boots',
  'amulet',
  'ring',
  'ammo',
]);
export type Slot = z.infer<typeof SlotSchema>;

export const WeaponTypeSchema = z.enum([
  'sword',
  'axe',
  'club',
  'fist',
  'distance',
  'wand',
  'rod',
  'none',
]);
export type WeaponType = z.infer<typeof WeaponTypeSchema>;

export const AttackModeSchema = z.enum(['offensive', 'balanced', 'defensive']);
export type AttackMode = z.infer<typeof AttackModeSchema>;

export const ImbuementTierSchema = z.enum(['basic', 'intricate', 'powerful']);
export type ImbuementTier = z.infer<typeof ImbuementTierSchema>;

export const ImbuementCategorySchema = z.enum([
  'elementalDamage',
  'critical',
  'leechHp',
  'leechMana',
  'skillBoost',
  'protection',
]);
export type ImbuementCategory = z.infer<typeof ImbuementCategorySchema>;

/** Mapeia tipo de arma -> skill usada no auto-attack. Wand/rod não usam skill. */
export const WEAPON_SKILL: Record<WeaponType, SkillKey | null> = {
  sword: 'sword',
  axe: 'axe',
  club: 'club',
  fist: 'fist',
  distance: 'distance',
  wand: null,
  rod: null,
  none: 'fist',
};
