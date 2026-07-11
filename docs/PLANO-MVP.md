# Plano de MVP — Simulador de Builds de Tibia (Theorycrafting)

> **Documento de referência para desenvolvimento com Claude Code.**
> Versão 1.0 — Julho/2026. Codinome do projeto: **TibiaSim** (nome final a decidir).
> Tibia é marca registrada da CipSoft GmbH. Este é um projeto de fã, não afiliado à CipSoft.

---

## 0. Como usar este documento com o Claude Code

1. Crie o repositório e coloque este arquivo em `docs/PLANO-MVP.md`.
2. Coloque o `CLAUDE.md` (fornecido junto) na **raiz** do repositório — ele é o contrato curto de trabalho; este plano é a especificação detalhada referenciada por ele.
3. Trabalhe **um milestone por vez** (Seção 9). Cada milestone tem "Definition of Done" e um prompt sugerido.
4. Ao final de cada milestone: rode os comandos de verificação, revise o diff e só então avance.
5. Regra de ouro para a IA: **nunca inventar valores de mecânica do jogo** (fórmulas, percentuais, constantes). Se um valor não estiver no dataset ou em fonte citada, marcar `TODO(verify)` e perguntar.

---

## 1. Visão do produto

**Pitch:** o "simulador de builds" do Tibia — monte personagem + equipamentos + imbuements + charm, escolha uma criatura-alvo e veja dano ofensivo, mitigação defensiva e sobrevivência **antes** de gastar gold. Compartilhe a build por link.

**Analogia:** Raidbots/SimulationCraft (WoW), mas para Tibia.

**Público:** jogadores de médio/alto nível decidindo upgrades de set, trocas de imbuement e viabilidade de hunt; criadores de conteúdo compartilhando builds.

**Diferencial vs. existentes:**
- Calculadoras atuais (GuildStats "hits", calculadoras genéricas) calculam dano isolado, geralmente **assumindo alvo neutro**, sem criatura específica.
- Hunt Analyser analisa o **pós-hunt** (sessões reais). Nós simulamos o **pré-hunt**.
- Ninguém oferece: build completa → vs. criatura específica → com **permalink compartilhável**.

**Princípio de honestidade:** as fórmulas do Tibia são engenharia reversa da comunidade. Todo resultado exibe selo "estimativa" e a página `/sobre` lista premissas e fontes.

---

## 2. Escopo do MVP

### Dentro (v0.1)
- 5 vocações: Knight, Paladin, Sorcerer, Druid, Monk (Monk **sem** mecânicas de Harmony/Serene — só auto-attack e spells básicas; ver Seção 11).
- Ficha manual: level, skills, modo de ataque (offensive/balanced/defensive).
- Equipamento em 9 slots: weapon, offhand (shield/spellbook/quiver), helmet, armor, legs, boots, amulet, ring, ammo.
- Imbuements por item (respeitando slots do item) e **1 charm ofensivo** ativo contra o alvo.
- Seleção de **1 criatura-alvo** (dataset curado).
- Resultados: painel ofensivo (auto-attack + spells), painel defensivo, painel "contra o alvo".
- Permalink: build serializada na URL (sem backend, sem contas).
- Idioma da UI: **pt-BR** com strings centralizadas (i18n futura). Nomes de itens/criaturas/spells: **inglês**, como no jogo.

### Fora do MVP (backlog — Seção 12)
Wheel of Destiny, Weapon Proficiency, forge/tier (Onslaught etc.), consumíveis e buffs, preys, comparação A/B, mix de respawn, otimizador reverso, galeria de builds, contas de usuário, import de personagem, sprites oficiais, área de efeito de spells (AoE), PvP.

