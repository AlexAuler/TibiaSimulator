'use client';

/**
 * Estado global da build (Zustand) + regras de consistência:
 * - trocar vocação remove itens/spells incompatíveis com aviso (RF1);
 * - equipar item incompatível com slot é impossível pela UI (RF3);
 * - imbuements respeitam count/categorias do item (RF4) — validado na UI.
 */

import { create } from 'zustand';
import { emptyBuild, type Build } from '@/engine/schemas/build';
import type { AttackMode, SkillKey, Slot, Vocation } from '@/engine/schemas/enums';
import type { CharmStage } from '@/engine/schemas/charm';
import { itemById, itemFitsVocation, spellById } from './data';

interface SimStore {
  build: Build;
  /** nomes de itens removidos na última troca de vocação (aviso RF1) */
  removedByVocation: string[];
  setVocation: (v: Vocation) => void;
  setLevel: (level: number) => void;
  setSkill: (skill: SkillKey, value: number) => void;
  setAttackMode: (mode: AttackMode) => void;
  equip: (slot: Slot, itemId: string) => void;
  unequip: (slot: Slot) => void;
  setImbuements: (slot: Slot, imbuementIds: string[]) => void;
  setCharm: (charmId?: string) => void;
  setCharmStage: (stage: CharmStage) => void;
  setTarget: (creatureId?: string) => void;
  toggleSpell: (spellId: string) => void;
  reset: () => void;
  load: (build: Build) => void;
  dismissRemovedNotice: () => void;
}

export const useSimStore = create<SimStore>((set) => ({
  build: emptyBuild(),
  removedByVocation: [],

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
    set((state) => ({
      build: {
        ...state.build,
        equipment: {
          ...state.build.equipment,
          [slot]: { itemId, imbuementIds: [] },
        },
      },
    })),

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
  setTarget: (targetCreatureId) =>
    set((state) => ({ build: { ...state.build, targetCreatureId } })),

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

  reset: () => set({ build: emptyBuild(), removedByVocation: [] }),
  load: (build) => set({ build, removedByVocation: [] }),
  dismissRemovedNotice: () => set({ removedByVocation: [] }),
}));

function clampInt(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  return Math.max(min, Math.min(max, Math.round(v)));
}
