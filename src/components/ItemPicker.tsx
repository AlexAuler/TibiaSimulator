'use client';

/**
 * RF3: combobox modal com busca; lista filtrada por slot, vocação e level.
 * Acessível: foco no input ao abrir, setas para navegar, Enter seleciona,
 * Esc fecha.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Item } from '@/engine/schemas/item';
import type { Slot } from '@/engine/schemas/enums';
import { itemsForSlot } from '@/lib/data';
import { useSimStore } from '@/lib/store';
import { S } from '@/lib/strings';
import { Sprite, ElementBadge } from './ui';

function itemStats(item: Item): string[] {
  const chips: string[] = [];
  if (item.attack) {
    chips.push(
      `Atk ${item.attack.physical}${item.attack.element ? `+${item.attack.element.value}` : ''}`,
    );
  }
  if (item.wandDamage) chips.push(`${item.wandDamage.min}–${item.wandDamage.max}`);
  if (item.defense) chips.push(`Def ${item.defense}`);
  if (item.armor) chips.push(`Arm ${item.armor}`);
  for (const [sk, v] of Object.entries(item.attributes?.skillBonuses ?? {})) {
    chips.push(`${S.character.skillNames[sk] ?? sk} +${v}`);
  }
  if (item.attributes?.critChancePct) chips.push(`crit ${item.attributes.critChancePct}%`);
  if (item.attributes?.critExtraDmgPct) chips.push(`crit dmg +${item.attributes.critExtraDmgPct}%`);
  for (const [el, v] of Object.entries(item.attributes?.resistances ?? {})) {
    chips.push(`${S.elements[el] ?? el} ${v > 0 ? '+' : ''}${v}%`);
  }
  if (item.imbuementSlots) chips.push(`${item.imbuementSlots.count} imbue`);
  if (item.minLevel > 0) chips.push(S.equipment.levelReq(item.minLevel));
  return chips;
}

export default function ItemPicker({ slot, onClose }: { slot: Slot; onClose: () => void }) {
  const build = useSimStore((s) => s.build);
  const equip = useSimStore((s) => s.equip);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const candidates = useMemo(
    () => itemsForSlot(slot, build.vocation, build.level),
    [slot, build.vocation, build.level],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? candidates.filter((i) => i.name.toLowerCase().includes(q)) : candidates;
  }, [candidates, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    setCursor(0);
  }, [query]);
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${cursor}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const select = (item: Item) => {
    equip(slot, item.id);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[cursor];
      if (item) select(item);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/60 p-4 pt-[12vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${S.equipment.pickItem}: ${S.equipment.slotNames[slot]}`}
    >
      <div
        className="fadein w-full max-w-md rounded-lg border border-ink-500 bg-ink-850 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="border-b border-ink-600/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-sm uppercase tracking-wider text-gold-400">
              {S.equipment.slotNames[slot]}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="text-parchment-500 hover:text-parchment-200"
            >
              ✕
            </button>
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={S.equipment.searchPlaceholder}
            role="combobox"
            aria-expanded="true"
            aria-controls="item-picker-list"
            className="w-full rounded border border-ink-500 bg-ink-900 px-3 py-2 text-parchment-100 placeholder:text-parchment-600 focus:border-gold-500 focus:outline-none"
          />
        </div>
        <ul
          id="item-picker-list"
          ref={listRef}
          role="listbox"
          className="max-h-[50vh] overflow-y-auto p-2"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-parchment-500">
              {S.equipment.noItems}
            </li>
          )}
          {filtered.map((item, idx) => (
            <li key={item.id} data-index={idx} role="option" aria-selected={idx === cursor}>
              <button
                type="button"
                onClick={() => select(item)}
                onMouseEnter={() => setCursor(idx)}
                className={`flex w-full items-center gap-3 rounded px-2 py-2 text-left transition ${
                  idx === cursor ? 'bg-ink-700' : 'hover:bg-ink-800'
                }`}
              >
                <Sprite src={`/sprites/items/${item.id}.gif`} alt={item.name} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-parchment-100">{item.name}</span>
                  <span className="block truncate text-[11px] text-parchment-500">
                    {itemStats(item).join(' · ')}
                  </span>
                  {item.attack?.element && <ElementBadge element={item.attack.element.type} />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
