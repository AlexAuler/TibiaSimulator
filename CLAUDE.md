# TibiaSim — Simulador de builds de Tibia (theorycrafting)

Web app Next.js que simula uma build completa de personagem contra uma
criatura específica. Especificação completa: `docs/PLANO-MVP.md` (fonte da
verdade — em conflito, o plano vence).

## Comandos
- `pnpm dev` — servidor local
- `pnpm test` — Vitest (engine e componentes)
- `pnpm lint` — ESLint + Prettier check
- `pnpm validate:data` — valida `data/seed/*.json` contra os schemas Zod
- `pnpm build` — build de produção

## Arquitetura (resumo)
- `src/engine/` — cálculo PURO: sem React, sem fetch, sem DOM. Entrada
  `Build` + datasets, saída `SimulationResult`.
- `src/engine/constants.ts` — ÚNICO lugar para constantes de mecânica do
  jogo. Cada constante tem comentário com URL da fonte (TibiaWiki) e data.
- `data/seed/` — datasets JSON curados; todo registro tem campo `source`.
- `src/lib/` — serialização da build (lz-string ↔ URL), loaders.
- `src/components/` e `src/app/` — UI (Tailwind, tema dark fantasy).

## Regras inegociáveis
- NUNCA inventar valores de mecânica do jogo (fórmulas, percentuais,
  chances). Sem fonte ⇒ marcar `TODO(verify)`, listar no resumo do trabalho
  e perguntar. Não confiar em memória de treino para números do Tibia.
- Fórmulas: implementar a partir de https://tibia.fandom.com/wiki/Formulae
  e páginas correlatas, citando a URL na constante correspondente.
- Testes ANTES da implementação em tudo que for fórmula (`src/engine`).
  Golden tests com a derivação em comentário.
- Nenhum sprite/asset da CipSoft no repositório. Ícones próprios ou livres.
- Nomes de itens/criaturas/spells sempre em inglês (como no jogo);
  textos de UI em pt-BR, centralizados para futura i18n.
- Nada de backend no MVP: permalink é a build serializada na URL.
- TypeScript estrito; validação de dados sempre via schemas Zod de
  `src/engine/schemas/`.

## Fluxo de trabalho
- Trabalhar UM milestone por vez (Seção 9 do plano). Antes de codar,
  reler a seção do milestone; ao terminar, rodar lint + test +
  validate:data + build e conferir o Definition of Done.
- Commits pequenos com mensagem convencional (`feat:`, `fix:`, `test:`,
  `data:`, `docs:`).
- Mudou número de resultado de simulação? O diff do snapshot test deve
  aparecer no PR com justificativa.

## Contexto de domínio (mínimo)
- Vocações: knight, paladin, sorcerer, druid, monk (monk sem
  Harmony/Serene no MVP).
- Elementos: physical, fire, ice, energy, earth, death, holy.
- `Creature.elementModifiers`: fração do dano recebido (1.0 neutro,
  0 imune, >1.0 fraqueza).

Tibia é marca registrada da CipSoft GmbH. Projeto de fã, sem afiliação.
