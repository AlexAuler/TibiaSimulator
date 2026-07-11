import { z } from 'zod';
import { ItemSchema } from './item';
import { CreatureSchema } from './creature';
import { SpellSchema } from './spell';
import { ImbuementSchema } from './imbuement';
import { OffensiveCharmSchema } from './charm';
import { HuntingPlaceSchema } from './hunting-place';

/**
 * Envelopes dos datasets em data/seed/*.json (Seção 6 do PLANO-MVP).
 * Todo dataset carrega dataVersion (update do jogo) e generatedAt.
 */

const meta = {
  dataVersion: z.string(),
  generatedAt: z.string(),
};

export const ItemsFileSchema = z.object({ ...meta, items: z.array(ItemSchema) });
export const CreaturesFileSchema = z.object({ ...meta, creatures: z.array(CreatureSchema) });
export const SpellsFileSchema = z.object({ ...meta, spells: z.array(SpellSchema) });
export const ImbuementsFileSchema = z.object({ ...meta, imbuements: z.array(ImbuementSchema) });
export const CharmsFileSchema = z.object({ ...meta, charms: z.array(OffensiveCharmSchema) });
export const HuntingPlacesFileSchema = z.object({
  ...meta,
  huntingPlaces: z.array(HuntingPlaceSchema),
});

export type ItemsFile = z.infer<typeof ItemsFileSchema>;
export type CreaturesFile = z.infer<typeof CreaturesFileSchema>;
export type SpellsFile = z.infer<typeof SpellsFileSchema>;
export type ImbuementsFile = z.infer<typeof ImbuementsFileSchema>;
export type CharmsFile = z.infer<typeof CharmsFileSchema>;
export type HuntingPlacesFile = z.infer<typeof HuntingPlacesFileSchema>;

/** Conjunto completo de dados que o engine consome. */
export interface Datasets {
  items: ItemsFile;
  creatures: CreaturesFile;
  spells: SpellsFile;
  imbuements: ImbuementsFile;
  charms: CharmsFile;
  huntingPlaces: HuntingPlacesFile;
}
