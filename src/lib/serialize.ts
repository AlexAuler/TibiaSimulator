/**
 * Permalink: Build <-> query param `?b=` via JSON + lz-string (RF10).
 * Sem backend; o payload carrega `v` para versionamento do schema.
 */

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { BuildSchema, type Build } from '@/engine/schemas/build';

export const BUILD_PARAM = 'b';

export function encodeBuild(build: Build): string {
  return compressToEncodedURIComponent(JSON.stringify(build));
}

export function decodeBuild(encoded: string): Build | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = BuildSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function buildToUrl(build: Build, origin: string): string {
  return `${origin}/?${BUILD_PARAM}=${encodeBuild(build)}`;
}
