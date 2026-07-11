import { describe, expect, it } from 'vitest';
import {
  baseDamage,
  attackValue,
  computeAutoAttack,
  computeSpell,
  collectCrit,
  expectedCritMultiplier,
} from '../offense';
import { resolveSheet } from '../character';
import { fixtureData, makeBuild } from './fixtures';

/**
 * GOLDEN TESTS — derivações a partir das fórmulas da TibiaWiki.
 * fonte: https://tibia.fandom.com/wiki/Formulae (acessado em 2026-07-10)
 */

describe('baseDamage (Formulae#Base_Damage_and_Healing)', () => {
  // L=8:  S = floor((sqrt(2*8+2025)+5)/10) = floor((45.177+5)/10) = 5
  //       B = floor(1008/5) + 50*5 - 450 = 201 + 250 - 450 = 1
  it('level 8 => 1', () => expect(baseDamage(8)).toBe(1));

  // L=100: S = floor((sqrt(2225)+5)/10) = floor(5.217) = 5
  //        B = floor(1100/5) + 250 - 450 = 220 - 200 = 20  (= level/5, regra até 500)
  it('level 100 => 20', () => expect(baseDamage(100)).toBe(20));

  // L=500: S = floor((sqrt(3025)+5)/10) = floor(6.0) = 6
  //        B = floor(1500/6) + 300 - 450 = 250 + 300 - 450 = 100
  it('level 500 => 100 (fronteira do passo)', () => expect(baseDamage(500)).toBe(100));

  // L=600: S = floor((sqrt(3225)+5)/10) = floor(6.178) = 6
  //        B = floor(1600/6) + 300 - 450 = 266 + 300 - 450 = 116
  it('level 600 => 116 (+1 a cada 6 levels após 500)', () => expect(baseDamage(600)).toBe(116));

  // L=1000: S = floor((sqrt(4025)+5)/10) = floor(6.844) = 6
  //         B = floor(2000/6) + 300 - 450 = 333 + 300 - 450 = 183
  it('level 1000 => 183', () => expect(baseDamage(1000)).toBe(183));
});

describe('attackValue (Formulae#Attack_Value)', () => {
  // L=8 (B=1), W=12, S=10:
  // offensive: 1 + floor(floor(1.2*12) * 14/28) = 1 + floor(14*0.5) = 1 + 7 = 8
  it('offensive: level 8, atk 12, skill 10 => 8', () =>
    expect(attackValue(8, 12, 10, 'offensive')).toBe(8));

  // balanced: 1 + floor(12 * 14/28) = 1 + 6 = 7
  it('balanced: level 8, atk 12, skill 10 => 7', () =>
    expect(attackValue(8, 12, 10, 'balanced')).toBe(7));

  // defensive: 1 + floor(ceil(0.6*12) * 14/28) = 1 + floor(8*0.5) = 1 + 4 = 5
  it('defensive: level 8, atk 12, skill 10 => 5', () =>
    expect(attackValue(8, 12, 10, 'defensive')).toBe(5));

  // L=300 (B=60), W=50, S=120, offensive:
  // floor(1.2*50)=60; floor(60*124/28) = floor(265.71) = 265; AV = 325
  it('offensive: level 300, atk 50, skill 120 => 325', () =>
    expect(attackValue(300, 50, 120, 'offensive')).toBe(325));
});