---

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite (resumo) |
|----|-----------|------------------------------|
| RF1 | Selecionar vocação e level | Trocar vocação limpa itens incompatíveis com aviso |
| RF2 | Informar skills manualmente | Campos numéricos com validação (limites plausíveis); só skills relevantes à vocação em destaque |
| RF3 | Equipar item por slot | Combobox com busca; lista filtrada por slot, vocação e level; item mostra stats resumidos |
| RF4 | Aplicar imbuements | Por item, respeitando `imbuementSlots` (quantidade e tipos permitidos); tier Basic/Intricate/Powerful |
| RF5 | Escolher charm ofensivo | Lista de charms ofensivos; efeito refletido no cálculo contra o alvo |
| RF6 | Escolher criatura-alvo | Busca por nome; card com HP, modificadores elementais e ataques |
| RF7 | Ver painel ofensivo | Hit mín/médio/máx do auto-attack; tabela de spells (dano por cast, custo de mana, cooldown, "dano por segundo de cooldown") |
| RF8 | Ver painel defensivo | Armor total, tabela de resistências consolidadas por elemento, HP total do personagem |
| RF9 | Ver painel "contra o alvo" | Dano efetivo pós-resistências da criatura; DPS estimado; dano recebido esperado por ataque da criatura; **hits para morrer** e **hits para matar** |
| RF10 | Compartilhar build | Botão copia URL; abrir a URL restaura a build idêntica; URL versionada (`v` no payload) |
| RF11 | Estados vazios e erros | Build incompleta ainda mostra o que der para calcular, com placeholders claros |
| RF12 | Disclaimer e créditos | Rodapé com marca CipSoft, selo "estimativa" nos resultados e página de atribuição de dados |

---

## 4. Modelo de dados (TypeScript + Zod)

> Regras: todo schema em `src/engine/schemas/` com Zod; tipos inferidos via `z.infer`. Todo registro de dados carrega `source` (URL da TibiaWiki) e o dataset carrega `dataVersion` (versão do update do jogo, ex.: `"15.x"`).

```ts
// enums básicos
type Vocation = 'knight' | 'paladin' | 'sorcerer' | 'druid' | 'monk';
type Element =
  | 'physical' | 'fire' | 'ice' | 'energy' | 'earth'
  | 'death' | 'holy';
type SkillKey =
  | 'magic' | 'fist' | 'club' | 'sword' | 'axe'
  | 'distance' | 'shielding';
type Slot =
  | 'weapon' | 'offhand' | 'helmet' | 'armor' | 'legs'
  | 'boots' | 'amulet' | 'ring' | 'ammo';
type WeaponType =
  | 'sword' | 'axe' | 'club' | 'fist' | 'distance'
  | 'wand' | 'rod' | 'none';
type AttackMode = 'offensive' | 'balanced' | 'defensive';
```

```ts
interface Item {
  id: string;                 // slug estável, ex.: "falcon-longsword"
  name: string;
  slots: Slot[];
  vocations: Vocation[];      // vazio = todas
  minLevel: number;
  weaponType?: WeaponType;
  hands?: 1 | 2;
  attack?: { physical: number; element?: { type: Element; value: number } };
  defense?: number;
  armor?: number;
  attributes?: {
    skillBonuses?: Partial<Record<SkillKey, number>>;
    critChancePct?: number;
    critExtraDmgPct?: number;
    resistances?: Partial<Record<Element, number>>; // % de proteção
  };
  imbuementSlots?: { count: number; allowed: ImbuementCategory[] };
  source: string;             // URL TibiaWiki
}
```

```ts
type ImbuementCategory =
  | 'elementalDamage' | 'critical' | 'leechHp' | 'leechMana'
  | 'skillBoost' | 'protection';

interface Imbuement {
  id: string;
  name: string;               // ex.: "Strike (Powerful)"
  tier: 'basic' | 'intricate' | 'powerful';
  category: ImbuementCategory;
  effect:
    | { kind: 'elementalConversion'; element: Element; pct: number }
    | { kind: 'critical'; chancePct: number; extraDmgPct: number }
    | { kind: 'leech'; resource: 'hp' | 'mana'; pct: number }
    | { kind: 'skillBoost'; skill: SkillKey; value: number }
    | { kind: 'protection'; element: Element; pct: number };
  source: string;
}
```

```ts
interface OffensiveCharm {
  id: string;
  name: string;
  element: Element;
  procChancePct: number;      // TODO(verify): valores pós-rework de charms
  damage: { basis: 'creatureMaxHpPct' | 'flat'; value: number };
  source: string;
}
```

