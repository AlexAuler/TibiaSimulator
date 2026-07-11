/**
 * Regras de consistência do store (UI):
 * - remoção de item equipado (unequip);
 * - regra de duas mãos do jogo: arma 2H não convive com offhand, EXCETO
 *   quiver com arma de distância (https://tibia.fandom.com/wiki/Quivers).
 *
 * Itens reais do dataset usados nos casos:
 *   giant-sword  (sword, 2 mãos) | jagged-sword (sword, 1 mão)
 *   bow          (distance, 2 mãos)
 *   wooden-shield (shield) | blue-quiver (quiver)
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { itemById } from '../data';
import { twoHandedConflict, useSimStore } from '../store';

const get = () => useSimStore.getState();

beforeEach(() => {
  get().reset();
});

describe('twoHandedConflict', () => {
  const item = (id: string) => itemById.get(id)!;

  it('arma de 1 mão nunca conflita', () => {
    expect(twoHandedConflict(item('jagged-sword'), item('wooden-shield'))).toBe(false);
  });

  it('arma melee de 2 mãos conflita com escudo, spellbook e quiver', () => {
    expect(twoHandedConflict(item('giant-sword'), item('wooden-shield'))).toBe(true);
    expect(twoHandedConflict(item('giant-sword'), item('spellbook-of-dark-mysteries'))).toBe(true);
    expect(twoHandedConflict(item('giant-sword'), item('blue-quiver'))).toBe(true);
  });

  it('arco (distance 2 mãos) aceita quiver, mas não escudo', () => {
    expect(twoHandedConflict(item('bow'), item('blue-quiver'))).toBe(false);
    expect(twoHandedConflict(item('bow'), item('wooden-shield'))).toBe(true);
  });
});

describe('equip/unequip', () => {
  it('unequip remove o item sem substituto', () => {
    get().equip('weapon', 'jagged-sword');
    expect(get().build.equipment.weapon?.itemId).toBe('jagged-sword');
    get().unequip('weapon');
    expect(get().build.equipment.weapon).toBeUndefined();
  });

  it('equipar arma 2H remove o escudo com aviso', () => {
    get().equip('offhand', 'wooden-shield');
    get().equip('weapon', 'giant-sword');
    expect(get().build.equipment.offhand).toBeUndefined();
    expect(get().build.equipment.weapon?.itemId).toBe('giant-sword');
    expect(get().removedByTwoHanded).toBe('Wooden Shield');
  });

  it('equipar arco mantém o quiver (exceção do jogo)', () => {
    get().equip('offhand', 'blue-quiver');
    get().equip('weapon', 'bow');
    expect(get().build.equipment.offhand?.itemId).toBe('blue-quiver');
    expect(get().build.equipment.weapon?.itemId).toBe('bow');
    expect(get().removedByTwoHanded).toBeNull();
  });

  it('equipar offhand em conflito remove a arma 2H (garantia de consistência)', () => {
    get().equip('weapon', 'giant-sword');
    get().equip('offhand', 'wooden-shield');
    expect(get().build.equipment.weapon).toBeUndefined();
    expect(get().build.equipment.offhand?.itemId).toBe('wooden-shield');
    expect(get().removedByTwoHanded).toBe('Giant Sword');
  });

  it('arma de 1 mão convive com escudo', () => {
    get().equip('weapon', 'jagged-sword');
    get().equip('offhand', 'wooden-shield');
    expect(get().build.equipment.weapon?.itemId).toBe('jagged-sword');
    expect(get().build.equipment.offhand?.itemId).toBe('wooden-shield');
    expect(get().removedByTwoHanded).toBeNull();
  });
});
