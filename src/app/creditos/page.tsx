import type { Metadata } from 'next';
import { dataMeta } from '@/lib/data';

export const metadata: Metadata = { title: 'Créditos e atribuição — TibiaSim' };

export default function CreditosPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl text-gold-400">Créditos e atribuição</h1>
      </header>

      <section className="space-y-2 text-parchment-300">
        <h2 className="text-xl text-gold-400">Marca e direitos</h2>
        <p>
          Tibia e todos os elementos relacionados (nomes, criaturas, itens, sprites) são propriedade
          e marca registrada da <strong>CipSoft GmbH</strong>. O TibiaSim é um projeto de fã,
          gratuito e sem afiliação, endosso ou patrocínio da CipSoft.
        </p>
        <p>
          As imagens (sprites de itens, criaturas e outfits) são © CipSoft GmbH e foram obtidas dos
          arquivos hospedados pela comunidade na TibiaWiki. São usadas aqui apenas para
          identificação visual dentro de uma ferramenta de fã, seguindo o espírito das regras de
          fansites. Havendo solicitação da CipSoft, serão removidas.
        </p>
      </section>

      <section className="space-y-2 text-parchment-300">
        <h2 className="text-xl text-gold-400">Dados — TibiaWiki (CC-BY-SA)</h2>
        <p>
          Os dados de itens, criaturas, spells, imbuements e charms (versão {dataMeta.dataVersion},
          gerados em {dataMeta.generatedAt}) derivam da{' '}
          <a
            className="text-gold-300 underline"
            href="https://tibia.fandom.com"
            rel="noopener noreferrer"
          >
            TibiaWiki (tibia.fandom.com)
          </a>
          , cujo conteúdo textual é licenciado sob{' '}
          <a
            className="text-gold-300 underline"
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            rel="noopener noreferrer"
          >
            CC-BY-SA
          </a>
          . Cada registro do dataset carrega a URL da página de origem (campo <code>source</code>),
          e a tabela completa de conferência está em <code>docs/data-review.md</code>.
        </p>
      </section>

      <section className="space-y-2 text-parchment-300">
        <h2 className="text-xl text-gold-400">Ferramentas e referências</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <a
              className="text-gold-300 underline"
              href="https://tibia.fandom.com/wiki/Formulae"
              rel="noopener noreferrer"
            >
              TibiaWiki — Formulae
            </a>{' '}
            — base das fórmulas do motor de cálculo.
          </li>
          <li>
            <a
              className="text-gold-300 underline"
              href="https://github.com/Galarzaa90/tibiawiki-sql"
              rel="noopener noreferrer"
            >
              tibiawiki-sql
            </a>{' '}
            — inspiração para o pipeline de dados estruturados.
          </li>
          <li>
            <a
              className="text-gold-300 underline"
              href="https://guildstats.eu"
              rel="noopener noreferrer"
            >
              GuildStats
            </a>{' '}
            — benchmark de sanidade para cálculos de hit.
          </li>
          <li>
            <a
              className="text-gold-300 underline"
              href="https://github.com/xandjiji/exevo-pan"
              rel="noopener noreferrer"
            >
              Exevo Pan
            </a>{' '}
            — referência de fansite open-source.
          </li>
        </ul>
      </section>

      <section className="space-y-2 text-parchment-300">
        <h2 className="text-xl text-gold-400">Contato / takedown</h2>
        <p>
          Problemas com dados, licenças ou pedidos de remoção: abra uma issue em{' '}
          <a
            className="text-gold-300 underline"
            href="https://github.com/AlexAuler/TibiaSimulator/issues"
            rel="noopener noreferrer"
          >
            github.com/AlexAuler/TibiaSimulator/issues
          </a>
          .
        </p>
      </section>
    </article>
  );
}
