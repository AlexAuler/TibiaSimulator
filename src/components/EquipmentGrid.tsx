'use client';

/**
 * RF3/RF4: grade "paper doll" com os 9 slots; clique abre o ItemPicker;
 * item equipado mostra sprite + imbuements.
 */

import { useState } from 'react';
import type { Slot } from '@/engine/schemas/enums';
import { itemById } from '@/lib/data';
import { useSimStore } from '@/lib/store';
import { S } from '@/lib/strings';
import ItemPicker from './ItemPicker';
import ImbuementSelect from './ImbuementSelect';
import { Panel, Sprite } from './ui';

/** Disposição inspirada no inventário do jogo (3 colunas). */
const LAYOUT: Array<Array<Slot | null>> = [
  ['amulet', 'helmet', 'ammo'],
  ['weapon', 'armor', 'offhand'],
  ['ring', 'legs', 'boots'],
];

function SlotCell({ slot, onOpen }: { slot: Slot; onOpen: (slot: Slot) => void }) {
  const build = useSimStore((s) => s.build);
  const unequip = useSimStore((s) => s.unequip);
  const eq = build.equipment[slot];
  const item = eq ? itemById.get(eq.itemId) : undefined;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => onOpen(slot)}
        title={`${S.equipment.slotNames[slot]}${item ? `: ${item.name}` : ''}`}
        className={`group relative flex aspect-square w-full flex-col items-center justify-center gap-1 rounded border p-1 transition ${
          item
            ? 'border-gold-700/70 bg-ink-800 hover:border-gold-500'
            : 'border-dashed border-ink-500 bg-ink-850 hover:border-parchment-600'
        }`}
      >
        {item ? (
          <>
            <Sprite src={`/sprites/items/${item.id}.gif`} alt={item.name} size={40} />
            <span className="w-full truncate px-0.5 text-center text-[10px] leading-tight text-parchment-300">
              {item.name}
            </span>
          </>
        ) : (
          <>
            <span className="text-[10px] uppercase tracking-wide text-parchment-600">
              {S.equipment.slotNames[slot]}
            </span>
            <span className="text-[10px] text-parchment-700 italic">{S.equipment.empty}</span>
          </>
        )}
      </button>
      {item && (
        <button
          type="button"
          onClick={() => unequip(slot)}
          className="mt-0.5 self-center text-[10px] text-parchment-600 underline-offset-2 hover:text-blood-500 hover:underline"
        >
          {S.equipment.remove}
        </button>
      )}
    </div>
  );
}

export default function EquipmentGrid() {
  const [openSlot, setOpenSlot] = useState<Slot | null>(null);
  const build = useSimStore((s) => s.build);

  // slots com item e com slots de imbuement, para renderizar seletores
  const imbuableEquipped = (Object.keys(build.equipment) as Slot[])
    .map((slot) => {
      const eq = build.equipment[slot];
      const item = eq ? itemById.get(eq.itemId) : undefined;
      return item?.imbuementSlots ? { slot, item } : null;
    })
    .filter((x): x is { slot: Slot; item: NonNullable<ReturnType<typeof itemById.get>> } =>
      Boolean(x),
    );

  return (
    <Panel title={S.equipment.title}>
      <div className="grid grid-cols-3 gap-2">
        {LAYOUT.flat().map((slot, i) =>
          slot ? <SlotCell key={slot} slot={slot} onOpen={setOpenSlot} /> : <div key={`x${i}`} />,
        )}
      </div>

      {imbuableEquipped.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-ink-600/50 pt-3">
          {imbuableEquipped.map(({ slot, item }) => (
            <div key={slot}>
              <span className="text-xs text-parchment-400">{item.name}</span>
              <ImbuementSelect slot={slot} item={item} />
            </div>
          ))}
        </div>
      )}

      {openSlot && <ItemPicker slot={openSlot} onClose={() => setOpenSlot(null)} />}
    </Panel>
  );
}