```ts
interface Spell {
  id: string;
  name: string;               // ex.: "Exori Gran"
  vocations: Vocation[];
  minLevel: number;
  manaCost: number;
  cooldownSec: number;
  element: Element;
  // dano = a*level + b*effectiveMagicLevel + c  (coeficientes da TibiaWiki)
  formula: { min: Coef; max: Coef };
  usesWeaponSkill?: boolean;  // spells físicas de knight (exori etc.)
  source: string;
}
type Coef = { a: number; b: number; c: number };
```

```ts
interface Creature {
  id: string;
  name: string;
  hitpoints: number;
  // fração do dano recebido por elemento: 1.0 = neutro, 1.1 = fraco, 0 = imune
  elementModifiers: Record<Element, number>;
  armor?: number;             // estimativa da wiki; pode faltar
  attacks: Array<{
    name: string;
    element: Element;
    min: number;
    max: number;
  }>;
  source: string;
}
```

```ts
// Estado serializável (permalink). Manter PEQUENO e versionado.
interface Build {
  v: 1;                       // versão do schema de serialização
  vocation: Vocation;
  level: number;
  skills: Partial<Record<SkillKey, number>>;
  attackMode: AttackMode;
  equipment: Partial<Record<Slot, {
    itemId: string;
    imbuementIds: string[];
  }>>;
  charmId?: string;
  targetCreatureId?: string;
  selectedSpellIds: string[]; // spells exibidas na tabela
}
```

```ts
interface SimulationResult {
  offense: {
    autoAttack: { min: number; avg: number; max: number; dps: number };
    perSpell: Array<{
      spellId: string; min: number; avg: number; max: number;
      dmgPerCooldownSec: number; manaPerDamage: number;
    }>;
    charmExpectedDps?: number;
    breakdownByElement: Partial<Record<Element, number>>;
  };
  defense: {
    totalArmor: number;
    resistances: Partial<Record<Element, number>>;
    charHp: number;
    perCreatureAttack: Array<{
      attackName: string; expectedDamage: number;
    }>;
    avgIncomingPerTurn: number;
    hitsToDie: number;
  };
  vsTarget: {
    effectiveDps: number;
    hitsToKill: number;
    timeToKillSec: number;
  };
  assumptions: string[];      // premissas usadas, exibidas na UI
}
```

---

## 5. Motor de cálculo (engine)

