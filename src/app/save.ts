import { GameState, shieldLimit } from './models';
import { SCHOOLS } from './cards';
import { MUTAGEN_COLORS } from './mutagens';
// The save is a public file format: reject unknown cards and invalid counters before applying it.
export function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const s = value as GameState;
  const integer = (v: unknown, min: number, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
  const ids = (v: unknown) => Array.isArray(v) && v.every((id) => integer(id, 1, 27));
  const nullableId = (v: unknown) => v === null || integer(v, 1, 27);
  const strings = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string');
  if (
    s.version !== 2 ||
    s.started !== true ||
    !SCHOOLS.some((x) => x.id === s.school) ||
    !['easy', 'normal', 'hard'].includes(s.difficulty) ||
    !integer(s.turn, 1, 100000) ||
    !integer(s.phase, 0, 3) ||
    (s.actionStep !== undefined && (s.phase !== 1 || !['movement', 'actions', 'applied'].includes(s.actionStep)))
  )
    return false;
  if (
    !s.attributes ||
    !['attack', 'defense', 'alchemy', 'special'].every((k) =>
      integer(s.attributes[k as keyof typeof s.attributes], 1, 5),
    )
  )
    return false;
  if (
    !integer(s.shield, 0, shieldLimit(s.attributes.defense)) ||
    !integer(s.potions, 0, 4) ||
    !integer(s.bombs, 0, 4) ||
    !integer(s.trophies, 0, 4) ||
    typeof s.bombModule !== 'boolean' ||
    (s.monsterTrailExpansion !== undefined && typeof s.monsterTrailExpansion !== 'boolean')
  )
    return false;
  if (
    (s.mutagenModule !== undefined && typeof s.mutagenModule !== 'boolean') ||
    (s.mutagenLevel !== undefined && !integer(s.mutagenLevel, 1, 5)) ||
    (s.mutagens !== undefined && (!Array.isArray(s.mutagens) || s.mutagens.length > 4 || s.mutagens.some(color => !MUTAGEN_COLORS.includes(color)))) ||
    (s.mutagenModule && (!Array.isArray(s.mutagens) || !integer(s.mutagenLevel, 1, 5) || s.mutagens.length !== s.mutagenLevel! - 1)) ||
    (!s.mutagenModule && !!s.mutagens?.length)
  ) return false;
  if (
    !['forest', 'mountain', 'water'].includes(s.terrain) ||
    !Array.isArray(s.traces) ||
    s.traces.some((t) => !['forest', 'mountain', 'water'].includes(t)) ||
    new Set(s.traces).size !== s.traces.length
  )
    return false;
  if (
    !s.meditationAvailable ||
    !['attack', 'defense', 'alchemy', 'special'].every(
      (k) => typeof s.meditationAvailable[k as keyof typeof s.meditationAvailable] === 'boolean',
    )
  )
    return false;
  if (
    ![s.actionDeck, s.actionDiscard, s.challengeDeck, s.challengeDiscard, s.trophyReserve].every(
      ids,
    ) ||
    !nullableId(s.activeCard) ||
    !nullableId(s.pokerCard) ||
    (s.pokerRolls !== undefined && (!integer(s.pokerRolls, 0, 2) || (s.pokerRolls > 0 && s.pokerCard === null))) ||
    typeof s.turnResolved !== 'boolean' ||
    !strings(s.history)
  )
    return false;
  if ((s.phase === 0) !== (s.activeCard === null)) return false;
  if (!Array.isArray(s.notices) || s.notices.some(n =>
    !n || !integer(n.card, 1, 27) || typeof n.message !== 'string' ||
    (n.resource !== undefined && !['potions', 'bombs'].includes(n.resource)) ||
    (n.resource === 'bombs' && !s.bombModule))) return false;
  const c = s.combat;
  if (c !== null) {
    if (
      !c ||
      typeof c.opponent !== 'string' ||
      !Array.isArray(c.discard) ||
      (c.manualOpponent !== undefined && typeof c.manualOpponent !== 'boolean') ||
      (c.damageRemaining !== undefined && (!integer(c.damageRemaining, 0, 200) || c.turn !== 'opponent')) ||
      (c.damageCard !== undefined && (!nullableId(c.damageCard) || (c.damageCard !== null && !c.discard?.includes(c.damageCard)))) ||
      (c.damageRevealed !== undefined && (!ids(c.damageRevealed) || new Set(c.damageRevealed).size !== c.damageRevealed.length)) ||
      !['automa', 'opponent'].includes(c.turn) ||
      typeof c.encounter !== 'boolean' ||
      !integer(c.lastDamage, 0, 10000) ||
      (c.lastShieldGain !== undefined && !integer(c.lastShieldGain, 0, 4)) ||
      (c.lastPotionsSpent !== undefined && !integer(c.lastPotionsSpent, 0, 200)) ||
      (c.lastBombsSpent !== undefined && !integer(c.lastBombsSpent, 0, 200)) ||
      typeof c.attackReady !== 'boolean' ||
      !strings(c.summary) ||
      (c.mutagensSpent !== undefined && (!Array.isArray(c.mutagensSpent) || c.mutagensSpent.some(i => !integer(i, 0, (s.mutagens?.length ?? 0) - 1)) || new Set(c.mutagensSpent).size !== c.mutagensSpent.length)) ||
      (c.lastMutagensUsed !== undefined && (!Array.isArray(c.lastMutagensUsed) || c.lastMutagensUsed.some(i => !c.mutagensSpent?.includes(i)) || new Set(c.lastMutagensUsed).size !== c.lastMutagensUsed.length)) ||
      (c.turn === 'opponent' && c.comboPending) ||
      !['monster', 'witcher'].includes(c.kind) ||
      !integer(c.maxHealth, 1, 200) ||
      !integer(c.health, 0, c.maxHealth) ||
      !ids(c.deck) ||
      !ids(c.discard) ||
      (c.inPlay !== undefined && (!ids(c.inPlay) || (c.turn !== 'automa' && c.inPlay.length > 0))) ||
      !nullableId(c.current) ||
      !integer(c.damageInput, 0, 200) ||
      !integer(c.nextDamage, 0, 200) ||
      typeof c.ignoreNext !== 'boolean' ||
      typeof c.ignorePassive !== 'boolean' ||
      typeof c.comboPending !== 'boolean' ||
      !strings(c.log)
    )
      return false;
  }
  // Every owned card has one physical location; current is only a display reference.
  const owned = [
    ...s.actionDeck,
    ...s.actionDiscard,
    ...s.challengeDeck,
    ...s.challengeDiscard,
    ...s.trophyReserve,
    ...(s.activeCard ? [s.activeCard] : []),
    ...(c ? [...c.deck, ...c.discard, ...(c.inPlay ?? [])] : []),
  ];
  return new Set(owned).size === owned.length && s.trophyReserve.length <= 3 && s.trophyReserve.every(id => id >= 13 && id <= 18);
}

