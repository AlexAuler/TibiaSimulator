import { describe, expect, it } from 'vitest';
import {
  totalArmor,
  expectedArmorReduction,
  aggregateResistances,
  defenseValue,
  computeDefense,
  expectedIncomingDamage,
} from '../defense';
import { armorReductionRange, HP_FORMULA, MANA_FORMULA } from '../constants';
import { resolveSheet } from '../character';
import { fixtureData, makeBuild } from './fixtures';

/**
 * GOLDEN TESTS — derivações a partir das fórmulas da TibiaWiki.
 * fonte: https://tibia.fandom.com/wiki/Formulae (acessado em 2026-07-10)
 */

describe('armor (Formulae#Armor_Reduction)', () => {
  // t=20: r = floor(20/2) = 10; R = 10*2-1 = 19; esperado = 14.5
  it('faixa e esperado para armor 20', () => {
    expect(armorReductionRange(20)).toEqual({ min: 10, max: 19 });
    expect(expectedArmorReduction(20)).toBeCloseTo(14.5, 6);
  });

  // t=9 (exemplo da wiki com Zaoan Helmet): r=4, R=7 => esperado 5.5
  it('exemplo da wiki: armor 9 => r=4, R=7', () => {
    expect(armorReductionRange(9)).toEqual({ min: 4, max: 7 });
  });

  it('armor 0/1 não reduz nada', () => {
    expect(expectedArmorReduction(0)).toBe(0);
    expect(expectedArmorReduction(1)).toBe(0); // floor(1/2)=0
  });
});

describe('resistências (Formulae#Percentage_Reduction — por item, multiplicativo)', () => {
  // Helmet fire 10% + Armor fire 5%: 1 - 0.90*0.95 = 0.145 => 14.5%
  it('duas fontes de fire agregam multiplicativamente', () => {
    const build = makeBuild({
      equipment: {
        helmet: { itemId: 'test-helmet', imbuementIds: [] },
        armor: { itemId: 'test-armor', imbuementIds: [] },
      },
    });
    const res = aggregateResistances(resolveSheet(build, fixtureData));
    expect(res.fire).toBeCloseTo(14.5, 6);
    expect(res.energy).toBeCloseTo(8, 6);
  });

  // + Powerful Dragon Hide (15% fire): 1 - 0.90*0.95*0.85 = 0.27325 => 27.325%
  it('imbuement de proteção entra como mais um fator', () => {
    const build = makeBuild({
      equipment: {
        helmet: { itemId: 'test-helmet', imbuementIds: [] },
        armor: { itemId: 'test-armor', imbuementIds: ['powerful-dragon-hide'] },
      },
    });
    const res = aggregateResistances(resolveSheet(build, fixtureData));
    expect(res.fire).toBeCloseTo(27.325, 3);
  });
});

describe('HP/Mana por vocação (Formulae#Hitpoints,_Mana,_and_Capacity)', () => {
  // Knight L=100: HP 5(3*100+13) = 1565; Mana 5(110) = 550
  it('knight level 100', () => {
    expect(HP_FORMULA.knight(100)).toBe(1565);
    expect(MANA_FORMULA.knight(100)).toBe(550);
  });
  // Paladin L=100: HP 5(221) = 1105; Mana 5(294) = 1470
  it('paladin level 100', () => {
    expect(HP_FORMULA.paladin(100)).toBe(1105);
    expect(MANA_FORMULA.paladin(100)).toBe(1470);
  });
  // Monk L=100: HP 5(221) = 1105; Mana 5(191) = 955
  it('monk level 100', () => {
    expect(HP_FORMULA.monk(100)).toBe(1105);
    expect(MANA_FORMULA.monk(100)).toBe(955);
  });
  // Sorcerer L=100: HP 5(129) = 645; Mana 5(570) = 2850
  it('sorcerer level 100', () => {
    expect(HP_FORMULA.sorcerer(100)).toBe(645);
    expect(MANA_FORMULA.sorcerer(100)).toBe(2850);
  });
});

