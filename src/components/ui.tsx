'use client';

/** Primitivos visuais compartilhados (tema dark fantasy). */

import { useState } from 'react';
import { ELEMENT_COLOR } from '@/lib/format';
import { S } from '@/lib/strings';

export function Panel({
  title,
  badge,
  children,
  className = '',
}: {
  title?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-ink-600/70 bg-ink-850/80 shadow-[0_2px_12px_rgba(0,0,0,0.35)] ${className}`}
    >
      {title != null && (
        <header className="flex items-center justify-between gap-2 border-b border-ink-600/50 px-4 py-2.5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-gold-400">
            {title}
          </h2>
          {badge}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Selo "estimativa" (RF12). */
export function EstimateBadge() {
  return (
    <span
      tabIndex={0}
      className="tip rounded border border-gold-700/70 bg-ink-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold-400"
      data-tip={S.estimateTooltip}
    >
      {S.estimateBadge}
    </span>
  );
}

/** Tooltip "como foi calculado" (RF9). */
export function InfoTip({ tip }: { tip: string }) {
  return (
    <span
      tabIndex={0}
      role="note"
      aria-label={tip}
      className="tip ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-parchment-600/60 text-[10px] text-parchment-500"
      data-tip={tip}
    >
      ?
    </span>
  );
}

/** Sprite do jogo com fallback gracioso quando a imagem não existe. */
export function Sprite({
  src,
  alt,
  size = 32,
  className = '',
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className={`inline-flex items-center justify-center rounded border border-ink-500 bg-ink-800 font-display text-xs text-parchment-500 ${className}`}
      >
        {alt.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- GIFs pixelados locais; next/image não otimiza GIF animado
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`sprite inline-block object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function ElementBadge({ element, label }: { element: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-parchment-300">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: ELEMENT_COLOR[element] ?? '#888' }}
      />
      {label ?? S.elements[element] ?? element}
    </span>
  );
}

export function StatRow({
  label,
  value,
  tip,
}: {
  label: string;
  value: React.ReactNode;
  tip?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-sm text-parchment-500">
        {label}
        {tip ? <InfoTip tip={tip} /> : null}
      </span>
      <span className="text-right font-medium text-parchment-100 tabular-nums">{value}</span>
    </div>
  );
}
