/** Helpers de formatação numérica (pt-BR) para a UI. */

const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export const fmt0 = (n: number) => nf0.format(n);
export const fmt1 = (n: number) => nf1.format(n);

export const fmtPct = (n: number) => `${nf1.format(n)}%`;

export function fmtSeconds(sec: number): string {
  if (sec < 90) return `${nf1.format(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s}s`;
}

/** Cores por elemento — as mesmas do cliente do jogo, documentadas na wiki.
 *  fonte: https://tibia.fandom.com/wiki/Damage (Damage Colors) */
export const ELEMENT_COLOR: Record<string, string> = {
  physical: '#c94a4a',
  earth: '#52D017',
  fire: '#FF6600',
  energy: '#CC33FF',
  ice: '#85c8f2',
  death: '#a83250',
  holy: '#e8d25a',
};
