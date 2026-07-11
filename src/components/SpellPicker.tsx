'use client';

/** Seleção das spells exibidas na tabela de resultados (RF7). */

import { spellsForVocation } from '@/lib/data';
import { useSimStore } from '@/lib/store';
import { S } from '@/lib/strings';
import { Panel, Sprite, ElementBadge } from './ui';

export default function SpellPicker() {
  const build = useSimStore((s) => s.build);
  const toggleSpell = useSimStore((s) => s.toggleSpell);
  const spells = spellsForVocation(build.vocation);

  return (
    <Panel title={S.results.pickSpells}>
      {spells.length === 0 ? (
        <p className="text-sm text-parchment-600 italic">{S.results.noSpellsForVocation}</p>
      ) : (
        <ul className="space-y-1">
          {spells.map((sp) => {
            const checked = build.selectedSpellIds.includes(sp.id);
            const locked = sp.minLevel > build.level;
            return (
              <li key={sp.id}>
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded border px-2 py-1.5 text-sm transition ${
                    checked
                      ? 'border-gold-700/70 bg-ink-800 text-parchment-100'
                      : 'border-ink-600/50 bg-ink-850 text-parchment-400 hover:border-ink-500'
                  } ${locked ? 'opacity-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSpell(sp.id)}
                    className="accent-[#c9a44c]"
                  />
                  <Sprite src={`/sprites/spells/${sp.id}.gif`} alt={sp.name} size={24} />
                  <span className="min-w-0 flex-1 truncate">
                    {sp.name} <span className="text-parchment-600">({sp.words})</span>
                  </span>
                  <ElementBadge element={sp.element} label="" />
                  <span className="text-[11px] text-parchment-600">
                    {S.equipment.levelReq(sp.minLevel)}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
