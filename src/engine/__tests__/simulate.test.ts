import { describe, expect, it } from 'vitest';
import { simulate } from '../simulate';
import { ASSUMPTION } from '../assumptions';
import { fixtureData, makeBuild } from './fixtures';

/**
 * Simulação completa Build -> SimulationResult (Seção 5 do plano).
 * Derivações nos comentários; base: knight L=300, sword atk 50, skill 120,
 * offensive => auto-attack avg (com crit intrínseco) = 325 * 1.005 = 326.625.
 */

describe('simulate vs alvo', () => {
  const baseEquip = { weapon: { itemId: 'test-sword', imbuementIds: [] as string[] } };

  // Test Drake: physical 0.9, armor 20 (esperado 14.5), mitigation 5%.
  // 326.625*0.9 = 293.9625; -14.5 = 279.4625; *0.95 = 265.489375
  // dps = /2 = 132.7446875; hitsToKill = 5000/265.489375 = 18.833...
  it('golden: modificador físico + armor + mitigation da criatura', () => {
    const r = simulate(
      makeBuild({ equipment: baseEquip, targetCreatureId: 'test-drake' }),
      fixtureData,
    );
    expect(r.vsTargets).toHaveLength(1);
    expect(r.vsTargets[0]!.autoAttackAvgVsTarget).toBeCloseTo(265.489375, 4);
    expect(r.vsTargets[0]!.effectiveDps).toBeCloseTo(132.7446875, 4);
    expect(r.vsTargets[0]!.hitsToKill).toBeCloseTo(5000 / 265.489375, 4);
    expect(r.assumptions).toContain(ASSUMPTION.creatureMitigationApplied);
  });

  // Powerful Scorch: 50% para fire; drake é IMUNE a fire (mod 0) =>
  // phys 163.3125*0.9 - 14.5 = 132.48125; fire zera; *0.95 = 125.8571875
  it('imunidade zera o componente elemental (propriedade da Seção 10)', () => {
    const r = simulate(
      makeBuild({
        equipment: { weapon: { itemId: 'test-sword', imbuementIds: ['powerful-scorch'] } },
        targetCreatureId: 'test-drake',
      }),
      fixtureData,
    );
    expect(r.vsTargets[0]!.autoAttackAvgVsTarget).toBeCloseTo(125.8571875, 4);
  });

  // Alvo neutro sem armor/mitigation: dano igual ao painel ofensivo.
  it('alvo neutro não altera o dano', () => {
    const r = simulate(
      makeBuild({ equipment: baseEquip, targetCreatureId: 'test-dummy' }),
      fixtureData,
    );
    expect(r.vsTargets[0]!.autoAttackAvgVsTarget).toBeCloseTo(326.625, 4);
    expect(r.assumptions).toContain(ASSUMPTION.creatureArmorMissing);
  });

  // Wound estágio 3: chance 11%; raw = min(5% de 5000, 2*300) = 250
  // 250*0.9*0.95 = 213.75; dps = 0.11*213.75/2 = 11.75625
  // effectiveDps = 132.7446875 + 11.75625 = 144.5009375
  it('golden: charm Wound contra o alvo', () => {
    const r = simulate(
      makeBuild({
        equipment: baseEquip,
        targetCreatureId: 'test-drake',
        charmId: 'wound',
        charmStage: 3,
      }),
      fixtureData,
    );
    expect(r.vsTargets[0]!.charmExpectedDamagePerProc).toBeCloseTo(213.75, 4);
    expect(r.vsTargets[0]!.charmExpectedDps).toBeCloseTo(11.75625, 4);
    expect(r.vsTargets[0]!.effectiveDps).toBeCloseTo(144.5009375, 4);
    expect(r.vsTargets[0]!.timeToKillSec).toBeCloseTo(5000 / 144.5009375, 3);
  });

  // Wound com cap: level 40 => teto 80 < 250: raw = 80 => 80*0.9*0.95 = 68.4
  it('teto do charm em 2x o level (aplicado antes das resistências)', () => {
    const r = simulate(
      makeBuild({
        level: 40,
        equipment: baseEquip,
        targetCreatureId: 'test-drake',
        charmId: 'wound',
        charmStage: 3,
      }),
      fixtureData,
    );
    expect(r.vsTargets[0]!.charmExpectedDamagePerProc).toBeCloseTo(68.4, 4);
  });

  // Overpower: 5% do HP próprio (knight 300: HP=4565 => 228.25), cap 8% de
  // 5000 = 400 => 228.25; *0.9*0.95 = 195.15375; dps = 0.11*.../2
  it('golden: charm Overpower usa HP próprio com teto no HP da criatura', () => {
    const r = simulate(
      makeBuild({
        equipment: baseEquip,
        targetCreatureId: 'test-drake',
        charmId: 'overpower',
        charmStage: 3,
      }),
      fixtureData,
    );
    expect(r.vsTargets[0]!.charmExpectedDamagePerProc).toBeCloseTo(195.15375, 4);
    expect(r.vsTargets[0]!.charmExpectedDps).toBeCloseTo((0.11 * 195.15375) / 2, 4);
  });

  // Low Blow (estágio 3: +9% chance) muda o crit apenas contra o alvo:
  // mult = 1 + 0.14*0.10 = 1.014 => avg 325*1.014 = 329.55
  // vs drake: 329.55*0.9 - 14.5 = 282.095; *0.95 = 267.99025
  it('charm de crit aumenta o dano contra o alvo, não o painel neutro', () => {
    const r = simulate(
      makeBuild({
        equipment: baseEquip,
        targetCreatureId: 'test-drake',
        charmId: 'low-blow',
        charmStage: 3,
      }),
      fixtureData,
    );
    expect(r.offense.autoAttack!.avg).toBeCloseTo(326.625, 4); // painel neutro
    expect(r.vsTargets[0]!.autoAttackAvgVsTarget).toBeCloseTo(267.99025, 4);
    expect(r.vsTargets[0]!.charmExpectedDps).toBeUndefined();
  });

  // Spell física contra o alvo: Fierce Berserk avg 511 (golden do offense):
  // 511*0.9 = 459.9; -14.5 = 445.4; *0.95 = 423.13
  it('spell física sofre armor e mitigation da criatura', () => {
    const r = simulate(
      makeBuild({
        equipment: baseEquip,
        targetCreatureId: 'test-drake',
        selectedSpellIds: ['fierce-berserk'],
      }),
      fixtureData,
    );
    const fb = r.offense.perSpell.find((s) => s.spellId === 'fierce-berserk')!;
    expect(fb.avg).toBeCloseTo(511, 4);
    expect(fb.avgVsTarget).toBeCloseTo(423.13, 4);
  });

  it('spell mágica ignora armor mas sofre modificador e mitigation', () => {
    // Energy Strike sorcerer L=100 ML=60: avg 138.68 (golden do offense)
    // vs drake: energy mod 1.0; sem armor (mágico); *0.95 = 131.746
    const r = simulate(
      makeBuild({
        vocation: 'sorcerer',
        level: 100,
        skills: { ...makeBuild({}).skills, magic: 60 },
        targetCreatureId: 'test-drake',
        selectedSpellIds: ['energy-strike'],
      }),
      fixtureData,
    );
    const es = r.offense.perSpell[0]!;
    expect(es.avgVsTarget).toBeCloseTo(138.68 * 0.95, 3);
  });
});

