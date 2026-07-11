'use client';

/** RF5: charm ofensivo + estágio de upgrade (rework 2024). */

import { allCharms } from '@/lib/data';
import { useSimStore } from '@/lib/store';
import { S } from '@/lib/strings';
import type { CharmStage } from '@/engine/schemas/charm';
import { Panel, ElementBadge, InfoTip } from './ui';

function charmSummary(id: string): string {
  const charm = allCharms.find((c) => c.id === id);
  if (!charm) return '';
  const e = charm.effect;
  switch (e.kind) {
    case 'proc':
      return `${e.creatureMaxHpPct}% do HP da criatura (teto 2× level)`;
    case 'procOwnStat':
      return `${e.ownStatPct}% do próprio ${e.stat === 'hp' ? 'HP' : 'mana'} (teto 8% do HP da criatura)`;
    case 'critChance':
      return `+${e.chancePctByStage.join('/')}% chance de crítico`;
    case 'critExtra':
      return `+${e.extraDmgPctByStage.join('/')}% dano de crítico`;
  }
}

export default function CharmPicker() {
  const build = useSimStore((s) => s.build);
  const setCharm = useSimStore((s) => s.setCharm);
  const setCharmStage = useSimStore((s) => s.setCharmStage);
  const selected = build.charmId ? allCharms.find((c) => c.id === build.charmId) : undefined;

  return (
    <Panel title={S.charm.title}>
      <div className="space-y-2">
        <select
          value={build.charmId ?? ''}
          onChange={(e) => setCharm(e.target.value || undefined)}
          aria-label={S.charm.title}
          className="w-full rounded border border-ink-500 bg-ink-900 px-2 py-1.5 text-sm text-parchment-100 focus:border-gold-500 focus:outline-none"
        >
          <option value="">{S.charm.none}</option>
          {allCharms.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {selected && (
          <div className="fadein space-y-2 rounded border border-ink-600/60 bg-ink-800/60 p-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              {'element' in selected.effect ? (
                <ElementBadge element={selected.effect.element} />
              ) : (
                <span className="text-parchment-500">crítico</span>
              )}
              <label className="flex items-center gap-1.5 text-parchment-500">
                {S.charm.stage}
                <InfoTip tip={S.charm.stageHint} />
                <select
                  value={build.charmStage}
                  onChange={(e) => setCharmStage(Number(e.target.value) as CharmStage)}
                  aria-label={S.charm.stage}
                  className="rounded border border-ink-500 bg-ink-900 px-1.5 py-0.5 text-parchment-100 focus:border-gold-500 focus:outline-none"
                >
                  {[1, 2, 3].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-parchment-400">{charmSummary(selected.id)}</p>
            {selected.procChancePctByStage && (
              <p className="text-parchment-600">
                chance de ativação: {selected.procChancePctByStage.join('% / ')}% por estágio
              </p>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
