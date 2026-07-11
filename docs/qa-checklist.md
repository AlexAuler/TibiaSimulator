# QA — Roteiro E2E manual (M5)

Rodar com `pnpm dev` em http://localhost:3000. Marcar cada item ao validar.
Testar em desktop (≥1024px) e mobile (~390px).

## 1. Estado inicial (build vazia)

- [ ] Página carrega sem erros no console.
- [ ] Vocação padrão knight, level 8, modo balanceado.
- [ ] Painel Ofensivo mostra estado vazio ("equipe uma arma") — sem NaN.
- [ ] Painel Contra o alvo mostra "escolha uma criatura".
- [ ] Painel Defensivo mostra HP/mana coerentes com level 8 de knight
      (HP 185, mana 90 — fórmula em `src/engine/constants.ts`).
- [ ] Bloco "Premissas do modelo" abre e lista as premissas.

## 2. Personagem (RF1/RF2)

- [ ] Trocar vocação atualiza sprites de outfit e destaca skills relevantes.
- [ ] Trocar para vocação incompatível com item equipado remove o item e
      exibe aviso de remoção.
- [ ] Banner do monk aparece ao selecionar monk (Harmony/Serene fora do MVP).
- [ ] Level aceita apenas inteiros no intervalo permitido; skills idem.
- [ ] Trocar modo de ataque (ofensivo/balanceado/defensivo) muda o DPS.

## 3. Equipamentos (RF3/RF4)

- [ ] Paper doll 3×3 com os 9 slots; clicar abre o picker.
- [ ] Picker filtra por slot, vocação e level; busca por nome funciona;
      navegação por teclado (setas/Enter/Esc) funciona.
- [ ] Equipar arma faz o painel Ofensivo calcular min/avg/max/DPS.
- [ ] Arma de distância sem munição mostra estado "sem munição" (paladin
      com crossbow e sem bolts).
- [ ] Wand/rod calcula pelo damagerange fixo do item.
- [ ] Slots de imbuement respeitam `count` e `allowed` do item; imbuement
      de conversão elemental muda o breakdown por elemento.
- [ ] Desequipar item limpa os imbuements daquele slot.

## 4. Charm e criatura (RF5/RF6)

- [ ] Selecionar charm ofensivo + estágio mostra resumo do efeito.
- [ ] Charm DPS aparece no painel Contra o alvo apenas com criatura
      selecionada.
- [ ] Busca de criatura filtra por nome; card mostra HP, armor, mitigation.
- [ ] Grade de modificadores: verde = toma mais dano (>100%), vermelho =
      resiste (<100%), "imune" = 0%.
- [ ] Ataques da criatura aparecem no painel Defensivo com dano esperado.

## 5. Resultados (RF7/RF8/RF9/RF11)

- [ ] Todos os números têm badge "estimativa" no painel.
- [ ] Tooltips "como foi calculado" abrem por hover E por foco de teclado.
- [ ] Breakdown por elemento soma 100% da barra.
- [ ] Contra o alvo: DPS efetivo ≤ DPS neutro quando a criatura resiste;
      ≥ quando é fraca ao elemento.
- [ ] Hits para matar e tempo estimado coerentes (HP alvo ÷ dano médio).
- [ ] Criatura imune ao elemento do ataque ⇒ DPS efetivo 0, sem divisão
      por zero (hits/tempo mostram "—").

## 6. Permalink e reset (RF10)

- [ ] "Copiar link" copia URL com `?b=`; abrir em aba anônima restaura a
      build inteira (vocação, level, skills, itens, imbuements, charm,
      criatura, spells).
- [ ] Recarregar a página mantém a build (URL sync).
- [ ] URL com `?b=` corrompido não quebra a página (cai na build padrão).
- [ ] Reset pede confirmação e volta ao estado inicial.

## 7. Responsivo e navegação

- [ ] Desktop: 3 colunas visíveis simultaneamente.
- [ ] Mobile: tabs Personagem/Equipamento/Resultados; botão flutuante
      "ver resultados" funciona.
- [ ] Páginas /sobre e /creditos carregam; /creditos tem atribuição
      TibiaWiki (CC BY-SA) e disclaimer CipSoft.
- [ ] Sprite ausente cai no fallback (caixa com inicial), sem imagem
      quebrada.

## 8. Performance

- [ ] Lighthouse desktop (produção, `pnpm build && pnpm start`):
      performance ≥ 90.
- [ ] Digitar level/skill não trava a UI (simulação recalcula suave).
