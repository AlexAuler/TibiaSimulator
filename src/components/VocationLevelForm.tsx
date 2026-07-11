'use client';

/** RF1/RF2: vocação, level, modo de ataque e skills com validação. */

import { VocationSchema, type SkillKey, type Vocation } from '@/engine/schemas/enums';
import { useSimStore } from '@/lib/store';
import { S } from '@/lib/strings';
import { Panel, Sprite } from './ui';

const SKILLS: SkillKey[] = ['magic', 'fist', 'club', 'sword', 'axe', 'distance', 'shielding'];

/** Skills em destaque por vocação (RF2). */
const RELEVANT: Record<Vocation, SkillKey[]> = {
  knight: ['sword', 'axe', 'club', 'shielding'],
  paladin: ['distance', 'shielding', 'magic'],
  sorcerer: ['magic'],
  druid: ['magic'],
  monk: ['fist', 'shielding', 'magic'],
};

export default function VocationLevelForm() {
  const build = useSimStore((s) => s.build);
  const { setVocation, setLevel, setSkill, setAttackMode, dismissRemovedNotice } = useSimStore();
  const removed = useSimStore((s) => s.removedByVocation);

  return (
    <Panel title={S.character.title}>
      <div className="space-y-4">
        {/* vocação */}
        <div>
          <label className="mb-1.5 block text-sm text-parchment-500">{S.character.vocation}</label>
          <div className="grid grid-cols-5 gap-1.5">
            {VocationSchema.options.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVocation(v)}
                aria-pressed={build.vocation === v}
                title={S.character.vocations[v]}
                className={`flex flex-col items-center gap-1 rounded border px-1 py-2 text-[11px] transition ${
                  build.vocation === v
                    ? 'border-gold-500 bg-ink-700 text-gold-300'
                    : 'border-ink-600 bg-ink-800 text-parchment-500 hover:border-gold-700 hover:text-parchment-300'
                }`}
              >
                <Sprite
                  src={`/sprites/outfits/${v}.gif`}
                  alt={S.character.vocations[v] ?? v}
                  size={40}
                />
                {S.character.vocations[v]}
              </button>
            ))}
          </div>
        </div>

        {removed.length > 0 && (
          <div
            role="status"
            className="fadein flex items-start justify-between gap-2 rounded border border-blood-600/60 bg-blood-600/15 px-3 py-2 text-xs text-parchment-200"
          >
            <span>{S.character.removedItems(removed.join(', '))}</span>
            <button
              type="button"
              onClick={dismissRemovedNotice}
              className="text-parchment-500 hover:text-parchment-200"
              aria-label="Fechar aviso"
            >
              ✕
            </button>
          </div>
        )}

        {build.vocation === 'monk' && (
          <p className="rounded border border-gold-700/50 bg-gold-700/10 px-3 py-2 text-xs text-parchment-300">
            {S.character.monkBanner}
          </p>
        )}

        {/* level + modo de ataque */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="level" className="mb-1.5 block text-sm text-parchment-500">
              {S.character.level}
            </label>
            <input
              id="level"
              type="number"
              min={1}
              max={3000}
              value={build.level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full rounded border border-ink-500 bg-ink-800 px-3 py-1.5 text-parchment-100 focus:border-gold-500 focus:outline-none"
            />
          </div>
          <div>
            <span className="mb-1.5 block text-sm text-parchment-500">
              {S.character.attackMode}
            </span>
            <div className="flex overflow-hidden rounded border border-ink-500" role="group">
              {(['offensive', 'balanced', 'defensive'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAttackMode(m)}
                  aria-pressed={build.attackMode === m}
                  title={S.character.attackModes[m]}
                  className={`flex-1 px-1 py-1.5 text-[11px] transition ${
                    build.attackMode === m
                      ? 'bg-gold-600/30 text-gold-300'
                      : 'bg-ink-800 text-parchment-500 hover:text-parchment-300'
                  }`}
                >
                  {S.character.attackModes[m]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* skills */}
        <div>
          <span className="mb-1.5 block text-sm text-parchment-500">
            {S.character.skills}{' '}
            <span className="text-xs text-parchment-600">— {S.character.relevantHint}</span>
          </span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {SKILLS.map((sk) => {
              const relevant = RELEVANT[build.vocation].includes(sk);
              return (
                <label
                  key={sk}
                  className={`flex items-center justify-between gap-2 rounded border px-2 py-1 text-xs ${
                    relevant
                      ? 'border-gold-700/60 bg-ink-800 text-parchment-200'
                      : 'border-ink-600/50 bg-ink-850 text-parchment-600'
                  }`}
                >
                  <span>{S.character.skillNames[sk]}</span>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={build.skills[sk] ?? 0}
                    onChange={(e) => setSkill(sk, Number(e.target.value))}
                    aria-label={S.character.skillNames[sk]}
                    className="w-16 rounded border border-ink-500 bg-ink-900 px-2 py-0.5 text-right text-parchment-100 focus:border-gold-500 focus:outline-none"
                  />
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}