// Preserve legacy v2 games, including resources that previously waited for confirmation.
export function normalizeGameState(value: unknown): GameState | null {
  let normalized: GameState;
  if (isGameState(value)) normalized = value;
  else {
    if (!value || typeof value !== 'object') return null;
    const legacy = value as Partial<GameState>;
    if (legacy.version !== 2 || legacy.shield !== 5 || legacy.attributes?.defense !== 5) return null;
    const adjusted = { ...legacy, shield: 4 };
    if (!isGameState(adjusted)) return null;
    normalized = adjusted;
  }
  normalized = {
    ...normalized,
    monsterTrailExpansion: normalized.monsterTrailExpansion ?? (normalized.bombModule || !!normalized.mutagenModule),
    mutagenModule: normalized.mutagenModule ?? false,
    mutagenLevel: normalized.mutagenLevel ?? 1,
    mutagens: normalized.mutagens ?? [],
  };
  const combat = normalized.combat;
  if (combat && combat.inPlay === undefined) {
    // Older v2 saves placed the displayed attack directly in discard.
    const pending = combat.turn === 'automa' && (!combat.attackReady || combat.comboPending) && combat.current !== null && combat.discard.includes(combat.current)
      ? [combat.current] : [];
    normalized = { ...normalized, combat: { ...combat, inPlay: pending, discard: combat.discard.filter(id => !pending.includes(id)) } };
  }
  const pendingPotions = normalized.notices.filter(n => n.resource === 'potions').length;
  const pendingBombs = normalized.notices.filter(n => n.resource === 'bombs').length;
  return pendingPotions || pendingBombs ? {
    ...normalized,
    potions: Math.min(4, normalized.potions + pendingPotions),
    bombs: Math.min(4, normalized.bombs + pendingBombs),
    notices: normalized.notices.filter(n => !n.resource),
  } : normalized;
}