describe('auto-attack (melee)', () => {
  // Knight L=300, Test Sword (atk 50), sword 120, offensive.
  // B=60; AV=325 (derivação acima); min=B=60; max=2*325-60=590.
  // Crit intrínseco: 1 + 0.05*0.10 = 1.005 -> avg = 325*1.005 = 326.625; dps = avg/2.
  it('golden: knight 300 com sword atk 50', () => {
    const build = makeBuild({
      equipment: { weapon: { itemId: 'test-sword', imbuementIds: [] } },
    });
    const { result } = computeAutoAttack(resolveSheet(build, fixtureData), false);
    expect(result).not.toBeNull();
    expect(result!.min).toBe(60);
    expect(result!.max).toBe(590);
    expect(result!.avg).toBeCloseTo(326.625, 3);
    expect(result!.dps).toBeCloseTo(163.3125, 3);
    expect(result!.breakdownByElement.physical).toBeCloseTo(326.625, 3);
  });

  // Test Armor dá +3 de sword => skill efetiva 123:
  // floor(60*127/28) = floor(272.14) = 272; AV = 332
  it('skill bonus de item entra na skill efetiva', () => {
    const build = makeBuild({
      equipment: {
        weapon: { itemId: 'test-sword', imbuementIds: [] },
        armor: { itemId: 'test-armor', imbuementIds: [] },
      },
    });
    const { result } = computeAutoAttack(resolveSheet(build, fixtureData), false);
    // avg sem crit = 332; com crit 332*1.005 = 333.66
    expect(result!.avg).toBeCloseTo(332 * 1.005, 3);
  });

  // Powerful Scorch converte 50% da parte física para fire
  // (Imbuing: "Part of Physical Damage is converted to Fire Damage", 50% powerful).
  it('conversão elemental de imbuement divide o breakdown', () => {
    const build = makeBuild({
      equipment: { weapon: { itemId: 'test-sword', imbuementIds: ['powerful-scorch'] } },
    });
    const { result } = computeAutoAttack(resolveSheet(build, fixtureData), false);
    const total = result!.avg;
    expect(result!.breakdownByElement.physical).toBeCloseTo(total / 2, 6);
    expect(result!.breakdownByElement.fire).toBeCloseTo(total / 2, 6);
  });

  // Arma com attack elemental nativo: W = 48+55 = 103; shares 48/103 e 55/103.
  it('arma com dano elemental nativo mantém proporção física/elemental', () => {
    const build = makeBuild({
      equipment: { weapon: { itemId: 'test-death-axe', imbuementIds: [] } },
    });
    const { result } = computeAutoAttack(resolveSheet(build, fixtureData), false);
    const total = result!.avg;
    expect(result!.breakdownByElement.physical! / total).toBeCloseTo(48 / 103, 6);
    expect(result!.breakdownByElement.death! / total).toBeCloseTo(55 / 103, 6);
  });

  it('sem arma => indisponível com motivo', () => {
    const { result, unavailableReason } = computeAutoAttack(
      resolveSheet(makeBuild({}), fixtureData),
      false,
    );
    expect(result).toBeNull();
    expect(unavailableReason).toBe('no-weapon');
  });

  it('bow de duas mãos sem munição => indisponível', () => {
    const build = makeBuild({
      vocation: 'paladin',
      equipment: { weapon: { itemId: 'test-bow', imbuementIds: [] } },
    });
    const { unavailableReason } = computeAutoAttack(resolveSheet(build, fixtureData), false);
    expect(unavailableReason).toBe('no-ammo');
  });

  // Paladin L=250 (B=50), bow atk 8 + arrow atk 42 => W=50; distance 120.
  // offensive: floor(1.2*50)=60; floor(60*124/28)=265; AV=315.
  it('golden: distance soma attack da arma e da munição', () => {
    const build = makeBuild({
      vocation: 'paladin',
      level: 250,
      equipment: {
        weapon: { itemId: 'test-bow', imbuementIds: [] },
        ammo: { itemId: 'test-arrow', imbuementIds: [] },
      },
    });
    const { result } = computeAutoAttack(resolveSheet(build, fixtureData), false);
    expect(result!.min).toBe(50);
    expect(result!.avg).toBeCloseTo(315 * 1.005, 3);
  });

  // Wand: faixa fixa 56-74 => avg base 65 * 1.005 = 65.325; dps = /2.
  it('golden: wand usa faixa fixa do item', () => {
    const build = makeBuild({
      vocation: 'sorcerer',
      equipment: { weapon: { itemId: 'test-wand', imbuementIds: [] } },
    });
    const { result } = computeAutoAttack(resolveSheet(build, fixtureData), false);
    expect(result!.min).toBe(56);
    expect(result!.max).toBe(74);
    expect(result!.avg).toBeCloseTo(65 * 1.005, 3);
    expect(result!.breakdownByElement.energy).toBeCloseTo(65 * 1.005, 3);
  });
});

describe('crit esperado', () => {
  // Base (Summer Update 2025): 5% chance, +10% dano.
  it('intrínseco: 5% / 10% => multiplicador 1.005', () => {
    const sheet = resolveSheet(makeBuild({}), fixtureData);
    const crit = collectCrit(sheet, false);
    expect(crit.chancePct).toBe(5);
    expect(crit.extraDmgPct).toBe(10);
    expect(expectedCritMultiplier(crit)).toBeCloseTo(1.005, 6);
  });

  // + Powerful Strike (+5% chance, +40% dano) + Test Crit Legs (+10%/+5%)
  // chance = 5+5+10 = 20; extra = 10+40+5 = 55 => mult = 1 + 0.2*0.55 = 1.11
  it('imbuement + item somam aditivamente', () => {
    const build = makeBuild({
      equipment: {
        weapon: { itemId: 'test-sword', imbuementIds: ['powerful-strike'] },
        legs: { itemId: 'test-crit-legs', imbuementIds: [] },
      },
    });
    const crit = collectCrit(resolveSheet(build, fixtureData), false);
    expect(crit.chancePct).toBe(20);
    expect(crit.extraDmgPct).toBe(55);
    expect(expectedCritMultiplier(crit)).toBeCloseTo(1.11, 6);
  });

  // Low Blow estágio 3 (+9% chance) só entra quando includeCharm=true.
  it('charm de crítico só conta contra o alvo', () => {
    const build = makeBuild({ charmId: 'low-blow', charmStage: 3 });
    const sheet = resolveSheet(build, fixtureData);
    expect(collectCrit(sheet, false).chancePct).toBe(5);
    expect(collectCrit(sheet, true).chancePct).toBe(14);
  });
});

