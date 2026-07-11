'use client';

/**
 * Composição do simulador: 3 painéis no desktop, tabs no mobile (Seção 8).
 * Sincroniza estado <-> URL (?b=) para o permalink (RF10).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { simulate } from '@/engine/simulate';
import { datasets } from '@/lib/data';
import { BUILD_PARAM, decodeBuild, encodeBuild } from '@/lib/serialize';
import { useSimStore } from '@/lib/store';
import { S } from '@/lib/strings';
import VocationLevelForm from './VocationLevelForm';
import EquipmentGrid from './EquipmentGrid';
import CharmPicker from './CharmPicker';
import CreaturePicker from './CreaturePicker';
import SpellPicker from './SpellPicker';
import ResultsPanel from './ResultsPanel';
import ShareBar from './ShareBar';

type Tab = 'character' | 'equipment' | 'results';

/** Lê a build da URL no primeiro load e escreve de volta (debounced). */
function useUrlSync() {
  const build = useSimStore((s) => s.build);
  const load = useSimStore((s) => s.load);
  const hydrated = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get(BUILD_PARAM);
    if (encoded) {
      const decoded = decodeBuild(encoded);
      if (decoded) load(decoded);
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só no mount
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const url = `${window.location.pathname}?${BUILD_PARAM}=${encodeBuild(build)}`;
      window.history.replaceState(null, '', url);
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [build]);
}

export default function SimulatorApp() {
  useUrlSync();
  const build = useSimStore((s) => s.build);
  const [tab, setTab] = useState<Tab>('character');

  const result = useMemo(() => simulate(build, datasets), [build]);

  const characterCol = (
    <div className="space-y-4">
      <VocationLevelForm />
      <SpellPicker />
    </div>
  );
  const equipmentCol = (
    <div className="space-y-4">
      <EquipmentGrid />
      <CharmPicker />
      <CreaturePicker />
    </div>
  );
  const resultsCol = <ResultsPanel result={result} />;

  return (
    <div>
      <p className="mb-4 text-sm text-parchment-500">{S.tagline}</p>

      <div className="mb-4">
        <ShareBar />
      </div>

      {/* mobile: tabs */}
      <div
        className="mb-4 flex overflow-hidden rounded border border-ink-600 lg:hidden"
        role="tablist"
      >
        {(
          [
            ['character', S.tabs.character],
            ['equipment', S.tabs.equipment],
            ['results', S.tabs.results],
          ] as Array<[Tab, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex-1 px-2 py-2 font-display text-xs uppercase tracking-wider transition ${
              tab === key
                ? 'bg-gold-600/25 text-gold-300'
                : 'bg-ink-850 text-parchment-500 hover:text-parchment-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="lg:hidden">
        {tab === 'character' && characterCol}
        {tab === 'equipment' && equipmentCol}
        {tab === 'results' && resultsCol}
        {tab !== 'results' && (
          <button
            type="button"
            onClick={() => setTab('results')}
            className="fixed right-4 bottom-4 z-30 rounded-full border border-gold-600 bg-ink-800 px-4 py-2.5 font-display text-xs uppercase tracking-wider text-gold-300 shadow-xl"
          >
            {S.seeResults}
          </button>
        )}
      </div>

      {/* desktop: 3 colunas */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[minmax(300px,360px)_minmax(320px,400px)_1fr]">
        <div>{characterCol}</div>
        <div>{equipmentCol}</div>
        <div>{resultsCol}</div>
      </div>
    </div>
  );
}