describe('multi-alvo (locais de caça)', () => {
  const baseEquip = { weapon: { itemId: 'test-sword', imbuementIds: [] as string[] } };

  it('produz um VsTargetResult por criatura, com valores independentes', () => {
    const r = simulate(
      makeBuild({ equipment: baseEquip, targetCreatureIds: ['test-drake', 'test-dummy'] }),
      fixtureData,
    );
    expect(r.vsTargets).toHaveLength(2);
    const drake = r.vsTargets.find((v) => v.creatureId === 'test-drake')!;
    const dummy = r.vsTargets.find((v) => v.creatureId === 'test-dummy')!;
    // mesmos goldens dos testes single-target
    expect(drake.autoAttackAvgVsTarget).toBeCloseTo(265.489375, 4);
    expect(dummy.autoAttackAvgVsTarget).toBeCloseTo(326.625, 4);
    // dano recebido: drake ataca (melee+fire wave), dummy não tem ataques
    expect(drake.avgIncomingPerTurn).toBeGreaterThan(0);
    expect(dummy.incomingPerAttack).toEqual([]);
    expect(dummy.hitsToDie).toBeNull();
  });

  it('permalink legado (targetCreatureId) é migrado para a lista', () => {
    const r = simulate(
      makeBuild({ equipment: baseEquip, targetCreatureId: 'test-drake' }),
      fixtureData,
    );
    expect(r.vsTargets).toHaveLength(1);
    expect(r.vsTargets[0]!.creatureId).toBe('test-drake');
  });
});

describe('estados incompletos (RF11)', () => {
  it('build vazia ainda produz resultado com defesa e assumptions', () => {
    const r = simulate(makeBuild({}), fixtureData);
    expect(r.offense.autoAttack).toBeNull();
    expect(r.offense.autoAttackUnavailableReason).toBe('no-weapon');
    expect(r.vsTargets).toEqual([]);
    expect(r.defense.charHp).toBeGreaterThan(0);
    expect(r.assumptions.length).toBeGreaterThan(0);
  });

  it('monk adiciona aviso de suporte parcial', () => {
    const r = simulate(makeBuild({ vocation: 'monk' }), fixtureData);
    expect(r.assumptions).toContain(ASSUMPTION.monkPartial);
  });
});