describe('spells (Formulae#Spell/Rune_Damage/Healing)', () => {
  // Energy Strike, L=100, effML=60:
  // levelTerm = floor(0.2*100) = 20
  // min = 20 + 1.403*60 + 8  = 112.18
  // max = 20 + 2.203*60 + 13 = 165.18 ; avg = 138.68
  it('golden: Energy Strike level 100, ML 60', () => {
    const build = makeBuild({
      vocation: 'sorcerer',
      level: 100,
      skills: { ...makeBuild({}).skills, magic: 60 },
    });
    const sheet = resolveSheet(build, fixtureData);
    const spell = fixtureData.spells.spells.find((s) => s.id === 'energy-strike')!;
    const r = computeSpell(sheet, spell);
    expect(r.min).toBeCloseTo(112.18, 2);
    expect(r.max).toBeCloseTo(165.18, 2);
    expect(r.avg).toBeCloseTo(138.68, 2);
    // dmg por segundo de cooldown = avg / 2s; mana/dano = 20 / avg
    expect(r.dmgPerCooldownSec).toBeCloseTo(69.34, 2);
    expect(r.manaPerDamage).toBeCloseTo(20 / 138.68, 4);
  });

  // Fierce Berserk, L=300, sword 120, atk 50:
  // term = 120 + 2*50 = 220; lvl/5 = 60
  // min = 1.1*220 + 60 = 302; max = 3*220 + 60 = 720; avg = 511
  it('golden: Fierce Berserk level 300, skill 120, atk 50', () => {
    const build = makeBuild({
      selectedSpellIds: ['fierce-berserk'],
      equipment: { weapon: { itemId: 'test-sword', imbuementIds: [] } },
    });
    const sheet = resolveSheet(build, fixtureData);
    const spell = fixtureData.spells.spells.find((s) => s.id === 'fierce-berserk')!;
    const r = computeSpell(sheet, spell);
    expect(r.min).toBeCloseTo(302, 6);
    expect(r.max).toBeCloseTo(720, 6);
    expect(r.avg).toBeCloseTo(511, 6);
  });

  // Ethereal Spear, L=250, distance 120 (ignora attack da arma):
  // term = 120 + 25 = 145; lvl/5 = 50
  // min = 145/3 + 50 = 98.33; max = 145 + 50 = 195
  it('golden: Ethereal Spear level 250, distance 120', () => {
    const build = makeBuild({ vocation: 'paladin', level: 250 });
    const sheet = resolveSheet(build, fixtureData);
    const spell = fixtureData.spells.spells.find((s) => s.id === 'ethereal-spear')!;
    const r = computeSpell(sheet, spell);
    expect(r.min).toBeCloseTo(145 / 3 + 50, 2);
    expect(r.max).toBeCloseTo(195, 6);
  });
});

describe('propriedades (monotonicidade)', () => {
  it('skill maior nunca reduz o attack value', () => {
    for (let s = 10; s <= 150; s += 5) {
      expect(attackValue(300, 50, s + 5, 'offensive')).toBeGreaterThanOrEqual(
        attackValue(300, 50, s, 'offensive'),
      );
    }
  });

  it('level maior nunca reduz o dano base', () => {
    for (let l = 8; l <= 2000; l += 37) {
      expect(baseDamage(l + 37)).toBeGreaterThanOrEqual(baseDamage(l));
    }
  });

  it('attack maior nunca reduz o attack value (todos os modos)', () => {
    for (const mode of ['offensive', 'balanced', 'defensive'] as const) {
      for (let w = 10; w <= 100; w += 10) {
        expect(attackValue(300, w + 10, 120, mode)).toBeGreaterThanOrEqual(
          attackValue(300, w, 120, mode),
        );
      }
    }
  });

  it('offensive >= balanced >= defensive', () => {
    for (let w = 10; w <= 100; w += 15) {
      const off = attackValue(200, w, 100, 'offensive');
      const bal = attackValue(200, w, 100, 'balanced');
      const def = attackValue(200, w, 100, 'defensive');
      expect(off).toBeGreaterThanOrEqual(bal);
      expect(bal).toBeGreaterThanOrEqual(def);
    }
  });
});
