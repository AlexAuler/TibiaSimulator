/**
 * Textos das premissas exibidas na UI (Seção 5.5 e 11 do PLANO-MVP).
 * Centralizados aqui para futura i18n; o engine devolve as strings prontas.
 */

export const ASSUMPTION = {
  estimates:
    'Todos os valores são estimativas: as fórmulas do Tibia são engenharia reversa da comunidade (TibiaWiki).',
  autoAttackModel:
    'Auto-attack: média = "Attack Value" da Cyclopedia; mín. assumido = dano base do level; máx. derivado assumindo distribuição uniforme.',
  attackInterval: 'Intervalo de auto-attack de 2s ("attack turns" da TibiaWiki).',
  critModel:
    'Crítico esperado aplicado apenas ao auto-attack; chance e dano extra somados aditivamente entre fontes (regra exata de stacking não documentada).',
  spellFormulasOutdated:
    'Fórmulas de spells da TibiaWiki são observacionais e podem estar desatualizadas desde o Vocation Adjustment de 2020.',
  distanceHitChance: 'Distance: 100% de chance de acerto.',
  noAdvancedSystems:
    'Sem Wheel of Destiny, Weapon Proficiency, forge/tier, consumíveis, buffs e preys no MVP.',
  monkPartial: 'Suporte parcial ao Monk: mecânicas de Harmony/Serene/Virtues fora do cálculo.',
  aoeSingleTarget: 'Spells de área calculadas como dano single-target (sem AoE).',
  resistStacking:
    'Proteções agregadas multiplicativamente por item/imbuement, conforme regra por item da TibiaWiki.',
  playerMitigation: 'Mitigation do personagem não modelada (fórmula não documentada publicamente).',
  noShieldBlock:
    'Bloqueio ativo por defense/shielding não modelado no dano recebido (apenas armor e proteções).',
  creatureArmorMissing:
    'Criatura sem armor conhecido no Bestiário: dano físico aplicado sem redução de armor.',
  creatureMitigationApplied:
    'Mitigation da criatura (Bestiário) aplicada como redução linear a todo dano comum.',
  creatureMitigationMissing: 'Criatura sem mitigation conhecida: nenhuma redução extra aplicada.',
  wandFixedRange:
    'Wands/rods: faixa fixa de dano do item; skills e modo de ataque não alteram o auto-attack.',
  elementalWeaponSpells:
    'Spells físicas com arma de dano elemental: usa-se o attack total (físico+elemental) da arma.',
  charmOncePerAttack:
    'Charm ofensivo: uma rolagem por auto-attack; teto de dano aplicado antes de resistências, conforme TibiaWiki.',
  creatureTurn:
    'Dano recebido por "turno" = soma de todos os ataques listados da criatura (simplificação).',
} as const;
