import { z } from 'zod';

/**
 * Local de caça (Category:Hunting_Places da TibiaWiki). As criaturas vêm
 * dos templates {{CreatureList}} da página; levelHint/estrelas do
 * Infobox Hunt. Funcionalidade inspirada em tibiaroute.com/br/hunting-places.
 */
export const HuntingPlaceSchema = z.object({
  /** slug estável, ex.: "hero-cave" */
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  city: z.string().optional(),
  /** level recomendado pela wiki, por grupo de vocação */
  levelHint: z.object({
    knight: z.number().int().min(1).optional(),
    paladin: z.number().int().min(1).optional(),
    mage: z.number().int().min(1).optional(),
  }),
  /** avaliação da wiki (0–5 estrelas) */
  expStars: z.number().int().min(0).max(5).optional(),
  lootStars: z.number().int().min(0).max(5).optional(),
  /** ids de criaturas existentes em creatures.json */
  creatureIds: z.array(z.string()).min(1),
  /** URL da página da TibiaWiki de onde os dados foram extraídos */
  source: z.string().url(),
});

export type HuntingPlace = z.infer<typeof HuntingPlaceSchema>;
