import type { Metadata } from 'next';
import { Alegreya, Cinzel } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { S } from '@/lib/strings';
import { dataMeta } from '@/lib/data';

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['400', '600', '700'],
});

const alegreya = Alegreya({
  subsets: ['latin'],
  variable: '--font-alegreya',
});

export const metadata: Metadata = {
  title: 'TibiaSim — Simulador de builds de Tibia',
  description:
    'Monte personagem, equipamentos, imbuements e charm; escolha uma criatura-alvo e veja dano, defesa e sobrevivência estimados. Compartilhe a build por link.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${alegreya.variable}`}>
      <body>
        <header className="border-b border-ink-600/60 bg-ink-900/80 backdrop-blur">
          <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="group flex items-baseline gap-2">
              <span className="font-display text-xl font-bold tracking-wide text-gold-400 group-hover:text-gold-300">
                {S.appName}
              </span>
              <span className="hidden text-xs text-parchment-500 sm:inline">
                theorycrafting não oficial
              </span>
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="text-parchment-300 hover:text-gold-300">
                {S.nav.simulator}
              </Link>
              <Link href="/sobre" className="text-parchment-300 hover:text-gold-300">
                {S.nav.about}
              </Link>
              <Link href="/creditos" className="text-parchment-300 hover:text-gold-300">
                {S.nav.credits}
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-screen-2xl px-4 py-6">{children}</main>

        <footer className="mt-10 border-t border-ink-600/60 bg-ink-900/60">
          <div className="mx-auto max-w-screen-2xl space-y-1 px-4 py-5 text-xs text-parchment-500">
            <p>{S.footer.disclaimer}</p>
            <p>
              {S.footer.dataVersion(dataMeta.dataVersion, dataMeta.generatedAt)} ·{' '}
              <Link href="/creditos" className="underline hover:text-gold-300">
                fontes e atribuição
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
