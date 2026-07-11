/**
 * Valida data/seed/*.json contra os schemas Zod (Seção 6.2 do plano).
 * Roda no CI e em `pnpm validate:data`. Sai com código 1 em qualquer erro.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ZodTypeAny } from 'zod';
import {
  ItemsFileSchema,
  CreaturesFileSchema,
  SpellsFileSchema,
  ImbuementsFileSchema,
  CharmsFileSchema,
  HuntingPlacesFileSchema,
} from '../src/engine/schemas/dataset';

const seedDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'seed');

const files: Array<[string, ZodTypeAny]> = [
  ['items.json', ItemsFileSchema],
  ['creatures.json', CreaturesFileSchema],
  ['spells.json', SpellsFileSchema],
  ['imbuements.json', ImbuementsFileSchema],
  ['charms.json', CharmsFileSchema],
  ['hunting-places.json', HuntingPlacesFileSchema],
];

let failed = false;
const idSets = new Map<string, Set<string>>();

for (const [file, schema] of files) {
  const raw = JSON.parse(readFileSync(join(seedDir, file), 'utf8'));
  const result = schema.safeParse(raw);
  if (!result.success) {
    failed = true;
    console.error(`✗ ${file}`);
    for (const issue of result.error.issues.slice(0, 20)) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    continue;
  }
  // checagem de ids duplicados dentro do arquivo
  const key = Object.keys(result.data).find((k) => Array.isArray(result.data[k]))!;
  const records = result.data[key] as Array<{ id: string }>;
  const seen = new Set<string>();
  for (const r of records) {
    if (seen.has(r.id)) {
      failed = true;
      console.error(`✗ ${file}: id duplicado "${r.id}"`);
    }
    seen.add(r.id);
  }
  idSets.set(file, seen);
  console.log(`✓ ${file} (${records.length} registros)`);
}

// integridade referencial: criaturas dos locais de caça existem no dataset
const creatureIds = idSets.get('creatures.json');
if (creatureIds) {
  const hunts = JSON.parse(readFileSync(join(seedDir, 'hunting-places.json'), 'utf8'));
  for (const h of hunts.huntingPlaces as Array<{ id: string; creatureIds: string[] }>) {
    for (const cid of h.creatureIds) {
      if (!creatureIds.has(cid)) {
        failed = true;
        console.error(`✗ hunting-places.json: "${h.id}" referencia criatura inexistente "${cid}"`);
      }
    }
  }
}

if (failed) process.exit(1);
console.log('Todos os datasets são válidos.');
