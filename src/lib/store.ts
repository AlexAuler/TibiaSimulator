'use client';

/**
 * Estado global da build (Zustand) + regras de consistência:
 * - trocar vocação remove itens/spells incompatíveis com aviso (RF1);
 * - equipar item incompatível com slot é impossível pela UI (RF3);
 * - imbuements respeitam count/categorias do item (RF4) — validado na UI;
 * - arma de duas mãos não convive com offhand, exceto quiver com arma de
 *   distância (regra do jogo — https://tibia.fandom.com/wiki/Quivers).
 */

import { create } from 'zustand';
import { emptyBuild, migrateBuild, type Build } from '@/engine/schemas/build';
import type { AttackMode, SkillKey, Slot, Vocation } from '@/engine/schemas/enums';
import type { CharmStage } from '@/engine/schemas/charm';
import type { Item } from '@/engine/schemas/item';
import { huntingPlaceById, itemById, itemFitsVocation, spellById } from './data';

/** true se a arma (2 mãos) não pode conviver com este item de offhand. */
export function twoHandedConflict(weapon: Item | undefined, offhand: Item | undefined): boolean {
  if (!weapon || !offhand || weapon.hands !== 2) return false;
  return !(weapon.weaponType === 'distance' && offhand.offhandKind === 'quiver');
}

interface SimStore {
  build: Build;
  /** nomes de itens removidos na última troca de vocação (aviso RF1) */
  removedByVocation: string[];
  /** nome do item removido pela regra de duas mãos (aviso no equipamento) */
  removedByTwoHanded: string | null;
  setVocation: (v: Vocation) => void;
  setLevel: (level: number) => void;
  setSkill: (skill: SkillKey, value: number) => void;
  setAttackMode: (mode: AttackMode) => void;
  equip: (slot: Slot, itemId: string) => void;
  unequip: (slot: Slot) => void;
  setImbuements: (slot: Slot, imbuementIds: string[]) => void;
  setCharm: (charmId?: string) => void;
  setCharmStage: (stage: CharmStage) => void;
  /** adiciona/remove uma criatura-alvo (seleção manual) */
  toggleTarget: (creatureId: string) => void;
  /** seleciona todas as criaturas de um local de caça */
  setHuntingPlace: (placeId?: string) => void;
  clearTargets: () => void;
  toggleSpell: (spellId: string) => void;
  reset: () => void;
  load: (build: Build) => void;
  dismissRemovedNotice: () => void;
  dismissTwoHandedNotice: () => void;
}

export const useSimStore = create<SimStore>((set) => ({
  build: emptyBuild(),
  removedByVocation: [],
  removedByTwoHanded: null,

  setVocation: (vocation) =>
    set((state) => {
      const removed: string[] = [];
      const equipment: Build['equipment'] = {};
      for (const [slot, eq] of Object.entries(state.build.equipment)) {
        if (!eq) continue;
        const item = itemById.get(eq.itemId);
        if (item && itemFitsVocation(item, vocation) && item.minLevel <= state.build.level) {
          equipment[slot as Slot] = eq;
        } else if (item) {
          removed.push(item.name);
        }
      }
      const selectedSpellIds = state.build.selectedSpellIds.filter((id) => {
        const spell = spellById.get(id);
        return spell ? spell.vocations.includes(vocation) : false;
      });
      return {
        build: { ...state.build, vocation, equipment, selectedSpellIds },
        removedByVocation: removed,
      };
    }),

  setLevel: (level) =>
    set((state) => ({ build: { ...state.build, level: clampInt(level, 1, 3000) } })),

  setSkill: (skill, value) =>
    set((state) => ({
      build: {
        ...state.build,
        skills: { ...state.build.skills, [skill]: clampInt(value, 0, 500) },
      },
    })),

  setAttackMode: (attackMode) => set((state) => ({ build: { ...state.build, attackMode } })),

  equip: (slot, itemId) =>
    set((state) => {
      const equipment: Build['equipment'] = {
        ...state.build.equipment,
        [slot]: { itemId, imbuementIds: [] },
      };
      let removedByTwoHanded: string | null = null;

      // Regra de duas mãos: equipar arma 2H remove o offhand incompatível
      // (a UI bloqueia o caminho inverso; aqui é a garantia de consistência).
      const weapon = equipment.weapon ? itemById.get(equipment.weapon.itemId) : undefined;
      const offhand = equipment.offhand ? itemById.get(equipment.offhand.itemId) : undefined;
      if (twoHandedConflict(weapon, offhand)) {
        removedByTwoHanded = slot === 'offhand' ? (weapon?.name ?? null) : (offhand?.name ?? null);
        delete equipment[slot === 'offhand' ? 'weapon' : 'offhand'];
      }

      return { build: { ...state.build, equipment }, removedByTwoHanded };
    }),

  unequip: (slot) =>
    set((state) => {
      const equipment = { ...state.build.equipment };
      delete equipment[slot];
      return { build: { ...state.build, equipment } };
    }),

  setImbuements: (slot, imbuementIds) =>
    set((state) => {
      const eq = state.build.equipment[slot];
      if (!eq) return state;
      return {
        build: {
          ...state.build,
          equipment: { ...state.build.equipment, [slot]: { ...eq, imbuementIds } },
        },
      };
    }),

  setCharm: (charmId) => set((state) => ({ build: { ...state.build, charmId } })),
  setCharmStage: (charmStage) => set((state) => ({ build: { ...state.build, charmStage } })),
  toggleTarget: (creatureId) =>
    set((state) => {
      const has = state.build.targetCreatureIds.includes(creatureId);
      const targetCreatureIds = has
        ? state.build.targetCreatureIds.filter((id) => id !== creatureId)
        : [...state.build.targetCreatureIds, creatureId];
      // seleção manual invalida o rótulo do local quando esvazia a lista
      const huntingPlaceId =
        targetCreatureIds.length === 0 ? undefined : state.build.huntingPlaceId;
      return { build: { ...state.build, targetCreatureIds, huntingPlaceId } };
    }),

  setHuntingPlace: (placeId) =>
    set((state) => {
      if (!placeId) {
        return { build: { ...state.build, huntingPlaceId: undefined } };
      }
      const place = huntingPlaceById.get(placeId);
      if (!place) return state;
      return {
        build: { ...state.build, huntingPlaceId: placeId, targetCreatureIds: place.creatureIds },
      };
    }),

  clearTargets: () =>
    set((state) => ({
      build: { ...state.build, targetCreatureIds: [], huntingPlaceId: undefined },
    })),

  toggleSpell: (spellId) =>
    set((state) => {
      const has = state.build.selectedSpellIds.includes(spellId);
      return {
        build: {
          ...state.build,
          selectedSpellIds: has
            ? state.build.selectedSpellIds.filter((id) => id !== spellId)
            : [...state.build.selectedSpellIds, spellId],
        },
      };
    }),

  reset: () => set({ build: emptyBuild(), removedByVocation: [], removedByTwoHanded: null }),
  load: (build) =>
    set({ build: migrateBuild(build), removedByVocation: [], removedByTwoHanded: null }),
  dismissRemovedNotice: () => set({ removedByVocation: [] }),
  dismissTwoHandedNotice: () => set({ removedByTwoHanded: null }),
}));

function clampInt(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  return Math.max(min, Math.min(max, Math.round(v)));
}
