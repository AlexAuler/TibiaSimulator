import type { Element } from './enums';

/**
 * Saída do engine (Seção 4 do PLANO-MVP). Tipos puros (não precisam de Zod:
 * são produzidos internamente, nunca lidos de fonte externa).
 */

export interface AutoAttackResult {
  /** min assumido = dano base por level (premissa documentada) */
  min: number;
  /** média = Attack Value da Cyclopedia (fórmula atual) */
  avg: number;
  /** max derivado de distribuição uniforme: 2*avg - min */
  max: number;
  dps: number;
  /** composição do hit médio por elemento (pós-imbuement, pré-alvo) */
  breakdownByElement: Partial<Record<Element, number>>;
  /** multiplicador esperado de crítico aplicado à média */
  critMultiplier: number;
}

export interface SpellResult {
  spellId: string;
  name: string;
  element: Element;
  min: number;
  avg: number;
  max: number;
  /** dano médio por segundo de cooldown */
  dmgPerCooldownSec: number;
  /** mana gasta por ponto de dano médio */
  manaPerDamage: number;
  /** dano médio contra o alvo (modificadores aplicados), se houver alvo */
  avgVsTarget?: number;
}

export interface OffenseResult {
  autoAttack: AutoAttackResult | null;
  /** motivo de não haver auto-attack (ex.: sem arma equipada) */
  autoAttackUnavailableReason?: string;
  perSpell: SpellResult[];
}

export interface DefenseResult {
  totalArmor: number;
  /** % consolidada de proteção por elemento (agregação multiplicativa) */
  resistances: Partial<Record<Element, number>>;
  charHp: number;
  charMana: number;
  /** Defense Value da Cyclopedia (informativo) */
  defenseValue: number;
}

export interface CreatureAttackDamage {
  attackName: string;
  element: Element;
  expectedDamage: number;
}

/** Resultado contra UM alvo; com local de caça há uma entrada por criatura. */
export interface VsTargetResult {
  creatureId: string;
  creatureName: string;
  creatureHp: number;
  /** DPS efetivo (auto-attack + charm) contra o alvo */
  effectiveDps: number | null;
  /** hits de auto-attack para matar */
  hitsToKill: number | null;
  timeToKillSec: number | null;
  /** dano médio do auto-attack contra o alvo */
  autoAttackAvgVsTarget: number | null;
  charmExpectedDps?: number;
  /** dano esperado do proc do charm (após teto e modificador do alvo) */
  charmExpectedDamagePerProc?: number;
  /** dano recebido esperado desta criatura */
  incomingPerAttack: CreatureAttackDamage[];
  avgIncomingPerTurn: number;
  hitsToDie: number | null;
}

export interface SimulationResult {
  offense: OffenseResult;
  defense: DefenseResult;
  /** um resultado por criatura-alvo selecionada */
  vsTargets: VsTargetResult[];
  /** premissas usadas neste cálculo — SEMPRE exibidas na UI */
  assumptions: string[];
}
