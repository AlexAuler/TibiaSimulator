'use client';

/** RF10: copiar permalink da build + reset. */

import { useState } from 'react';
import { buildToUrl } from '@/lib/serialize';
import { useSimStore } from '@/lib/store';
import { S } from '@/lib/strings';

export default function ShareBar() {
  const build = useSimStore((s) => s.build);
  const reset = useSimStore((s) => s.reset);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = buildToUrl(build, window.location.origin);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // fallback para contextos sem clipboard API
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="flex-1 rounded border border-gold-700 bg-gold-600/20 px-4 py-2 font-display text-sm uppercase tracking-wider text-gold-300 transition hover:bg-gold-600/35"
      >
        {copied ? S.share.copied : S.share.copy}
      </button>
      <button
        type="button"
        onClick={() => {
          if (window.confirm(S.share.resetConfirm)) reset();
        }}
        className="rounded border border-ink-500 bg-ink-800 px-4 py-2 text-sm text-parchment-500 transition hover:border-blood-600 hover:text-blood-500"
      >
        {S.share.reset}
      </button>
    </div>
  );
}
