'use client';

/**
 * RF4: imbuements por item, respeitando count e categorias permitidas.
 * Um <select> por slot de imbuement do item; opções agrupadas por categoria.
 */

import { useMemo } from 'react';
import type { Item } from '@/engine/schemas/item';
import type { Slot } from '@/engine/schemas/enums';
import { allImbuements } from '@/lib/data';
import { useSimStore } from '@/lib/store';
import { S } from '@/lib/strings';

const CATEGORY_LABEL: Record<string, string> = {
  elementalDamage: 'Dano elemental',
  critical: 'Crítico',
  leechHp: 'Life leech',
  leechMana: 'Mana leech',
  skillBoost: 'Skill',
  protection: 'Proteção',
};

export default function ImbuementSelect({ slot, item }: { slot: Slot; item: Item }) {
  const build = useSimStore((s) => s.build);
  const setImbuements = useSimStore((s) => s.setImbuements);
  const eq = build.equipment[slot];
  const cfg = item.imbuementSlots;

  const options = useMemo(() => {
    if (!cfg) return [];
    return allImbuements.filter((imb) => cfg.allowed.includes(imb.category));
  }, [cfg]);

  if (!cfg || !eq) return null;

  const current = eq.imbuementIds;

  const change = (index: number, id: string) => {
    const next = [...current];
    if (id === '') {
      next.splice(index, 1);
    } else {
      next[index] = id;
    }
    // dedup mantendo a primeira ocorrência
    const seen = new Set<string>();
    setImbuements(
      slot,
      next.filter((x) => {
        if (!x || seen.has(x)) return false;
        seen.add(x);
        return true;
      }),
    );
  };

  const grouped = Object.entries(
    options.reduce<Record<string, typeof options>>((acc, imb) => {
      (acc[imb.category] ??= []).push(imb);
      return acc;
    }, {}),
  );

  return (
    <div className="mt-2 space-y-1.5">
      <span className="block text-[11px] uppercase tracking-wider text-parchment-600">
        {S.equipment.imbuements} ({cfg.count})
      </span>
      {Array.from({ length: cfg.count }, (_, i) => (
        <select
          key={i}
          value={current[i] ?? ''}
          onChange={(e) => change(i, e.target.value)}
          aria-label={`${S.equipment.imbuements} ${i + 1} — ${item.name}`}
          className="w-full rounded border border-ink-500 bg-ink-900 px-2 py-1 text-xs text-parchment-200 focus:border-gold-500 focus:outline-none"
        >
          <option value="">{S.equipment.imbuementEmpty}</option>
          {grouped.map(([cat, imbs]) => (
            <optgroup key={cat} label={CATEGORY_LABEL[cat] ?? cat}>
              {imbs.map((imb) => (
                <option
                  key={imb.id}
                  value={imb.id}
                  disabled={current.includes(imb.id) && current[i] !== imb.id}
                >
                  {imb.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      ))}
    </div>
  );
}
