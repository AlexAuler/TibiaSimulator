'use client';

/**
 * RF7/RF8/RF9/RF11: painéis Ofensivo, Defensivo e Contra o alvo, com
 * tooltips "como foi calculado", breakdown por elemento, estados vazios e
 * bloco de premissas sempre visível.
 */

import { useState } from 'react';
import type { SimulationResult, VsTargetResult } from '@/engine/schemas/result';
import { ELEMENT_COLOR, fmt0, fmt1, fmtSeconds } from '@/lib/format';
import { S } from '@/lib/strings';
import { EstimateBadge, InfoTip, Panel, StatRow, ElementBadge, Sprite } from './ui';

const UNAVAILABLE_REASON: Record<string, string> = {
  'no-weapon': S.results.noWeapon,
  'no-ammo': S.results.noAmmo,
  'no-attack-value': S.results.noAttackValue,
  'wand-without-range': S.results.wandNoRange,
};

function BreakdownBar({ parts }: { parts: Partial<Record<string, number>> }) {
  const entries = Object.entries(parts).filter(([, v]) => (v ?? 0) > 0) as Array<[string, number]>;
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total <= 0 || entries.length === 0) return null;
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full border border-ink-600/60">
        {entries.map(([el, v]) => (
          <span
            key={el}
            style={{ width: `${(v / total) * 100}%`, backgroundColor: ELEMENT_COLOR[el] }}
            title={`${S.elements[el]}: ${fmt0(v)}`}
          />
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
        {entries.map(([el, v]) => (
          <span key={el} className="text-[11px] text-parchment-500">
            <ElementBadge element={el} /> {fmt0(v)}
          </span>
        ))}
      </div>
    </div>
  );
}

function OffenseCard({ result }: { result: SimulationResult }) {
  const auto = result.offense.autoAttack;
  return (
    <Panel title={S.results.offense} badge={<EstimateBadge />}>
      <h3 className="mb-1 text-sm font-semibold text-parchment-300">
        {S.results.autoAttack}
        <InfoTip tip={S.results.tooltips.autoAvg} />
      </h3>
      {auto ? (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            {(
              [
                [S.results.min, fmt0(auto.min), S.results.tooltips.autoMinMax],
                [S.results.avg, fmt0(auto.avg), S.results.tooltips.autoAvg],
                [S.results.max, fmt0(auto.max), S.results.tooltips.autoMinMax],
                [S.results.dps, fmt1(auto.dps), S.results.tooltips.dps],
              ] as const
            ).map(([label, value, tip]) => (
              <div key={label} className="rounded border border-ink-600/60 bg-ink-800/70 px-1 py-2">
                <div className="text-[10px] uppercase tracking-wider text-parchment-600">
                  {label}
                  <InfoTip tip={tip} />
                </div>
                <div className="font-display text-lg text-parchment-100 tabular-nums">{value}</div>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-parchment-600">
            {S.results.critLabel}: ×{auto.critMultiplier.toFixed(3)}
          </p>
          <div className="mt-2">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-parchment-600">
              {S.results.breakdown}
            </p>
            <BreakdownBar parts={auto.breakdownByElement} />
          </div>
        </>
      ) : (
        <p className="rounded border border-dashed border-ink-500 bg-ink-800/40 px-3 py-4 text-center text-sm text-parchment-500">
          {UNAVAILABLE_REASON[result.offense.autoAttackUnavailableReason ?? ''] ??
            S.results.noWeapon}
        </p>
      )}

      <h3 className="mt-4 mb-1 text-sm font-semibold text-parchment-300">
        {S.results.spells}
        <InfoTip tip={S.results.tooltips.spellDmg} />
      </h3>
      {result.offense.perSpell.length === 0 ? (
        <p className="text-xs text-parchment-600 italic">{S.results.noSpells}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink-600/60 text-left text-[10px] uppercase tracking-wider text-parchment-600">
                <th className="py-1 pr-2">{S.results.spellCols.spell}</th>
                <th className="py-1 pr-2 text-right">{S.results.spellCols.dmg}</th>
                <th className="py-1 pr-2 text-right">
                  {S.results.spellCols.perCd}
                  <InfoTip tip={S.results.tooltips.perCd} />
                </th>
                <th className="py-1 pr-2 text-right">
                  {S.results.spellCols.mana}
                  <InfoTip tip={S.results.tooltips.manaPerDmg} />
                </th>
                <th className="py-1 text-right">
                  {S.results.spellCols.vsTarget}
                  <InfoTip tip={S.results.tooltips.vsSpell} />
                </th>
              </tr>
            </thead>
            <tbody>
              {result.offense.perSpell.map((sp) => (
                <tr key={sp.spellId} className="border-b border-ink-700/40">
                  <td className="py-1.5 pr-2">
                    <ElementBadge element={sp.element} label={sp.name} />
                  </td>
                  <td className="py-1.5 pr-2 text-right text-parchment-300 tabular-nums">
                    {fmt0(sp.min)}–{fmt0(sp.max)}
                  </td>
                  <td className="py-1.5 pr-2 text-right text-parchment-300 tabular-nums">
                    {fmt1(sp.dmgPerCooldownSec)}
                  </td>
                  <td className="py-1.5 pr-2 text-right text-parchment-300 tabular-nums">
                    {sp.manaPerDamage > 0 ? sp.manaPerDamage.toFixed(2) : '—'}
                  </td>
                  <td className="py-1.5 text-right text-parchment-100 tabular-nums">
                    {sp.avgVsTarget != null ? fmt0(sp.avgVsTarget) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function DefenseCard({ result }: { result: SimulationResult }) {
  const d = result.defense;
  const resistEntries = Object.entries(d.resistances).filter(([, v]) => v !== 0);
  return (
    <Panel title={S.results.defense} badge={<EstimateBadge />}>
      <StatRow label={S.results.hp} value={fmt0(d.charHp)} />
      <StatRow label={S.results.mana} value={fmt0(d.charMana)} />
      <StatRow
        label={S.results.armorTotal}
        value={fmt0(d.totalArmor)}
        tip={S.results.tooltips.armor}
      />
      <StatRow
        label={S.results.defenseValue}
        value={fmt0(d.defenseValue)}
        tip={S.results.tooltips.defenseValue}
      />

      <h3 className="mt-3 mb-1 text-sm font-semibold text-parchment-300">
        {S.results.resistances}
        <InfoTip tip={S.results.tooltips.resist} />
      </h3>
      {resistEntries.length === 0 ? (
        <p className="text-xs text-parchment-600 italic">{S.results.noResist}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {resistEntries.map(([el, pct]) => (
            <span
              key={el}
              className={`rounded border px-2 py-0.5 text-xs tabular-nums ${
                pct > 0
                  ? 'border-green-700/60 bg-green-900/20 text-green-300'
                  : 'border-blood-600/60 bg-blood-600/10 text-blood-500'
              }`}
            >
              {S.elements[el]} {pct > 0 ? '+' : ''}
              {fmt1(pct)}%
            </span>
          ))}
        </div>
      )}
    </Panel>
  );
}

/** Detalhe expandido de uma linha da tabela de alvos. */
function VsTargetDetail({ vs }: { vs: VsTargetResult }) {
  return (
    <div className="space-y-1 border-t border-ink-600/40 bg-ink-900/40 px-3 py-2">
      <StatRow
        label={S.results.effectiveDps}
        value={vs.effectiveDps != null ? fmt1(vs.effectiveDps) : '—'}
        tip={S.results.tooltips.effDps}
      />
      {vs.charmExpectedDps != null && (
        <>
          <StatRow
            label={S.results.charmDps}
            value={fmt1(vs.charmExpectedDps)}
            tip={S.results.tooltips.charm}
          />
          <StatRow
            label={S.results.charmPerProc}
            value={fmt0(vs.charmExpectedDamagePerProc ?? 0)}
            tip={S.results.tooltips.charm}
          />
        </>
      )}
      <StatRow
        label={S.results.timeToKill}
        value={vs.timeToKillSec != null ? fmtSeconds(vs.timeToKillSec) : '—'}
        tip={S.results.tooltips.ttk}
      />
      {vs.incomingPerAttack.length > 0 && (
        <>
          <h4 className="mt-1 text-xs font-semibold text-parchment-300">
            {S.results.incoming}
            <InfoTip tip={S.results.tooltips.incoming} />
          </h4>
          <ul className="space-y-0.5 text-xs">
            {vs.incomingPerAttack.map((a, i) => (
              <li key={i} className="flex items-center justify-between">
                <ElementBadge element={a.element} label={a.attackName} />
                <span className="text-parchment-200 tabular-nums">{fmt0(a.expectedDamage)}</span>
              </li>
            ))}
          </ul>
          <StatRow label={S.results.perTurn} value={fmt0(vs.avgIncomingPerTurn)} />
          <StatRow
            label={S.results.hitsToDie}
            value={vs.hitsToDie != null ? fmt1(vs.hitsToDie) : '—'}
            tip={S.results.tooltips.hitsToDie}
          />
        </>
      )}
    </div>
  );
}

function VsTargetsCard({ result }: { result: SimulationResult }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const vsTargets = result.vsTargets;
  return (
    <Panel title={S.results.vsTarget} badge={<EstimateBadge />}>
      {vsTargets.length === 0 ? (
        <p className="rounded border border-dashed border-ink-500 bg-ink-800/40 px-3 py-6 text-center text-sm text-parchment-500">
          {S.results.pickCreature}
        </p>
      ) : (
        <>
          <p className="mb-1.5 text-[11px] text-parchment-600">{S.results.vsHint}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ink-600/60 text-left text-[10px] uppercase tracking-wider text-parchment-600">
                  <th className="py-1 pr-2">{S.results.vsCols.creature}</th>
                  <th className="py-1 pr-2 text-right">
                    {S.results.vsCols.effDps}
                    <InfoTip tip={S.results.tooltips.effDps} />
                  </th>
                  <th className="py-1 pr-2 text-right">
                    {S.results.vsCols.hits}
                    <InfoTip tip={S.results.tooltips.hitsToKill} />
                  </th>
                  <th className="py-1 pr-2 text-right">
                    {S.results.vsCols.incoming}
                    <InfoTip tip={S.results.tooltips.incoming} />
                  </th>
                  <th className="py-1 text-right">
                    {S.results.vsCols.hitsToDie}
                    <InfoTip tip={S.results.tooltips.hitsToDie} />
                  </th>
                </tr>
              </thead>
              {vsTargets.map((vs) => (
                <tbody key={vs.creatureId}>
                  <tr
                    onClick={() => setOpenId(openId === vs.creatureId ? null : vs.creatureId)}
                    className={`cursor-pointer border-b border-ink-700/40 transition hover:bg-ink-800/60 ${
                      openId === vs.creatureId ? 'bg-ink-800/80' : ''
                    }`}
                  >
                    <td className="py-1.5 pr-2">
                      <span className="flex items-center gap-1.5 text-parchment-100">
                        <Sprite
                          src={`/sprites/creatures/${vs.creatureId}.gif`}
                          alt={vs.creatureName}
                          size={22}
                        />
                        <span className="min-w-0">
                          <span className="block truncate">{vs.creatureName}</span>
                          <span className="block text-[10px] text-parchment-600">
                            {fmt0(vs.creatureHp)} HP
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 text-right text-parchment-100 tabular-nums">
                      {vs.effectiveDps != null ? fmt1(vs.effectiveDps) : '—'}
                    </td>
                    <td className="py-1.5 pr-2 text-right text-parchment-300 tabular-nums">
                      {vs.hitsToKill != null ? fmt1(vs.hitsToKill) : '—'}
                    </td>
                    <td className="py-1.5 pr-2 text-right text-parchment-300 tabular-nums">
                      {vs.avgIncomingPerTurn > 0 ? fmt0(vs.avgIncomingPerTurn) : '—'}
                    </td>
                    <td className="py-1.5 text-right text-parchment-300 tabular-nums">
                      {vs.hitsToDie != null ? fmt1(vs.hitsToDie) : '—'}
                    </td>
                  </tr>
                  {openId === vs.creatureId && (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <VsTargetDetail vs={vs} />
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}
            </table>
          </div>
        </>
      )}
    </Panel>
  );
}

export default function ResultsPanel({ result }: { result: SimulationResult }) {
  return (
    <div className="space-y-4">
      <OffenseCard result={result} />
      <VsTargetsCard result={result} />
      <DefenseCard result={result} />

      <details className="rounded border border-ink-600/60 bg-ink-850/70 px-4 py-3 text-xs open:pb-4">
        <summary className="cursor-pointer font-display text-[11px] uppercase tracking-widest text-parchment-500 hover:text-gold-400">
          {S.results.assumptions} ({result.assumptions.length})
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-parchment-400">
          {result.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