### 5.1 Princípios
1. **Puro e isolado:** `src/engine/` não importa React, não faz fetch, não lê DOM. Entrada: `Build` + datasets. Saída: `SimulationResult`. 100% unit-testável.
2. **Constantes centralizadas:** todo número de mecânica do jogo vive em `src/engine/constants.ts`, cada um com comentário `// fonte: <URL da TibiaWiki> (acessado em AAAA-MM-DD)`.
3. **Sem invenção:** a IA implementa as fórmulas **a partir da página "Formulae" da TibiaWiki** (https://tibia.fandom.com/wiki/Formulae) e páginas correlatas (Armor, Damage). Valor não encontrado ⇒ `TODO(verify)` + pergunta ao dono do projeto. Nunca chutar.
4. **Determinístico:** MVP calcula valores esperados (média com crit esperado), não Monte Carlo. RNG fica para o backlog.

### 5.2 Pipeline ofensivo (auto-attack)
1. `effectiveSkill = baseSkill + Σ skillBonuses` (equipamento + imbuement skillBoost).
2. `maxBase = f(weaponType, level, effectiveSkill, attackValue, attackModeFactor)` — fórmulas por tipo de arma da wiki (melee, distance, wand/rod). Fatores do modo de ataque: extrair da wiki para `constants.ts`.
3. `minBase` conforme fórmula da wiki (não assumir `level/5` sem confirmar na fonte).
4. **Split elemental:** dano físico da arma + componente elemental da arma + conversão de imbuement `elementalConversion` (a conversão reduz a parte física na mesma proporção — confirmar comportamento na wiki).
5. **Crit esperado:** `avg *= 1 + (critChance% × critExtraDmg%)`, somando fontes de crit (imbuement + itens). Regra de stacking: `TODO(verify)`.
6. **Contra o alvo:** cada componente elemental × `creature.elementModifiers[element]`; componente físico adicionalmente reduzido por armor da criatura **se** o dado existir (senão, aplicar 1.0 e registrar em `assumptions`).
7. `dps = avgVsTarget / ATTACK_INTERVAL_SEC` (intervalo base em `constants.ts`).
8. **Charm:** `charmExpectedDps = procChance × dano_do_charm × modificador_elemental / ATTACK_INTERVAL_SEC`.

### 5.3 Pipeline de spells
Para cada spell selecionada: `min/max = a*level + b*effML + c` (com `effML = magic + bônus de equipamento`); média simples; aplicar modificador elemental do alvo; derivar `dmgPerCooldownSec = avg / cooldownSec` e `manaPerDamage`. Spells físicas de knight usam skill de arma (`usesWeaponSkill`).

### 5.4 Pipeline defensivo
1. `totalArmor = Σ armor` dos itens; redução de dano físico recebido conforme fórmula de armor da wiki.
2. **Resistências:** agregar proteções de itens + imbuements por elemento. **Decisão default do MVP:** soma aditiva com teto de 100%, registrada em `assumptions` (confirmar regra real de stacking na wiki; ajustar se documentado).
3. `charHp` pela fórmula de HP por vocação/level (constantes da wiki).
4. Para cada ataque da criatura: `expected = média(min,max) × (1 − resist%) [− redução de armor se físico]`.
5. `hitsToDie = charHp / avgIncomingPerTurn` (soma dos ataques como um "turno" — simplificação documentada; shielding/defense contra melee entra como refinamento no M2 se a fórmula da wiki for suficiente, senão vai para o backlog com nota).

### 5.5 Simplificações assumidas no MVP (sempre exibidas na UI)
- Distance: 100% de hit chance.
- Monk: sem Harmony/Virtues/Serene.
- Sem AoE (dano single-target).
- Sem defense/shielding reduzindo melee (se não implementado no M2).
- Criatura sem armor conhecido ⇒ dano físico sem redução.

---

## 6. Dados do jogo

### 6.1 Estratégia em duas fases
- **Fase seed (MVP):** datasets **curados à mão** em `data/seed/*.json`, pequenos e verificáveis:
  - ~50 itens "meta" (10 por vocação, cobrindo todos os slots),
  - ~25 criaturas populares de hunt (ex.: dragões, warzones, Feru's Nightmare, Soul War, spawns de Monk),
  - ~20 spells ofensivas principais,
  - imbuements ofensivos/defensivos/leech/skill/crit,
  - charms ofensivos.
  Cada registro com `source` apontando para a página da TibiaWiki. **O dono do projeto revisa os valores** (a IA preenche a estrutura e cita a fonte; não confia em memória).
- **Fase pipeline (pós-MVP):** script que consome o projeto open-source **tibiawiki-sql** (github.com/Galarzaa90/tibiawiki-sql — converte a TibiaWiki em SQLite) e emite os JSONs completos. Manter os mesmos schemas Zod para validar.

### 6.2 Regras
- `scripts/validate-data.ts` valida todos os JSONs contra os schemas Zod (roda no CI e em `pnpm validate:data`).
- Dataset carrega `dataVersion` + `generatedAt`.
- **Licença/atribuição:** conteúdo da TibiaWiki (Fandom) é CC-BY-SA ⇒ página `/creditos` com atribuição e links. **Nenhum sprite/asset da CipSoft no repositório** — usar texto e ícones próprios/livres no MVP.

---

## 7. Arquitetura & stack

| Camada | Escolha | Justificativa |
|--------|---------|---------------|
| Framework | Next.js (App Router) + TypeScript estrito | SSG/ISR, deploy fácil, ecossistema |
| Estilo | Tailwind CSS | velocidade; tema dark fantasy próprio |
| Estado | Zustand + sincronização com URL | permalink de graça |
| Serialização | JSON compacto → lz-string → query param `?b=` | sem backend |
| Validação | Zod | schemas únicos p/ dados e runtime |
| Testes | Vitest (engine), Testing Library (componentes-chave) | fórmulas exigem testes |
| Qualidade | ESLint + Prettier + CI (GitHub Actions: lint, test, validate:data, build) | disciplina p/ agente |
| Deploy | Vercel ou Cloudflare Pages | zero infra |
| Backend | **Nenhum no MVP** | permalink via URL cobre RF10 |

### Estrutura de pastas
```
tibia-sim/
├── CLAUDE.md
├── docs/
│   └── PLANO-MVP.md
├── data/
│   └── seed/ (items.json, creatures.json, spells.json, imbuements.json, charms.json)
├── scripts/
│   └── validate-data.ts
├── src/
│   ├── engine/
│   │   ├── constants.ts        # única casa das constantes de jogo (com fontes)
│   │   ├── schemas/            # Zod
│   │   ├── offense.ts
│   │   ├── defense.ts
│   │   ├── simulate.ts         # orquestra e retorna SimulationResult
│   │   └── __tests__/
│   ├── lib/                    # serialização da build, loaders de dados
│   ├── components/             # UI
│   └── app/                    # rotas Next (/, /sobre, /creditos)
└── ...
```

---

## 8. UI/UX do MVP

**Layout desktop (3 painéis):** `Personagem | Equipamento | Resultados`.
**Mobile:** tabs na mesma ordem; botão flutuante "Ver resultados".

Componentes-chave:
- `VocationLevelForm` — vocação, level, attack mode, skills (RF1/RF2).
- `EquipmentGrid` — grade estilo "paper doll" com os 9 slots (RF3).
- `ItemPicker` — combobox com busca, filtro automático por slot/vocação/level; ao equipar, mostra chips de imbuement (RF4).
- `CharmPicker` e `CreaturePicker` (RF5/RF6) — o card da criatura mostra HP, tabela de modificadores elementais (verde = fraco, vermelho = resistente) e ataques.
- `ResultsPanel` — três cards: **Ofensivo**, **Defensivo**, **Contra o alvo**; cada número com tooltip "como foi calculado"; bloco `assumptions` visível (RF9/RF11).
- `ShareBar` — copiar link + reset (RF10).

Direção visual: dark fantasy sóbrio (pergaminho/pedra/dourado discreto), tipografia serif nos títulos, **sem** cara de template genérico. Acessibilidade básica: navegação por teclado no combobox, contraste AA.

---

## 9. Plano de execução (milestones)

> Um milestone por sessão de Claude Code. Não iniciar o próximo sem o DoD do atual verde.

### M0 — Fundação
Scaffold Next+TS+Tailwind+Vitest+ESLint/Prettier; CI; schemas Zod; `data/seed` mínimo (5 itens, 3 criaturas, 3 spells, 3 imbuements, 2 charms) com `source` reais; `scripts/validate-data.ts`; páginas vazias `/`, `/sobre`, `/creditos`.
**DoD:** `pnpm lint && pnpm test && pnpm validate:data && pnpm build` verdes; app sobe com layout base.
**Prompt sugerido:** "Leia CLAUDE.md e docs/PLANO-MVP.md (Seções 4, 6, 7). Execute o M0 exatamente como especificado. Não implemente nada de engine ainda."

### M1 — Engine ofensiva
`constants.ts` com fontes; auto-attack para os 5 tipos de arma; pipeline elemental + imbuements + crit esperado; spells com coeficientes do dataset. **Testes primeiro:** ≥15 golden tests com casos montados a partir das fórmulas da wiki; testes de propriedade (skill↑ ⇒ dano não diminui; modificador 0 ⇒ dano elemental 0).
**DoD:** cobertura de `src/engine` ≥ 90%; nenhum `TODO(verify)` silencioso (todos listados no PR); sanidade manual comparando 3 casos com a calculadora de hits do GuildStats.
**Prompt sugerido:** "Execute o M1 (Seção 5.2/5.3). Extraia as fórmulas da página Formulae da TibiaWiki e cite a URL em cada constante. Escreva os testes antes das implementações. O que não encontrar, marque TODO(verify) e me pergunte."

### M2 — Engine defensiva + "contra o alvo"
Armor, resistências agregadas, HP por vocação, dano recebido por ataque da criatura, `hitsToDie`, `hitsToKill`, `timeToKill`, `assumptions[]`.
**DoD:** testes cobrindo imunidade (modificador 0), resistência e fraqueza; simulação completa `Build → SimulationResult` com snapshot test.

### M3 — Dataset curado completo
Expandir seed para as metas da Seção 6.1; revisão humana dos valores; `/creditos` com atribuição CC-BY-SA.
**DoD:** `validate:data` verde; tabela de conferência (item → fonte) gerada em `docs/data-review.md` para eu revisar.

### M4 — UI de montagem
Todos os componentes da Seção 8 ligados ao estado; sincronização estado ↔ URL; responsivo.
**DoD:** montar uma build completa apenas pela UI; recarregar a página mantém a build; teste de serialização ida-e-volta.

### M5 — Resultados, share e polish
`ResultsPanel` com breakdowns e tooltips; `ShareBar`; estados vazios; disclaimers; deploy.
**DoD:** fluxo E2E manual do roteiro `docs/qa-checklist.md` (criar no M5) 100% ok; deploy público; Lighthouse desktop ≥ 90 em performance.

---

## 10. Estratégia de testes das fórmulas

1. **Golden tests:** casos de referência derivados das fórmulas documentadas (ex.: knight level X, skill Y, arma Z ⇒ max esperado W). Guardar a derivação em comentário.
2. **Propriedades:** monotonicidade (level/skill/attack ↑ ⇒ dano ↑ ou igual), imunidade zera componente, proteção 100% zera dano recebido do elemento.
3. **Snapshot:** um `SimulationResult` completo por vocação, versionado — qualquer mudança de número vira diff visível no PR.
4. **Calibração futura (backlog):** comparar previsões com logs reais de sessão para ajustar premissas.

---

## 11. Riscos e decisões (com default)

| # | Tema | Decisão default no MVP |
|---|------|------------------------|
| 1 | Fórmulas são engenharia reversa | Selo "estimativa" + página de premissas; constantes com fonte e data |
| 2 | Stacking de resistências | Aditivo com teto 100% + `assumption`; revisar contra a wiki no M2 |
| 3 | Monk (Harmony/Serene) | Fora do cálculo; banner "suporte parcial ao Monk" |
| 4 | Armor de criaturas incompleto na wiki | Aplicar 1.0 e registrar `assumption` por criatura |
| 5 | Updates do jogo (2 grandes/ano) | `dataVersion` visível; dados isolados em JSON p/ troca rápida |
| 6 | Propriedade intelectual | Sem sprites CipSoft; disclaimer de marca; atribuição CC-BY-SA da wiki |
| 7 | Concorrente absorver a ideia | Velocidade + permalink + futura galeria (efeito de rede) |

---

## 12. Backlog pós-MVP (ordem sugerida)

1. **Comparação A/B** de builds lado a lado com diff destacado (maior pedido esperado).
2. **Wheel of Destiny** — import do código copiável do jogo (formato já lido por outras ferramentas, ex.: Hunt Analyser).
3. Weapon Proficiency e tiers de forge (Onslaught etc.).
4. Consumíveis/buffs e preys.
5. Mix de respawn (multi-criatura ponderado) e AoE.
6. Galeria pública de builds (aí sim: backend leve + contas + votos).
7. Otimizador reverso ("melhor imbuement contra X").
8. i18n EN/PL; import de skills via highscores (TibiaData) quando disponível.
9. Monte Carlo (distribuição de dano, variância de leech/crit).
10. Mecânicas completas do Monk.

---

## 13. Referências

- TibiaWiki — Formulae: https://tibia.fandom.com/wiki/Formulae
- TibiaWiki — Calculators (armor, true damage): https://tibia.fandom.com/wiki/Calculators
- tibiawiki-sql (extração estruturada da wiki): https://github.com/Galarzaa90/tibiawiki-sql
- TibiaData API (dados de tibia.com; útil no backlog p/ import): https://tibiadata.com / https://docs.tibiadata.com
- Exevo Pan (fansite open-source — ótima referência de código/UX): https://github.com/xandjiji/exevo-pan
- GuildStats — calculadora de hits (benchmark de sanidade): https://guildstats.eu/character-hits
- Regras de conteúdo/fansites da CipSoft: https://www.tibia.com (seção fansites)
