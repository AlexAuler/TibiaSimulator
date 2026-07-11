'use client';

/**
 * RF6 + locais de caça: busca por local (seleciona várias criaturas de uma
 * vez — inspirado em tibiaroute.com/br/hunting-places) ou por criatura
 * individual. Alvos selecionados viram chips removíveis; clicar num chip
 * mostra o card de detalhes da criatura.
 */

import { useMemo, useState } from 'react';
import { ElementSchema, type Element } from '@/engine/schemas/enums';
import type { Creature } from '@/engine/schemas/creature';
import { allCreatures, allHuntingPlaces, creatureById, huntingPlaceById } from '@/lib/data';
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

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n}/5`} className="text-[10px] tracking-tighter text-gold-400">
      {'★'.repeat(n)}
      <span className="text-ink-500">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

function CreatureDetail({ creature, onClose }: { creature: Creature; onClose: () => void }) {
  return (
    <div className="fadein mt-3 space-y-3 border-t border-ink-600/50 pt-3">
      <div className="flex items-center gap-3">
        <Sprite src={`/sprites/creatures/${creature.id}.gif`} alt={creature.name} size={56} />
        <div className="min-w-0">
          <p className="truncate font-display text-lg text-parchment-100">{creature.name}</p>
          <p className="text-xs text-parchment-500">
            {S.creature.hp}:{' '}
            <strong className="text-parchment-200">{fmt0(creature.hitpoints)}</strong>
            {' · '}
            {S.creature.armor}:{' '}
            <strong className="text-parchment-200">{creature.armor ?? S.creature.unknown}</strong>
            {' · '}
            {S.creature.mitigation}:{' '}
            <strong className="text-parchment-200">
              {creature.mitigationPct != null ? fmtPct(creature.mitigationPct) : S.creature.unknown}
            </strong>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes"
          className="ml-auto self-start text-parchment-600 hover:text-parchment-200"
        >
          ✕
        </button>
      </div>

      <div>
        <p className="mb-1 text-[11px] uppercase tracking-wider text-parchment-600">
          {S.creature.modifiers}{' '}
          <span className="text-parchment-700 normal-case">({S.creature.weakHint})</span>
        </p>
        <div className="grid grid-cols-4 gap-1">
          {ElementSchema.options.map((el: Element) => {
            const mod = creature.elementModifiers[el] ?? 1;
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

      {creature.attacks.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-wider text-parchment-600">
            {S.creature.attacks}
          </p>
          <ul className="space-y-0.5 text-xs">
            {creature.attacks.map((a, i) => (
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
  );
}

export default function CreaturePicker() {
  const build = useSimStore((s) => s.build);
  const toggleTarget = useSimStore((s) => s.toggleTarget);
  const setHuntingPlace = useSimStore((s) => s.setHuntingPlace);
  const clearTargets = useSimStore((s) => s.clearTargets);
  const [mode, setMode] = useState<'place' | 'creature'>('place');
  const [query, setQuery] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  const selected = build.targetCreatureIds
    .map((id) => creatureById.get(id))
    .filter((c): c is Creature => Boolean(c));
  const place = build.huntingPlaceId ? huntingPlaceById.get(build.huntingPlaceId) : undefined;
  const detail = detailId ? creatureById.get(detailId) : undefined;

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || mode !== 'place') return [];
    return allHuntingPlaces
      .filter((h) => h.name.toLowerCase().includes(q) || h.city?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, mode]);

  const filteredCreatures = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || mode !== 'creature') return [];
    return allCreatures.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, mode]);

  return (
    <Panel title={S.creature.title}>
      {/* abas: local de caça | criatura */}
      <div className="mb-2 flex overflow-hidden rounded border border-ink-600" role="tablist">
        {(
          [
            ['place', S.creature.tabPlace],
            ['creature', S.creature.tabCreature],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={mode === key}
            onClick={() => {
              setMode(key);
              setQuery('');
            }}
            className={`flex-1 px-2 py-1.5 text-xs transition ${
              mode === key
                ? 'bg-gold-600/25 font-semibold text-gold-300'
                : 'bg-ink-850 text-parchment-500 hover:text-parchment-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            mode === 'place' ? S.creature.searchPlacePlaceholder : S.creature.searchPlaceholder
          }
          aria-label={S.creature.title}
          className="w-full rounded border border-ink-500 bg-ink-900 px-3 py-1.5 text-sm text-parchment-100 placeholder:text-parchment-600 focus:border-gold-500 focus:outline-none"
        />
        {(filteredPlaces.length > 0 || filteredCreatures.length > 0) && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded border border-ink-500 bg-ink-850 shadow-xl">
            {filteredPlaces.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => {
                    setHuntingPlace(h.id);
                    setQuery('');
                    setDetailId(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-parchment-200 hover:bg-ink-700"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{h.name}</span>
                    <span className="block truncate text-[11px] text-parchment-600">
                      {[h.city, S.creature.placeCreatures(h.creatureIds.length)]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  {h.expStars != null && <Stars n={h.expStars} />}
                </button>
              </li>
            ))}
            {filteredCreatures.map((c) => {
              const has = build.targetCreatureIds.includes(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      toggleTarget(c.id);
                      setQuery('');
                      setDetailId(c.id);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-parchment-200 hover:bg-ink-700"
                  >
                    <Sprite src={`/sprites/creatures/${c.id}.gif`} alt={c.name} size={28} />
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    {has && <span className="text-xs text-gold-400">✓</span>}
                    <span className="text-xs text-parchment-600">{fmt0(c.hitpoints)} HP</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected.length === 0 && (
        <p className="mt-3 text-sm text-parchment-600 italic">{S.creature.none}</p>
      )}

      {selected.length > 0 && (
        <div className="fadein mt-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-xs text-parchment-400">
              {place ? (
                <>
                  <span className="font-display text-gold-300">{place.name}</span>
                  {place.city ? ` · ${place.city}` : ''}
                </>
              ) : (
                S.creature.selectedTargets(selected.length)
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                clearTargets();
                setDetailId(null);
              }}
              className="shrink-0 text-[11px] text-parchment-600 underline-offset-2 hover:text-blood-500 hover:underline"
            >
              {S.creature.clearAll}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((c) => (
              <span
                key={c.id}
                className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-1 text-xs transition ${
                  detailId === c.id
                    ? 'border-gold-600 bg-gold-600/15 text-parchment-100'
                    : 'border-ink-500 bg-ink-800 text-parchment-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setDetailId(detailId === c.id ? null : c.id)}
                  className="inline-flex items-center gap-1.5"
                  title={`${fmt0(c.hitpoints)} HP`}
                >
                  <Sprite src={`/sprites/creatures/${c.id}.gif`} alt={c.name} size={20} />
                  {c.name}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toggleTarget(c.id);
                    if (detailId === c.id) setDetailId(null);
                  }}
                  aria-label={`Remover ${c.name}`}
                  className="text-parchment-600 hover:text-blood-500"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          {detail && <CreatureDetail creature={detail} onClose={() => setDetailId(null)} />}
        </div>
      )}
    </Panel>
  );
}
