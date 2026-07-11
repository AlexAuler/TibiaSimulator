import type { Metadata } from 'next';
import { ASSUMPTION } from '@/engine/assumptions';

export const metadata: Metadata = { title: 'Sobre & premissas — TibiaSim' };

const FORMULA_SOURCES: Array<[string, string]> = [
  [
    'Fórmulas gerais (Attack Value, dano base, armor, HP/mana)',
    'https://tibia.fandom.com/wiki/Formulae',
  ],
  [
    'Imbuements (conversões, leech, crit, skills, proteções)',
    'https://tibia.fandom.com/wiki/Imbuing',
  ],
  ['Crítico intrínseco (5% / +10%)', 'https://tibia.fandom.com/wiki/Critical_Hit'],
  ['Charms ofensivos (chances por estágio, tetos)', 'https://tibia.fandom.com/wiki/Cyclopedia'],
  ['Mitigation (Bestiário)', 'https://tibia.fandom.com/wiki/Mitigation'],
  ['Intervalo de ataque (2s, "attack turns")', 'https://tibia.fandom.com/wiki/Exercise_Weapons'],
];

export default function SobrePage() {
  return (
    <article className="prose-invert mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl text-gold-400">Sobre & premissas</h1>
        <p className="mt-3 text-parchment-300">
          O TibiaSim estima o desempenho de uma build <em>antes</em> da hunt: dano ofensivo
          (auto-attack e spells), mitigação defensiva e sobrevivência contra uma criatura
          específica. É um projeto de fã, sem afiliação com a CipSoft.
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-xl text-gold-400">Por que “estimativa”?</h2>
        <p className="text-parchment-300">
          As fórmulas do Tibia não são públicas: tudo o que existe é engenharia reversa mantida pela
          comunidade, principalmente na TibiaWiki. Este simulador implementa essas fórmulas citando
          a fonte de cada constante — e exibe, em cada resultado, a lista de premissas usadas no
          cálculo. Quando um dado não existe (ex.: armor de uma criatura), o simulador assume o
          valor neutro e avisa.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl text-gold-400">Premissas do modelo</h2>
        <ul className="list-disc space-y-1 pl-5 text-parchment-300">
          {Object.values(ASSUMPTION).map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl text-gold-400">Fontes das fórmulas</h2>
        <ul className="list-disc space-y-1 pl-5 text-parchment-300">
          {FORMULA_SOURCES.map(([label, url]) => (
            <li key={url}>
              {label} —{' '}
              <a className="text-gold-300 underline" href={url} rel="noopener noreferrer">
                {url.replace('https://', '')}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-parchment-500">
          Observação: a própria TibiaWiki marca as fórmulas de spells como observacionais e
          possivelmente desatualizadas desde o Vocation Adjustment de 2020. O “Base Power” exibido
          pelo cliente (14.10+) ainda não tem fórmula pública — guardamos o valor no dataset para
          referência e calibração futura.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl text-gold-400">Fora do MVP</h2>
        <p className="text-parchment-300">
          Wheel of Destiny, Weapon Proficiency, forge/tiers, consumíveis e buffs, preys, comparação
          A/B, AoE real, PvP e as mecânicas completas do Monk (Harmony/Serene) estão no backlog —
          ver <code>docs/PLANO-MVP.md</code> no repositório.
        </p>
      </section>
    </article>
  );
}
