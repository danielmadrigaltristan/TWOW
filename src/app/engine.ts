import {
  ATTRIBUTES,
  shieldLimit,
  Attribute,
  Card,
  ComboEffect,
  Combat,
  Difficulty,
  GameState,
  LABELS,
  SchoolId,
  Terrain,
} from './models';
import { CARD_BY_ID, CARDS, SCHOOLS } from './cards';
import { MUTAGEN_COLORS, MUTAGEN_NAMES, SCHOOL_MUTAGEN_EFFECTS } from './mutagens';
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
export function createGame(
  school: SchoolId = 'wolf',
  difficulty: Difficulty = 'normal',
  bombModule = false,
  random = Math.random,
  available: Record<Attribute, boolean> = { attack: true, defense: true, alchemy: true, special: true },
  mutagenModule = false,
  monsterTrailExpansion = bombModule || mutagenModule,
): GameState {
  const config = {
    easy: { action: [4, 4, 2], challenge: [2, 2, 1] },
    normal: { action: [3, 3, 3], challenge: [3, 3, 0] },
    hard: { action: [2, 2, 2], challenge: [3, 3, 0] },
  }[difficulty];
  const actionDeck: number[] = [],
    challengeDeck: number[] = [],
    trophyReserve: number[] = [];
  for (let level = 1; level <= 3; level++) {
    const generic = shuffle(
      CARDS.filter((c) => c.level === level && c.kind === 'generic').map((c) => c.id),
      random,
    );
    const specific = shuffle(
      CARDS.filter((c) => c.level === level && c.kind !== 'generic').map((c) => c.id),
      random,
    );
    const count = config.action[level - 1]!;
    actionDeck.push(...shuffle([...generic.slice(0, count), ...(specific.length ? [specific[0]!] : [])], random));
    const rest = generic.slice(count),
      needed = config.challenge[level - 1]!;
    challengeDeck.push(...rest.slice(0, needed), ...specific.slice(1));
    if (level === 3) trophyReserve.push(...rest.slice(needed, needed + 3));
  }
  return {
    version: 2,
    notices: [],
    started: true,
    school,
    difficulty,
    bombModule,
    monsterTrailExpansion,
    mutagenModule,
    mutagenLevel: 1,
    mutagens: [],
    turn: 1,
    phase: 0,
    attributes: { attack: 1, defense: 1, alchemy: 1, special: 1 },
    shield: 1,
    potions: 0,
    bombs: 0,
    trophies: 0,
    terrain: 'forest',
    traces: [],
    meditationAvailable: { ...available },
    actionDeck,
    actionDiscard: [],
    challengeDeck: shuffle(challengeDeck, random),
    challengeDiscard: [],
    trophyReserve: shuffle(trophyReserve, random),
    activeCard: null,
    pokerCard: null,
    pokerRolls: 0,
    combat: null,
    turnResolved: false,
    history: ['Partida preparada. El automa juega primero.'],
  };
}
export function log(s: GameState, message: string): void {
  s.history = [message, ...s.history].slice(0, 60);
}
export function monsterTrailActive(s: GameState): boolean {
  return s.monsterTrailExpansion ?? (s.bombModule || !!s.mutagenModule);
}
export function automaLevel(s: GameState): number {
  return Math.min(...ATTRIBUTES.map(a => s.attributes[a]));
}
export function changeAttribute(s: GameState, key: Attribute, delta: number, random = Math.random): void {
  const previousLevel = automaLevel(s);
  const before = s.attributes[key];
  if (before === 5 && delta < 0) return;
  s.attributes[key] = Math.max(1, Math.min(5, before + delta));
  if (key === 'defense')
    s.shield = Math.max(
      0,
      Math.min(shieldLimit(s.attributes.defense), s.shield + s.attributes.defense - before),
    );
  if (s.mutagenModule) {
    const awardedLevel = s.mutagenLevel ?? previousLevel;
    const level = automaLevel(s);
    for (let n = awardedLevel + 1; n <= level; n++) {
      const color = MUTAGEN_COLORS[Math.floor(random() * MUTAGEN_COLORS.length)]!;
      (s.mutagens ??= []).push(color);
      log(s, `Nivel ${n}: gana un mutágeno ${MUTAGEN_NAMES[color]}.`);
    }
    s.mutagenLevel = Math.max(awardedLevel, level);
  }
}
export function applyActions(s: GameState, card: Card): void {
  for (const action of card.actions) {
    if (ATTRIBUTES.includes(action as Attribute)) {
      changeAttribute(s, action as Attribute, 1);
      continue;
    }
    if (action === 'lowest' || action === 'highest') {
      const keys = ATTRIBUTES.filter((k) => s.attributes[k] < 5);
      const sorted = [...keys].sort((a, b) =>
        action === 'lowest' ? s.attributes[a] - s.attributes[b] : s.attributes[b] - s.attributes[a],
      );
      if (sorted[0]) changeAttribute(s, sorted[0], 1);
    }
    if (action === 'potion') s.potions = Math.min(4, s.potions + 1);
    if (action === 'bomb' && s.bombModule) s.bombs = Math.min(4, s.bombs + 1);
    if (action === 'trace' && !s.traces.includes(s.terrain)) s.traces.push(s.terrain);
  }
  log(s, `Fase I: ${card.actions.filter(a => a !== 'bomb' || s.bombModule).map((a) => LABELS[a]).join(' · ')}.`);
}
export function drawAction(s: GameState): void {
  if (s.phase !== 0 || s.trophies >= 4 || s.combat || s.notices.length) return;
  if (!s.actionDeck.length) {
    s.actionDeck = shuffle(s.actionDiscard.filter((id) => CARD_BY_ID[id]!.level === 3));
    s.actionDiscard = s.actionDiscard.filter((id) => CARD_BY_ID[id]!.level !== 3);
    log(s, 'Mazo de acción renovado solo con nivel III.');
  }
  s.activeCard = s.actionDeck.shift() ?? null;
  s.phase = 1;
  s.actionStep = 'movement';
  s.turnResolved = false;
  if (s.activeCard)
    log(s, `Turno ${s.turn}: carta ${s.activeCard}, nivel ${CARD_BY_ID[s.activeCard]!.level}.`);
}
export function confirmMovement(s: GameState): void {
  if (s.phase !== 1 || (s.actionStep ?? 'movement') !== 'movement' || s.combat || s.notices.length || !s.activeCard) return;
  s.actionStep = 'actions';
  log(s, 'Movimiento confirmado.');
}
export function confirmActions(s: GameState): void {
  if (s.phase !== 1 || s.actionStep !== 'actions' || s.combat || s.notices.length || !s.activeCard) return;
  applyActions(s, CARD_BY_ID[s.activeCard]!);
  s.actionStep = 'applied';
}
export function nextPhase(s: GameState): void {
  if (s.notices.length || s.combat || s.activeCard === null || s.trophies >= 4) return;
  if (s.phase === 1) {
    if (s.actionStep !== 'applied') return;
    s.phase = 2;
    delete s.actionStep;
  } else if (s.phase === 2 && s.turnResolved) s.phase = 3;
  else if (s.phase === 3) {
    s.actionDiscard.push(s.activeCard);
    s.activeCard = null;
    s.phase = 0;
    s.turn++;
    log(s, 'Mercado descartado y repuesto. Turno del jugador.');
  }
}
export function gainTrophy(s: GameState): void {
  if (s.trophies >= 4) return;
  s.trophies++;
  if (s.trophies < 4) {
    const id = s.trophyReserve.shift();
    if (id !== undefined) s.challengeDeck = shuffle([...s.challengeDeck, id]);
  }
  log(
    s,
    s.trophies === 4
      ? '¡El automa gana con cuatro trofeos!'
      : `Trofeo ${s.trophies}/4. Añadida carta III a desafío, sin sus descartes.`,
  );
}
export function meditationCandidate(s: GameState): Attribute | undefined {
  return ATTRIBUTES.find((k) => s.attributes[k] === 5 && s.meditationAvailable[k]);
}
export function canFight(s: GameState, card: Card): boolean {
  return (
    !card.condition ||
    (card.condition.operator === 'lt'
      ? s.trophies < card.condition.trophies
      : s.trophies <= card.condition.trophies)
  );
}
export function resolvePhase2(
  s: GameState,
  monster: boolean,
  witcher: boolean,
  health: number,
  opponent: string,
  terrain: Terrain,
  confirmMeditation = false,
  first: 'automa' | 'opponent' = 'automa',
  manualOpponent = false,
): void {
  if (s.notices.length || s.phase !== 2 || s.turnResolved || s.combat || !s.activeCard) return;
  const card = CARD_BY_ID[s.activeCard]!;
  for (const option of card.phase2) {
    if (option === 'meditate') {
      const key = meditationCandidate(s);
      if (key) {
        if (!confirmMeditation) return;
        s.meditationAvailable[key] = false;
        gainTrophy(s);
        s.turnResolved = true;
        log(s, `Meditación: trofeo de ${LABELS[key]}.`);
        return;
      }
    }
    if (
      (option === 'witcher' && witcher) ||
      (option === 'monster' && monster && canFight(s, card))
    ) {
      startCombat(
        s,
        Math.max(1, health),
        opponent,
        option === 'witcher' ? 'witcher' : 'monster',
        terrain,
        option === 'monster' ? 'opponent' : first,
        true,
        manualOpponent,
      );
      return;
    }
  }
  s.turnResolved = true;
  log(s, 'Sin combate ni meditación disponibles. Encuentro terminado.');
}
export function startCombat(
  s: GameState,
  health: number,
  opponent: string,
  kind: 'monster' | 'witcher',
  terrain: Terrain,
  first: 'automa' | 'opponent' = 'automa',
  encounter = false,
  manualOpponent = false,
): void {
  if (s.notices.length || !Number.isInteger(health) || health < 1 || health > 200 || s.combat || s.trophies >= 4) return;
  const traced = kind === 'monster' && s.traces.includes(terrain);
  s.combat = {
    manualOpponent,
    turn: traced ? 'automa' : first,
    encounter,
    lastDamage: 0,
    lastShieldGain: 0,
    lastPotionsSpent: 0,
    lastBombsSpent: 0,
    mutagensSpent: [],
    lastMutagensUsed: [],
    attackReady: true,
    summary: [],
    opponent,
    kind,
    health,
    maxHealth: health,
    deck: shuffle([...s.challengeDeck, ...s.challengeDiscard]),
    discard: [],
    current: null,
    inPlay: [],
    damageInput: 1,
    nextDamage: 0,
    ignoreNext: false,
    ignorePassive: false,
    comboPending: false,
    log: [
      kind === 'monster' && s.traces.includes(terrain)
        ? 'El automa tiene rastro: ataca primero.'
        : kind === 'monster' && first === 'opponent'
          ? 'El monstruo ataca primero: el automa no tiene su rastro.'
          : 'Determina la iniciativa con las reglas del juego.',
    ],
  };
  if (traced) s.traces = s.traces.filter(t => t !== terrain);
  s.challengeDeck = [];
  s.challengeDiscard = [];
  log(s, `Combate contra ${opponent}. Desafío y descarte barajados.`);
}
function combatLog(s: GameState, message: string): void {
  if (s.combat) {
    s.combat.log = [message, ...s.combat.log].slice(0, 40);
    s.combat.summary.push(message);
  }
}
export function applyEffect(s: GameState, e: ComboEffect, potionSpent = false): void {
  const c = s.combat;
  if (!c) return;
  if (e.damage) {
    if (c.turn === 'automa') c.lastDamage += e.damage;
    if (!c.manualOpponent) c.health = Math.max(0, c.health - e.damage);
    combatLog(s, `${e.damage} de daño al oponente.`);
  }
  if (e.shield) s.shield = Math.min(shieldLimit(s.attributes.defense), s.shield + e.shield);
  if (e.maxShield) s.shield = shieldLimit(s.attributes.defense);
  if (e.discard)
    for (let i = 0; i < e.discard; i++) {
      const id = c.deck.shift();
      if (id !== undefined) c.discard.push(id);
    }
  if (e.recover) {
    const recovered: number[] = [];
    for (let i = 0; i < e.recover; i++) {
      const id = c.discard.pop();
      if (id !== undefined) recovered.push(id);
    }
    c.deck = shuffle([...c.deck, ...recovered]);
  }
  if (e.chain) c.comboPending = true;
  if (e.nextDamage) c.nextDamage += e.nextDamage;
  if (e.ignoreNext) c.ignoreNext = true;
  if (e.ignorePassive) c.ignorePassive = true;
  if (e.potions) s.potions = Math.min(4, s.potions + e.potions);
  if (e.potionDamage !== undefined && (potionSpent || s.potions > 0)) {
    if (!potionSpent) {
      s.potions--;
      if (c.turn === 'automa') c.lastPotionsSpent = (c.lastPotionsSpent ?? 0) + 1;
    }
    const damage = e.potionDamage === 0 ? s.shield : e.potionDamage;
    if (c.turn === 'automa') c.lastDamage += damage;
    if (!c.manualOpponent) c.health = Math.max(0, c.health - damage);
    combatLog(s, `Poción: ${damage} de daño.`);
  }
}
export function effectDescription(e: ComboEffect | undefined): string {
  if (!e) return 'Sin efecto adicional.';
  const parts: string[] = [];
  if (e.damage) parts.push(`${e.damage} de daño`);
  if (e.shield) parts.push(`+${e.shield} escudo`);
  if (e.maxShield) parts.push('Escudo al máximo');
  if (e.discard) parts.push(`Descarta ${e.discard} carta(s) sin resolver`);
  if (e.recover) parts.push(`Recupera y baraja ${e.recover} carta(s) del descarte`);
  if (e.chain) parts.push('Juega otro combo');
  if (e.nextDamage) parts.push(`Próximo ataque: +${e.nextDamage} daño`);
  if (e.ignoreNext) parts.push('Ignora el daño del próximo turno rival');
  if (e.ignorePassive) parts.push('Ignora la pasiva del monstruo durante este combate');
  if (e.potions) parts.push(`Gana ${e.potions} poción(es)`);
  if (e.potionDamage !== undefined)
    parts.push(
      e.potionDamage === 0
        ? 'Daño igual al escudo (poción ya consumida)'
        : `${e.potionDamage} de daño (poción ya consumida)`,
    );
  return parts.join(' · ');
}
export function attack(s: GameState): void {
  const c = s.combat;
  if (s.notices.length || !c || c.turn !== 'automa' || !c.attackReady || !c.deck.length || (!c.manualOpponent && c.health <= 0)) return;
  if (!c.comboPending) { c.lastDamage = 0; c.lastShieldGain = 0; c.lastPotionsSpent = 0; c.lastBombsSpent = 0; c.lastMutagensUsed = []; c.summary = []; }
  const shieldBefore = s.shield;
  const id = c.deck.shift()!;
  const card = CARD_BY_ID[id]!;
  c.current = id;
  (c.inPlay ??= []).push(id);
  c.comboPending = false;
  const damage = card.damage + c.nextDamage;
  c.nextDamage = 0;
  c.lastDamage += damage;
  if (!c.manualOpponent) c.health = Math.max(0, c.health - damage);
  s.shield = Math.min(shieldLimit(s.attributes.defense), s.shield + card.shield);
  combatLog(s, `Carta ${id}: ${damage} daño · +${card.shield} escudo.`);
  // Attack cards in play are unavailable to discard recovery until the opponent turn.
  if (card.effect) {
    applyEffect(s, card.effect);
    combatLog(s, effectDescription(card.effect));
  }
  if (card.potion && s.potions > 0) {
    s.potions--;
    c.lastPotionsSpent = (c.lastPotionsSpent ?? 0) + 1;
    applyEffect(s, card.potion, true);
    combatLog(s, `Poción: ${effectDescription(card.potion)}`);
  }
  if (card.bomb && s.bombModule && s.bombs > 0) {
    s.bombs--;
    c.lastBombsSpent = (c.lastBombsSpent ?? 0) + 1;
    applyEffect(s, card.bomb);
    combatLog(s, `Bomba: ${effectDescription(card.bomb)}`);
  }
  if (card.schoolSpecial) {
    const effect = SCHOOLS.find((x) => x.id === s.school)!.specials[card.schoolSpecial - 1]!;
    applyEffect(s, effect);
    combatLog(s, `Especial ${card.schoolSpecial}: ${effectDescription(effect)}`);
  }
  if (s.mutagenModule) {
    const effects = SCHOOL_MUTAGEN_EFFECTS[s.school];
    const spent = c.mutagensSpent ??= [];
    // Each owned token is independent, including duplicates of the same color.
    for (const [index, color] of (s.mutagens ?? []).entries()) {
      const effect = effects?.[color];
      if (!effect || !card.mutagens.includes(color) || spent.includes(index)) continue;
      spent.push(index);
      (c.lastMutagensUsed ??= []).push(index);
      applyEffect(s, effect);
      combatLog(s, `Mutágeno ${MUTAGEN_NAMES[color]} agotado: ${effectDescription(effect)}.`);
    }
  }
  c.lastShieldGain = (c.lastShieldGain ?? 0) + Math.max(0, s.shield - shieldBefore);
  c.attackReady = c.comboPending;
}
export function discardForAbility(s: GameState, amount: number): void {
  const c = s.combat;
  if (!c || s.notices.length || c.damageRemaining !== undefined || combatOutcome(s) || !Number.isFinite(amount) || amount < 1) return;
  const discarded = c.deck.splice(0, Math.min(c.deck.length, Math.trunc(amount)));
  c.discard.push(...discarded);
  combatLog(s, `Efecto del oponente: ${discarded.length} carta(s) descartada(s) sin resolver.`);
}
export function receiveDamage(s: GameState, amount: number): void {
  const c = s.combat;
  if (s.notices.length || !c || c.damageRemaining !== undefined || c.turn !== 'opponent' || c.comboPending || (!c.manualOpponent && c.health <= 0) || !c.deck.length || !Number.isFinite(amount)) return;
  c.summary = [];
  let damage = Math.max(0, Math.min(200, Math.trunc(amount)));
  if (c.ignoreNext) {
    c.ignoreNext = false;
    combatLog(s, 'Daño ignorado por la habilidad de Oso.');
    c.turn = 'automa'; c.attackReady = true;
    return;
  }
  const absorbed = Math.min(s.shield, damage);
  s.shield -= absorbed;
  damage -= absorbed;
  c.damageRevealed = [];
  c.damageCard = null;
  c.damageRemaining = Math.min(damage, c.deck.length);
  combatLog(s, `Daño recibido: ${amount}. Escudo absorbe ${absorbed}; descarta ${c.damageRemaining} carta(s).`);
  continueDamage(s);
}
export function continueDamage(s: GameState): void {
  const c = s.combat;
  if (!c || s.notices.length || c.damageRemaining === undefined) return;
  if (c.damageRemaining > 0 && c.deck.length) {
    const id = c.deck.shift()!;
    c.discard.push(id);
    c.damageCard = id;
    c.damageRevealed = [...(c.damageRevealed ?? []), id];
    c.damageRemaining--;
    combatLog(s, `Carta ${id} revelada y descartada por daño.`);
    const effect = CARD_BY_ID[id]!.onDamage;
    if (effect) {
      applyEffect(s, effect);
      const message = `Al descartar carta ${id} por daño: ${effectDescription(effect)}.`;
      combatLog(s, message);
      s.notices.push({ card: id, message });
    }
    return;
  }
  delete c.damageRemaining;
  c.damageCard = null;
  c.turn = 'automa';
  c.attackReady = true;
  c.lastDamage = 0;
  c.lastShieldGain = 0;
  c.lastPotionsSpent = 0;
  c.lastBombsSpent = 0;
  c.lastMutagensUsed = [];
}
export function declareVictory(s: GameState): void {
  const c = s.combat;
  if (!c || s.notices.length || c.damageRemaining !== undefined) return;
  c.manualOpponent = false;
  c.health = 0;
  log(s, 'Derrota del oponente confirmada en la mesa.');
}
export function combatOutcome(s: GameState): 'win' | 'loss' | null {
  const c = s.combat;
  if (!c || c.damageRemaining !== undefined) return null;
  if (!c.manualOpponent && c.health <= 0) return 'win';
  return c.deck.length === 0 ? 'loss' : null;
}
// Phase-II encounters are initiated by the automa; an external witcher duel is a human challenge.
// Initiative (who takes the first combat turn) does not determine trophy eligibility.
export function combatGrantsTrophy(c: Combat): boolean {
  return c.kind === 'monster' || c.encounter;
}
export function finishCombat(s: GameState): void {
  const c = s.combat,
    outcome = combatOutcome(s);
  if (s.notices.length || !c || !outcome) return;
  s.challengeDeck = shuffle([...c.deck, ...c.discard, ...(c.inPlay ?? [])]);
  s.challengeDiscard = [];
  s.shield = shieldLimit(s.attributes.defense);
  s.combat = null;
  if (outcome === 'win' && combatGrantsTrophy(c)) gainTrophy(s);
  log(
    s,
    outcome === 'win'
      ? combatGrantsTrophy(c)
        ? 'Combate ganado. Aplica en el tablero las recompensas sin oro ni fatiga.'
        : 'Duelo ganado como defensor: sin trofeo ni carta de reserva.'
      : 'Combate perdido. Aplica las consecuencias en el tablero.',
  );
  if (c.encounter && s.phase === 2) s.turnResolved = true;
}
export function drawPoker(s: GameState, newRound = false): void {
  if (s.notices.length || s.combat || s.trophies >= 4) return;
  const previousRolls = s.pokerRolls ?? (s.pokerCard ? 2 : 0);
  const rolls = newRound ? 0 : previousRolls;
  if (rolls >= 2) return;
  if (!s.challengeDeck.length) {
    s.challengeDeck = shuffle(s.challengeDiscard);
    s.challengeDiscard = [];
  }
  const id = s.challengeDeck.shift();
  if (id !== undefined) {
    s.pokerCard = id;
    s.pokerRolls = rolls === 0 ? 1 : 2;
    s.challengeDiscard.push(id);
    log(s, `Póker: carta ${id}, dados ${CARD_BY_ID[id]!.dice.join(' · ')}.`);
  }
}

