/**
 * Strings da UI em pt-BR, centralizadas para futura i18n (CLAUDE.md).
 * Nomes de itens/criaturas/spells permanecem em inglês, como no jogo.
 */

export const S = {
  appName: 'TibiaSim',
  tagline: 'Simulador de builds de Tibia — monte, calcule e compartilhe antes de gastar gold.',
  estimateBadge: 'estimativa',
  estimateTooltip:
    'Fórmulas de engenharia reversa da comunidade (TibiaWiki). Valores aproximados, não oficiais.',

  nav: { simulator: 'Simulador', about: 'Sobre & premissas', credits: 'Créditos' },

  tabs: { character: 'Personagem', equipment: 'Equipamento', results: 'Resultados' },
  seeResults: 'Ver resultados',

  character: {
    title: 'Personagem',
    vocation: 'Vocação',
    level: 'Level',
    attackMode: 'Modo de ataque',
    attackModes: {
      offensive: 'Ofensivo',
      balanced: 'Equilibrado',
      defensive: 'Defensivo',
    } as Record<string, string>,
    skills: 'Skills',
    skillNames: {
      magic: 'Magic Level',
      fist: 'Fist Fighting',
      club: 'Club Fighting',
      sword: 'Sword Fighting',
      axe: 'Axe Fighting',
      distance: 'Distance Fighting',
      shielding: 'Shielding',
    } as Record<string, string>,
    relevantHint: 'Skills relevantes para a vocação em destaque.',
    removedItems: (names: string) => `Itens removidos por incompatibilidade de vocação: ${names}.`,
    monkBanner:
      'Suporte parcial ao Monk: auto-attack calculado; Harmony/Serene/Virtues e spells do Monk ficam fora do MVP (sem fórmulas documentadas).',
    vocations: {
      knight: 'Knight',
      paladin: 'Paladin',
      sorcerer: 'Sorcerer',
      druid: 'Druid',
      monk: 'Monk',
    } as Record<string, string>,
  },

  equipment: {
    title: 'Equipamento',
    pickItem: 'Escolher item',
    empty: 'vazio',
    searchPlaceholder: 'Buscar item...',
    noItems: 'Nenhum item compatível com slot, vocação e level.',
    remove: 'Remover',
    removeEquipped: (name: string) => `Remover ${name} (deixar slot vazio)`,
    twoHandedChip: '2 mãos',
    twoHandedBlocked: 'bloqueado: arma de duas mãos equipada',
    twoHandedRemoved: (name: string) =>
      `${name} foi removido: arma de duas mãos não permite item na outra mão (quiver com arma de distância é a exceção).`,
    imbuements: 'Imbuements',
    imbuementEmpty: 'sem imbuement',
    levelReq: (lvl: number) => `level ${lvl}+`,
    slotNames: {
      helmet: 'Capacete',
      amulet: 'Amuleto',
      weapon: 'Arma',
      armor: 'Armadura',
      offhand: 'Escudo / offhand',
      ring: 'Anel',
      legs: 'Calças',
      ammo: 'Munição',
      boots: 'Botas',
    } as Record<string, string>,
  },

  charm: {
    title: 'Charm ofensivo',
    none: 'Nenhum charm',
    stage: 'Estágio',
    stageHint: 'Estágio de upgrade do charm (rework 2024).',
  },

  creature: {
    title: 'Criatura-alvo',
    searchPlaceholder: 'Buscar criatura...',
    none: 'Nenhuma criatura selecionada',
    hp: 'HP',
    armor: 'Armor',
    mitigation: 'Mitigation',
    unknown: '—',
    attacks: 'Ataques',
    modifiers: 'Modificadores de dano',
    weakHint: 'verde = toma mais dano; vermelho = resiste; “imune” = 0%',
  },

  results: {
    title: 'Resultados',
    offense: 'Ofensivo',
    defense: 'Defensivo',
    vsTarget: 'Contra o alvo',
    autoAttack: 'Auto-attack',
    min: 'mín',
    avg: 'média',
    max: 'máx',
    dps: 'DPS',
    noWeapon: 'Equipe uma arma para calcular o auto-attack.',
    noAmmo: 'Arcos e bestas precisam de munição equipada.',
    noAttackValue: 'A arma equipada não tem valor de ataque.',
    wandNoRange: 'Wand/rod sem faixa de dano no dataset.',
    critLabel: 'crit esperado',
    breakdown: 'Composição por elemento',
    spells: 'Spells',
    spellCols: {
      spell: 'Spell',
      dmg: 'Dano (mín–máx)',
      avg: 'Média',
      perCd: 'Dano/s de cooldown',
      mana: 'Mana/dano',
      vsTarget: 'vs alvo',
    },
    pickSpells: 'Selecionar spells',
    noSpells: 'Nenhuma spell selecionada.',
    noSpellsForVocation: 'Sem spells (com fórmula documentada) para esta vocação no dataset.',
    armorTotal: 'Armor total',
    defenseValue: 'Defense value',
    hp: 'HP do personagem',
    mana: 'Mana do personagem',
    resistances: 'Resistências',
    noResist: 'Sem proteções elementais no set.',
    incoming: 'Dano recebido esperado (por ataque da criatura)',
    perTurn: 'Total por turno',
    hitsToDie: 'Hits para morrer',
    hitsToKill: 'Hits para matar',
    timeToKill: 'Tempo para matar',
    effectiveDps: 'DPS efetivo',
    charmDps: 'DPS do charm',
    charmPerProc: 'Dano por proc do charm',
    pickCreature: 'Escolha uma criatura-alvo para ver este painel.',
    assumptions: 'Premissas deste cálculo',
    howCalc: 'como foi calculado',
    seconds: 's',
    tooltips: {
      autoAvg:
        'Média = fórmula do "Attack Value" da Cyclopedia (TibiaWiki): dano base do level + arma × skill × fator do modo de ataque.',
      autoMinMax:
        'Mín = dano base do level; máx = 2×média − mín (distribuição uniforme assumida, consistente com as fórmulas históricas da wiki).',
      dps: 'Média (com crit esperado) dividida pelo intervalo de ataque de 2s.',
      spellDmg:
        'Fórmulas observacionais da TibiaWiki: nível/ML para spells mágicas; skill+attack para spells físicas. Podem estar desatualizadas desde 2020.',
      perCd: 'Dano médio dividido pelo cooldown — régua de comparação entre spells.',
      manaPerDmg: 'Custo de mana por ponto de dano médio — eficiência de mana.',
      armor: 'Soma do armor dos itens. Reduz dano físico recebido em ~[t/2, t−1] (uniforme).',
      defenseValue:
        'Fórmula do "Defense Value" da Cyclopedia (informativo; bloqueio ativo não entra no cálculo de dano recebido).',
      resist:
        'Proteções agregadas multiplicativamente por item/imbuement, como documenta a TibiaWiki.',
      incoming:
        'Média (mín+máx)/2 de cada ataque da criatura, após proteções (%) e redução esperada de armor no físico.',
      hitsToDie: 'HP do personagem ÷ dano total esperado por turno da criatura.',
      effDps: 'Auto-attack (com crit e charm de crítico) ÷ 2s + DPS esperado do charm de proc.',
      hitsToKill: 'HP da criatura ÷ dano médio do auto-attack contra ela.',
      ttk: 'HP da criatura ÷ DPS efetivo.',
      charm:
        'Proc do charm: chance por estágio × dano (com teto) × modificadores da criatura ÷ 2s.',
      vsSpell: 'Dano médio da spell após modificador elemental, armor (se física) e mitigation.',
    },
  },

  share: {
    copy: 'Copiar link da build',
    copied: 'Link copiado!',
    reset: 'Limpar build',
    resetConfirm: 'Limpar toda a build?',
  },

  elements: {
    physical: 'Físico',
    fire: 'Fire',
    ice: 'Ice',
    energy: 'Energy',
    earth: 'Earth',
    death: 'Death',
    holy: 'Holy',
  } as Record<string, string>,

  immune: 'imune',

  footer: {
    disclaimer:
      'Tibia e todos os elementos relacionados são marca registrada da CipSoft GmbH. TibiaSim é um projeto de fã, sem afiliação com a CipSoft. Valores estimados — não oficiais.',
    dataVersion: (v: string, d: string) => `Dados: Tibia ${v} · gerados em ${d}`,
  },

  about: {
    title: 'Sobre & premissas',
  },
  credits: {
    title: 'Créditos e atribuição',
  },
} as const;