describe('defense value (Formulae#Defense_Value)', () => {
  // Shield def 36, shielding 110, balanced: floor(36 * 120/40) = 108
  it('golden: escudo 36, shielding 110, balanced', () => {
    const build = makeBuild({
      attackMode: 'balanced',
      equipment: { offhand: { itemId: 'test-shield', imbuementIds: [] } },
    });
    expect(defenseValue(resolveSheet(build, fixtureData))).toBe(108);
  });

  // offensive: floor(ceil(0.7*36) * 120/40) = floor(26*3) = 78
  it('golden: escudo 36, shielding 110, offensive', () => {
    const build = makeBuild({
      attackMode: 'offensive',
      equipment: { offhand: { itemId: 'test-shield', imbuementIds: [] } },
    });
    expect(defenseValue(resolveSheet(build, fixtureData))).toBe(78);
  });

  // Sem escudo: usa defense da arma (30) e skill da arma (sword 120):
  // defensive: floor(floor(1.6*30) * 130/40) = floor(48*3.25) = 156
  it('sem escudo usa a defense da arma', () => {
    const build = makeBuild({
      attackMode: 'defensive',
      equipment: { weapon: { itemId: 'test-sword', imbuementIds: [] } },
    });
    expect(defenseValue(resolveSheet(build, fixtureData))).toBe(156);
  });
});

describe('dano recebido e hits para morrer', () => {
  // Build: helmet(9) + armor(16) => armor total 25; resist fire 14.5%.
  // Test Drake: melee físico 100-300 (avg 200) e fire wave 100-200 (avg 150).
  // físico: 200 - esperado(25) = 200 - ((12 + 23)/2) = 200 - 17.5 = 182.5
  // fire:   150 * (1 - 0.145) = 128.25
  // turno = 310.75; knight L=300 HP = 5(913) = 4565
  // hitsToDie = 4565 / 310.75 = 14.69...
  it('golden: knight 300 contra Test Drake', () => {
    const build = makeBuild({
      targetCreatureId: 'test-drake',
      equipment: {
        helmet: { itemId: 'test-helmet', imbuementIds: [] },
        armor: { itemId: 'test-armor', imbuementIds: [] },
      },
    });
    const sheet = resolveSheet(build, fixtureData);
    const d = computeDefense(sheet);
    expect(totalArmor(sheet)).toBe(25);
    expect(d.charHp).toBe(4565);
    const incoming = expectedIncomingDamage(sheet, sheet.targets[0]);
    const melee = incoming.find((a) => a.attackName === 'melee')!;
    const fire = incoming.find((a) => a.attackName === 'fire wave')!;
    expect(melee.expectedDamage).toBeCloseTo(182.5, 6);
    expect(fire.expectedDamage).toBeCloseTo(128.25, 6);
    const perTurn = incoming.reduce((s, a) => s + a.expectedDamage, 0);
    expect(perTurn).toBeCloseTo(310.75, 6);
    expect(d.charHp / perTurn).toBeCloseTo(4565 / 310.75, 4);
  });

  it('proteção 100% zera o dano do elemento (propriedade)', () => {
    // fixture não tem item 100%; validamos pela agregação: fator (1-1.0) = 0
    const sheet = resolveSheet(makeBuild({ targetCreatureId: 'test-drake' }), fixtureData);
    const withFull = {
      ...sheet,
      equipped: [
        {
          slot: 'armor' as const,
          item: {
            id: 'x',
            name: 'X',
            slots: ['armor' as const],
            vocations: [],
            minLevel: 0,
            attributes: { resistances: { fire: 100 } },
            source: 'https://tibia.fandom.com/wiki/Formulae',
          },
          imbuements: [],
        },
      ],
    };
    const res = aggregateResistances(withFull);
    expect(res.fire).toBeCloseTo(100, 6);
  });

  it('sem alvo => nenhum target resolvido na ficha', () => {
    const sheet = resolveSheet(makeBuild({}), fixtureData);
    expect(sheet.targets).toEqual([]);
  });
});