export function confirmNotice(s: GameState): void {
  const notice = s.notices.shift();
  if (notice?.resource) {
    s[notice.resource] = Math.min(4, s[notice.resource] + 1);
    log(s, `${notice.resource === 'potions' ? 'Poción' : 'Bomba'} confirmada. Marcador: ${s[notice.resource]}/4.`);
  }
}
export function opponentTurn(s: GameState): void {
  const c = s.combat;
  if (!c || s.notices.length || c.turn !== 'automa' || c.attackReady || c.comboPending || combatOutcome(s)) return;
  c.discard.push(...(c.inPlay ?? []));
  c.inPlay = [];
  c.turn = 'opponent';
}
export function pokerHand(dice: readonly number[]): string {
  const counts = [...new Set(dice)].map(d => dice.filter(x => x === d).length).sort((a,b) => b-a);
  if (counts[0] === 5) return 'Repóker';
  if (counts[0] === 4) return 'Póker';
  if (counts[0] === 3 && counts[1] === 2) return 'Full';
  const sorted = [...dice].sort((a,b) => a-b);
  if (counts.length === 5 && sorted[4]! - sorted[0]! === 4) return 'Escalera';
  if (counts[0] === 3) return 'Trío';
  if (counts[0] === 2 && counts[1] === 2) return 'Doble pareja';
  return counts[0] === 2 ? 'Pareja' : 'Sin combinación';
}
