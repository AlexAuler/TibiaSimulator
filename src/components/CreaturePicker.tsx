'use client';

/**
 * RF6: busca de criatura-alvo + card com HP, modificadores elementais
 * (verde = toma mais dano, vermelho = resiste) e ataques.
 */

import { useMemo, useState } from 'react';
import { ElementSchema, type Element } from '@/engine/schemas/enums';
import { allCreatures, creatureById } from '@/lib/data';
import { fmt0, fmtPct } from '@/lib/format';
import { useSimStore } from '@/lib/store';
import { S } from '@/lib/strings';
import { Panel, Sprite, ElementBadge } from './ui';

function modClass(mod: number): string {
  if (mod === 0) return 'border-ink-500 bg-ink-800 text-parchment-600';
  if (mod > 1) return 'border-green-700/70 bg-green-900/25 text-green-300';
  if (mod < 1) return 'border-blood-600/70 bg-blood-600/15 text-blood-500';
  return 'border-ink-600 bg-ink-850 text-parchment-500';
}

export default function CreaturePicker() {
  const build = useSimStore((s) => s.build);
  const setTarget = useSimStore((s) => s.setTarget);
  const [query, setQuery] = useState('');

  const selected = build.targetCreatureId ? creatureById.get(build.targetCreatureId) : undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allCreatures.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  return (
    <Panel title={S.creature.title}>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={S.creature.searchPlaceholder}
          aria-label={S.creature.title}
          className="w-full rounded border border-ink-500 bg-ink-900 px-3 py-1.5 text-sm text-parchment-100 placeholder:text-parchment-600 focus:border-gold-500 focus:outline-none"
        />
        {filtered.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded border border-ink-500 bg-ink-850 shadow-xl">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setTarget(c.id);
                    setQuery('');
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-parchment-200 hover:bg-ink-700"
                >
                  <Sprite src={`/sprites/creatures/${c.id}.gif`} alt={c.name} size={28} />
                  {c.name}
                  <span className="ml-auto text-xs text-parchment-600">{fmt0(c.hitpoints)} HP</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!selected && <p className="mt-3 text-sm text-parchment-600 italic">{S.creature.none}</p>}

      {selected && (
        <div className="fadein mt-3 space-y-3">
          <div className="flex items-center gap-3">
            <Sprite src={`/sprites/creatures/${selected.id}.gif`} alt={selected.name} size={56} />
            <div className="min-w-0">
              <p className="truncate font-display text-lg text-parchment-100">{selected.name}</p>
              <p className="text-xs text-parchment-500">
                {S.creature.hp}:{' '}
                <strong className="text-parchment-200">{fmt0(selected.hitpoints)}</strong>
                {' · '}
                {S.creature.armor}:{' '}
                <strong className="text-parchment-200">
                  {selected.armor ?? S.creature.unknown}
                </strong>
                {' · '}
                {S.creature.mitigation}:{' '}
                <strong className="text-parchment-200">
                  {selected.mitigationPct != null
                    ? fmtPct(selected.mitigationPct)
                    : S.creature.unknown}
                </strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTarget(undefined)}
              aria-label="Remover criatura"
              className="ml-auto self-start text-parchment-600 hover:text-blood-500"
            >
              ✕
            </button>
          </div>

          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-parchment-600">
              {S.creature.modifiers}{' '}
              <span className="normal-case text-parchment-700">({S.creature.weakHint})</span>
            </p>
            <div className="grid grid-cols-4 gap-1">
              {ElementSchema.options.map((el: Element) => {
                const mod = selected.elementModifiers[el] ?? 1;
                return (
                  <span
                    key={el}
                    className={`rounded border px-1.5 py-1 text-center text-[10px] leading-tight ${modClass(mod)}`}
                    title={`${S.elements[el]}: ${Math.round(mod * 100)}%`}
                  >
                    {S.elements[el]}
                    <br />
                    <strong className="text-[11px]">
                      {mod === 0 ? S.immune : `${Math.round(mod * 100)}%`}
                    </strong>
                  </span>
                );
              })}
            </div>
          </div>

          {selected.attacks.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-wider text-parchment-600">
                {S.creature.attacks}
              </p>
              <ul className="space-y-0.5 text-xs">
                {selected.attacks.map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <ElementBadge element={a.element} label={a.name} />
                    <span className="text-parchment-400 tabular-nums">
                      {fmt0(a.min)}–{fmt0(a.max)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
