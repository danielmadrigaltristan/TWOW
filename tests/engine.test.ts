import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../src/app/engine';
import { CARDS, CARD_BY_ID, SCHOOLS } from '../src/app/cards';
import { isGameState, normalizeGameState } from '../src/app/save';
import { Difficulty, GameState, MutagenColor, SchoolId } from '../src/app/models';
const deterministic = () => 0.42;
function ready(): GameState {
  return e.createGame('wolf', 'normal', false, deterministic);
}
function battle(ids: number[], health = 20): GameState {
  const s = ready();
  e.startCombat(s, health, 'Grifo', 'monster', 'forest');
  s.combat!.deck = [...ids];
  s.combat!.discard = [];
  return s;
}
function hitFully(s: GameState, damage: number): void {
  e.receiveDamage(s, damage);
  while (s.combat?.damageRemaining !== undefined) {
    while (s.notices.length) e.confirmNotice(s);
    e.continueDamage(s);
  }
}
for (const [difficulty, action, challenge] of [
  ['easy', 13, 11],
  ['normal', 12, 12],
  ['hard', 9, 12],
] as [Difficulty, number, number][]) {
  test(`${difficulty}: correct composition, three reserved cards and unique ownership`, () => {
    for (let iteration = 0; iteration < 30; iteration++) {
      const s = e.createGame('wolf', difficulty);
      assert.equal(s.actionDeck.length, action);
      assert.equal(s.challengeDeck.length, challenge);
      assert.equal(s.trophyReserve.length, 3);
      assert.ok(s.trophyReserve.every((id) => CARD_BY_ID[id]!.level === 3));
      assert.ok(isGameState(s));
      const levels = s.actionDeck.map((id) => CARD_BY_ID[id]!.level);
      assert.deepEqual(levels, [...levels].sort());
      for (const level of [1, 2, 3])
        assert.equal(
          s.actionDeck.filter(
            (id) => CARD_BY_ID[id]!.level === level && CARD_BY_ID[id]!.kind !== 'generic',
          ).length,
          1,
        );
    }
  });
}
test('27 base cards and seven complete school profiles', () => {
  assert.equal(CARDS.length, 27);
  assert.equal(new Set(CARDS.map((c) => c.id)).size, 27);
  assert.equal(CARDS.filter((c) => c.kind === 'specific').length, 6);
  assert.equal(SCHOOLS.length, 7);
  assert.ok(SCHOOLS.every((s) => s.specials.length === 3));
});
test('phase actions apply once and cannot skip an unresolved encounter', () => {
  const s = ready();
  s.actionDeck = [3, ...s.actionDeck.filter((i) => i !== 3)];
  e.drawAction(s);
  assert.equal(s.phase, 1);
  assert.equal(s.attributes.attack, 1);
  e.nextPhase(s); assert.equal(s.phase, 1); assert.equal(s.attributes.attack, 1);
  e.confirmMovement(s); assert.equal(s.actionStep, 'actions');
  e.confirmActions(s); assert.equal(s.actionStep, 'applied');
  e.nextPhase(s);
  assert.equal(s.attributes.attack, 2);
  assert.equal(s.attributes.defense, 2);
  assert.equal(s.shield, 2);
  e.nextPhase(s);
  assert.equal(s.phase, 2);
  assert.equal(s.attributes.defense, 2);
  e.resolvePhase2(s, false, false, 12, 'Grifo', 'forest');
  e.nextPhase(s);
  assert.equal(s.phase, 3);
  e.nextPhase(s);
  assert.equal(s.phase, 0);
  assert.equal(s.turn, 2);
  assert.ok(s.actionDiscard.includes(3));
});
test('action deck recycles level III only', () => {
  const s = ready();
  s.actionDeck = [];
  s.actionDiscard = [1, 7, 13, 26];
  e.drawAction(s);
  assert.equal(CARD_BY_ID[s.activeCard!]!.level, 3);
  assert.deepEqual(s.actionDiscard, [1, 7]);
  assert.equal(s.actionDeck.length, 1);
});
test('attributes lock at five; defense updates and caps shield', () => {
  const s = ready();
  e.changeAttribute(s, 'defense', 10);
  assert.equal(s.attributes.defense, 5);
  assert.equal(s.shield, 4);
  e.changeAttribute(s, 'defense', -1);
  assert.equal(s.attributes.defense, 5);
  s.attributes.defense = 3;
  s.shield = 1;
  e.changeAttribute(s, 'defense', -1);
  assert.equal(s.attributes.defense, 2);
  assert.equal(s.shield, 0);
});
test('alchemy never grants potion, consumables cap at four and bombs require module', () => {
  const s = ready();
  s.potions = 4;
  e.applyActions(s, { ...CARD_BY_ID[1]!, actions: ['alchemy', 'potion', 'bomb'] });
  assert.equal(s.attributes.alchemy, 2);
  assert.equal(s.potions, 4);
  assert.equal(s.bombs, 0);
  assert.doesNotMatch(s.history[0]!, /bomba/i);
  s.bombModule = true;
  e.applyActions(s, { ...CARD_BY_ID[1]!, actions: ['bomb'] });
  assert.equal(s.bombs, 1);
  assert.match(s.history[0]!, /bomba/i);
  assert.deepEqual(s.notices, []);
});
test('attribute tie uses board order and skips maximum', () => {
  const s = ready();
  s.attributes.attack = 5;
  e.applyActions(s, { ...CARD_BY_ID[1]!, actions: ['highest'] });
  assert.equal(s.attributes.defense, 2);
  assert.equal(s.attributes.attack, 5);
});
test('traces are unique and follow confirmed terrain', () => {
  const s = ready();
  s.terrain = 'water';
  e.applyActions(s, { ...CARD_BY_ID[1]!, actions: ['trace', 'trace'] });
  assert.deepEqual(s.traces, ['water']);
});
test('trophy adds one reserved card without shuffling challenge discards', () => {
  const s = ready();
  s.challengeDiscard = [s.challengeDeck.shift()!];
  const discarded = [...s.challengeDiscard],
    size = s.challengeDeck.length;
  e.gainTrophy(s);
  assert.equal(s.trophies, 1);
  assert.equal(s.challengeDeck.length, size + 1);
  assert.deepEqual(s.challengeDiscard, discarded);
  assert.equal(s.trophyReserve.length, 2);
  assert.ok(isGameState(s));
});
test('fourth trophy is terminal and does not need a fourth reserve card', () => {
  const s = ready();
  for (let n = 0; n < 4; n++) e.gainTrophy(s);
  assert.equal(s.trophies, 4);
  assert.equal(s.trophyReserve.length, 0);
  e.drawAction(s);
  assert.equal(s.activeCard, null);
  e.gainTrophy(s);
  assert.equal(s.trophies, 4);
});
test('meditation prioritizes available leftmost maximum and can win the game', () => {
  const s = ready();
  s.phase = 2;
  s.activeCard = 15;
  s.attributes.attack = 5;
  s.attributes.defense = 5;
  s.meditationAvailable.attack = false;
  s.trophies = 3;
  e.resolvePhase2(s, true, false, 12, 'Grifo', 'forest', true);
  assert.equal(s.trophies, 4);
  assert.equal(s.meditationAvailable.defense, false);
  assert.equal(s.combat, null);
});
test('Word cards 1–6 only fight monsters with zero trophies', () => {
  const s = ready();
  s.trophies = 1;
  assert.equal(e.canFight(s, CARD_BY_ID[1]!), false);
  assert.equal(e.canFight(s, CARD_BY_ID[4]!), false);
});
test('witcher priority is independent from monster trophy condition', () => {
  const s = ready();
  s.phase = 2;
  s.activeCard = 8;
  s.trophies = 3;
  e.resolvePhase2(s, true, true, 12, 'Jugador', 'forest');
  assert.equal(s.combat!.kind, 'witcher');
});
test('combat combines challenge and discards without losing cards', () => {
  const s = ready();
  s.challengeDiscard.push(s.challengeDeck.shift()!);
  const count = s.challengeDeck.length + s.challengeDiscard.length;
  e.startCombat(s, 12, 'Grifo', 'monster', 'forest');
  assert.equal(s.combat!.deck.length, count);
  assert.equal(s.challengeDeck.length, 0);
  assert.equal(s.challengeDiscard.length, 0);
  assert.ok(isGameState(s));
});
test('damage is absorbed by shield before life and triggers each discarded card', () => {
  const s = battle([19, 22, 1, 2], 10);
  s.shield = 2;
  s.combat!.turn = 'opponent';
  hitFully(s, 4);
  assert.equal(s.shield, 0);
  assert.equal(s.combat!.health, 6);
  assert.deepEqual(s.combat!.discard, [19, 22]);
  assert.equal(s.combat!.deck.length, 2);
});
test('on-damage shield restoration triggers and respects defense limit', () => {
  const s = battle([3, 1]);
  s.attributes.defense = 3;
  s.shield = 0;
  s.combat!.turn = 'opponent';
  hitFully(s, 1);
  assert.equal(s.shield, 3);
  assert.deepEqual(s.combat!.discard, [3]);
});
test('combat effects cap shield, spend potion only if held and chain correctly', () => {
  const s = battle([7, 24, 1]);
  s.potions = 1;
  e.attack(s);
  assert.equal(s.combat!.health, 16);
  assert.equal(s.potions, 0);
  e.opponentTurn(s);
  hitFully(s, 0);
  e.attack(s);
  assert.equal(s.combat!.comboPending, true);
  assert.equal(s.shield, 1);
});
test('card12 spends a bomb, adds damage and discards without effects', () => {
  const s = battle([12, 19, 2]);
  s.potions = 1;
  s.bombModule = true;
  s.bombs = 1;
  e.attack(s);
  assert.equal(s.potions, 1);
  assert.equal(s.bombs, 0);
  assert.equal(s.combat!.lastBombsSpent, 1);
  assert.equal(s.combat!.health, 15);
  assert.deepEqual(s.combat!.discard, [19]);
  assert.deepEqual(s.combat!.inPlay, [12]);
  assert.equal(s.notices.length, 0);
});
test('bomb chain only applies with active module and a bomb', () => {
  for (const enabled of [false, true]) {
    const s = battle([16, 1, 2]);
    s.bombModule = enabled;
    s.bombs = 1;
    e.attack(s);
    assert.equal(s.combat!.comboPending, enabled);
    assert.equal(s.bombs, enabled ? 0 : 1);
  }
});
test('recovery uses earlier discard, not the currently played combo', () => {
  const s = battle([13, 2, 4]);
  s.potions = 1;
  s.combat!.discard = [1];
  e.attack(s);
  assert.equal(s.combat!.deck.length, 3);
  assert.deepEqual(s.combat!.discard, []);
  assert.deepEqual(s.combat!.inPlay, [13]);
});
test('school-specific card activates school profile; bear ignores next incoming damage', () => {
  const s = battle([27, 1, 2]);
  s.school = 'bear';
  e.attack(s);
  assert.equal(s.combat!.ignoreNext, true);
  e.opponentTurn(s);
  hitFully(s, 10);
  assert.equal(s.combat!.ignoreNext, false);
  assert.equal(s.combat!.deck.length, 2);
});
test('final attacking card can win, otherwise exhausted deck loses', () => {
  const s = battle([1], 2);
  e.attack(s);
  assert.equal(e.combatOutcome(s), 'win');
  const b = battle([1], 10);
  e.attack(b);
  assert.equal(e.combatOutcome(b), 'loss');
});
test('combat cleanup restores shield and all cards to challenge, then gains trophy', () => {
  const s = ready();
  const count = s.challengeDeck.length;
  e.startCombat(s, 1, 'Grifo', 'monster', 'forest');
  s.shield = 0;
  e.attack(s);
  while (!e.combatOutcome(s)) {
    if (s.combat!.turn === 'opponent') hitFully(s, 0);
    else if (s.combat!.attackReady) e.attack(s);
    else e.opponentTurn(s);
    while (s.notices.length) e.confirmNotice(s);
  }
  const outcome = e.combatOutcome(s);
  e.finishCombat(s);
  assert.equal(s.combat, null);
  assert.equal(s.shield, s.attributes.defense);
  assert.equal(s.challengeDeck.length, count + (outcome === 'win' ? 1 : 0));
  assert.ok(isGameState(s));
});
test('poker and combat share exactly the same challenge cards and discards', () => {
  const s = ready();
  const initial = [...s.challengeDeck];
  e.drawPoker(s);
  e.drawPoker(s);
  assert.deepEqual(s.challengeDeck, initial.slice(2));
  assert.deepEqual(s.challengeDiscard, initial.slice(0, 2));
  e.startCombat(s, 1, 'Rival', 'witcher', 'forest');
  assert.deepEqual([...s.combat!.deck].sort((a, b) => a - b), [...initial].sort((a, b) => a - b));
  assert.equal(s.challengeDeck.length, 0);
  assert.equal(s.challengeDiscard.length, 0);
  const duringCombat = structuredClone(s);
  e.drawPoker(s);
  assert.deepEqual(s, duringCombat);
  e.declareVictory(s);
  e.finishCombat(s);
  assert.ok(initial.every(id => s.challengeDeck.includes(id)));
  const nextCard = s.challengeDeck[0]!;
  e.drawPoker(s, true);
  assert.equal(s.pokerCard, nextCard);
  assert.deepEqual(s.challengeDiscard, [nextCard]);
  assert.ok(isGameState(s));
});
test('poker does not recycle until empty', () => {
  const s = ready();
  const n = s.challengeDeck.length;
  e.drawPoker(s);
  e.drawPoker(s);
  assert.equal(s.challengeDeck.length, n - 2);
  assert.equal(s.challengeDiscard.length, 2);
  while (s.challengeDeck.length) e.drawPoker(s, true);
  e.drawPoker(s, true);
  assert.equal(s.challengeDeck.length, n - 1);
  assert.equal(s.challengeDiscard.length, 1);
});
test('poker rounds stop after two cards and a new round draws from the remaining deck', () => {
  const s = ready();
  const initial = [...s.challengeDeck];
  e.drawPoker(s, true);
  assert.equal(s.pokerRolls, 1);
  assert.equal(s.pokerCard, initial[0]);
  e.drawPoker(s);
  assert.equal(s.pokerRolls, 2);
  assert.equal(s.pokerCard, initial[1]);
  const before = structuredClone(s);
  e.drawPoker(s);
  assert.deepEqual(s, before);
  const restored = JSON.parse(JSON.stringify(s)) as GameState;
  assert.ok(isGameState(restored));
  e.drawPoker(restored);
  assert.deepEqual(restored, before);
  e.drawPoker(restored, true);
  assert.equal(restored.pokerRolls, 1);
  assert.equal(restored.pokerCard, initial[2]);
  assert.deepEqual(restored.challengeDiscard, initial.slice(0, 3));
});
test('poker resumes its second roll after save and legacy results require a new round', () => {
  const s = ready();
  e.drawPoker(s, true);
  const restored = JSON.parse(JSON.stringify(s)) as GameState;
  e.drawPoker(restored);
  assert.equal(restored.pokerRolls, 2);
  assert.equal(restored.challengeDiscard.length, 2);
  delete restored.pokerRolls;
  assert.ok(isGameState(restored));
  const before = structuredClone(restored);
  e.drawPoker(restored);
  assert.deepEqual(restored, before);
  e.drawPoker(restored, true);
  assert.equal(restored.pokerRolls, 1);
  assert.equal(isGameState({ ...restored, pokerRolls: 3 }), false);
  assert.equal(isGameState({ ...restored, pokerRolls: 1.5 }), false);
});
test('new poker rounds remain blocked during combat, notices or game end', () => {
  for (const blocked of ['combat', 'notices', 'victory']) {
    const s = ready();
    if (blocked === 'combat') e.startCombat(s, 20, 'Rival', 'witcher', 'forest');
    if (blocked === 'notices') s.notices.push({ card: 1, message: 'Pendiente' });
    if (blocked === 'victory') s.trophies = 4;
    const before = structuredClone(s);
    e.drawPoker(s, true);
    assert.deepEqual(s, before);
  }
});
test('save validation rejects corrupt counter, missing combat, expansion and duplicate ownership', () => {
  const s = ready();
  assert.ok(isGameState(JSON.parse(JSON.stringify(s))));
  assert.equal(isGameState({ ...s, potions: 5 }), false);
  assert.equal(isGameState({ ...s, combat: undefined }), false);
  assert.equal(isGameState({ ...s, actionDeck: [99] }), false);
  assert.equal(isGameState({ ...s, actionDeck: [s.challengeDeck[0]] }), false);
  assert.equal(isGameState({ ...s, phase: 2 }), false);
});
test('long sessions preserve card ownership through recycling and poker', () => {
  for (const d of ['easy', 'normal', 'hard'] as Difficulty[]) {
    const s = e.createGame('wolf', d);
    for (let t = 0; t < 70; t++) {
      e.drawAction(s);
      e.confirmMovement(s); e.confirmActions(s);
      e.nextPhase(s);
      while (s.notices.length) e.confirmNotice(s);
      e.resolvePhase2(s, false, false, 12, 'Monstruo', 'forest');
      e.nextPhase(s);
      e.nextPhase(s);
      e.drawPoker(s, true);
      assert.ok(isGameState(s), `Invalid state in ${d} turn ${t}`);
    }
  }
});

test('Word effect mapping and retained school profiles', () => {
  assert.deepEqual(CARD_BY_ID[9]!.effect, { discard: 1 });
  assert.deepEqual(CARD_BY_ID[14]!.effect, { discard: 1 });
  assert.deepEqual(CARD_BY_ID[24]!.effect, { chain: true });
  assert.deepEqual(CARD_BY_ID[11]!.bomb, { chain: true });
  assert.deepEqual(CARD_BY_ID[16]!.bomb, { chain: true });
  assert.deepEqual(CARD_BY_ID[13]!.potion, { recover: 1 });
  assert.deepEqual(SCHOOLS.find((s) => s.id === 'wolf')!.specials[2], {
    damage: 3,
    shield: 1,
    recover: 1,
  });
  assert.deepEqual(SCHOOLS.find((s) => s.id === 'cat')!.specials[0], {
    damage: 1,
    shield: 1,
    chain: true,
    recover: 1,
  });
  for (const school of ['cat', 'viper', 'ciri'])
    assert.ok(SCHOOLS.find((s) => s.id === school)!.specials[school === 'viper' ? 1 : 0]!.chain);
});

test('destination tie-break arrows follow Word (including cards8,13,25,27)', () => {
  assert.deepEqual(CARDS.filter(c => c.direction === 'up').map(c => c.id), [1,3,5,7,9,11,13,15,17,20,22,24]);
});

const wordDamage = [2,2,1,3,2,3,2,3,5,2,3,3,3,6,3,4,3,0,3,1,2,3,5,2,0,0,0];
const wordShield = [0,0,2,0,1,0,0,0,0,2,0,0,2,0,1,0,0,3,0,2,1,1,0,2,0,0,0];
const wordDice = [
  [1,2,3,4,4], [5,3,3,4,4], [1,5,2,2,2], [1,2,3,4,6], [6,6,3,3,3], [1,3,4,4,4],
  [1,2,3,4,5], [1,3,4,4,4], [5,3,3,3,3], [1,1,1,2,2], [1,6,3,5,5], [4,2,2,5,5],
  [2,3,4,5,6], [1,1,1,1,1], [3,1,1,6,6], [2,2,5,5,5], [1,2,3,3,3], [4,6,1,3,3],
  [1,6,6,5,5], [4,2,6,6,6], [1,2,3,5,5], [2,3,4,5,6], [1,2,2,5,5], [3,1,1,6,6],
  [2,3,4,5,6], [5,5,6,6,6], [4,6,6,6,6],
];
test('all 27 damage, shield and poker values match Word', () => {
  assert.deepEqual(CARDS.map(c => c.damage), wordDamage);
  assert.deepEqual(CARDS.map(c => c.shield), wordShield);
  assert.deepEqual(CARDS.map(c => c.dice), wordDice);
  assert.deepEqual(CARDS.filter(c => c.onDamage).map(c => c.id), [3,5,19,22]);
  assert.deepEqual(CARD_BY_ID[21]!.effect, { discard: 2 });
  assert.deepEqual(CARD_BY_ID[15]!.actions, ['defense','highest','potion']);
  assert.deepEqual(CARD_BY_ID[8]!.market, [1]);
});
test('original regulation deck composition preserves three generic levelIII reserve cards', () => {
  for (const difficulty of ['easy','normal','hard'] as Difficulty[]) {
    const s = e.createGame('wolf', difficulty);
    assert.equal(s.trophyReserve.length, 3);
    assert.ok(s.trophyReserve.every(id => id >= 13 && id <= 18));
    for (const id of [25,26,27]) assert.ok([...s.actionDeck,...s.challengeDeck].includes(id));
    const reserved = [...s.trophyReserve];
    for (const id of reserved) { e.gainTrophy(s); assert.ok(s.challengeDeck.includes(id)); }
    assert.ok(isGameState(s));
  }
});
test('selected trophies are cloned and meditation requires level5 plus availability and confirmation', () => {
  const available = { attack: false, defense: true, alchemy: false, special: false };
  const s = e.createGame('wolf','normal',false, deterministic, available);
  available.attack = true;
  s.phase = 2; s.activeCard = 15;
  s.attributes.attack = 5;
  assert.equal(e.meditationCandidate(s), undefined);
  s.attributes.defense = 5;
  const before = structuredClone(s);
  e.resolvePhase2(s, true, false, 12, 'Grifo','forest');
  assert.deepEqual(s, before);
  e.resolvePhase2(s, true, false, 12, 'Grifo','forest', true);
  assert.equal(s.trophies, 1);
  assert.equal(s.meditationAvailable.defense, false);
  assert.equal(s.combat, null);
  assert.equal(s.trophyReserve.length, 2);
});
test('movement grants potions immediately without confirmation or blocked progression', () => {
  const s = ready();
  const id = s.actionDeck[0]!;
  s.actionDeck[0] = 11;
  // Use a legal complete state by moving the old card to the location of 11.
  const decks = [s.actionDeck, s.challengeDeck];
  for (const deck of decks) for (let i=1;i<deck.length;i++) if (deck[i] === 11) deck[i] = id;
  e.drawAction(s); e.confirmMovement(s); e.confirmActions(s); e.nextPhase(s);
  assert.equal(s.potions, 2);
  assert.equal(s.notices.length, 0);
  const restored = JSON.parse(JSON.stringify(s));
  assert.ok(isGameState(restored));
  e.resolvePhase2(s, false, false, 12, 'Grifo','forest');
  assert.equal(s.turnResolved, true);
  e.confirmNotice(s); assert.equal(s.potions, 2);
});
test('automatic potion gains cap at four and ignore disabled bombs', () => {
  const s = ready(); s.potions = 3;
  e.applyActions(s, CARD_BY_ID[11]!);
  assert.equal(s.notices.length, 0);
  assert.equal(s.potions, 4);
  e.applyActions(s, CARD_BY_ID[11]!); assert.equal(s.notices.length, 0);
  e.applyActions(s, CARD_BY_ID[2]!); assert.equal(s.notices.length, 0);
});
test('monster trace grants initiative and is consumed; witcher duel preserves traces', () => {
  for (const kind of ['monster','witcher'] as const) {
    const s = ready(); s.traces = ['forest','water'];
    e.startCombat(s, 20, 'Rival', kind, 'forest','opponent');
    assert.equal(s.combat!.turn, kind === 'monster' ? 'automa' : 'opponent');
    assert.deepEqual(s.traces, kind === 'monster' ? ['water'] : ['forest','water']);
  }
});
test('turn guards block repeated attacks and opponent damage during additional combo', () => {
  const s = battle([24, 1, 2, 4]);
  e.attack(s); assert.equal(s.combat!.lastDamage, 2);
  const before = structuredClone(s);
  e.opponentTurn(s); hitFully(s, 10); assert.deepEqual(s, before);
  e.attack(s); assert.equal(s.combat!.lastDamage, 4);
  const count = s.combat!.deck.length;
  e.attack(s); assert.equal(s.combat!.deck.length, count);
  e.opponentTurn(s); assert.equal(s.combat!.turn, 'opponent');
  e.attack(s); assert.equal(s.combat!.deck.length, count);
  hitFully(s, 0); assert.equal(s.combat!.turn, 'automa');
});
test('damage summary includes potion and final blow without capping the shown attack', () => {
  const s = battle([7, 1], 1); s.potions = 1;
  e.attack(s);
  assert.equal(s.combat!.lastDamage, 4);
  assert.equal(s.combat!.health, 0);
});
test('shield damage potion consumes exactly one even when only one remains', () => {
  const s = battle([18, 1]); s.attributes.defense = 4; s.shield = 1; s.potions = 1;
  e.attack(s);
  assert.equal(s.potions, 0); assert.equal(s.combat!.lastDamage, 4);
  assert.equal(s.combat!.health, 16);
});
test('each reactive card fires once during its own reveal', () => {
  const s = battle([19,22,1]); s.shield = 0; s.combat!.turn = 'opponent';
  e.receiveDamage(s, 2);
  for (const [id, health] of [[19,18],[22,16]]) {
    assert.equal(s.combat!.damageCard,id);
    assert.equal(s.combat!.health,health);
    assert.equal(s.notices[0]!.card,id);
    e.confirmNotice(s);
    assert.equal(s.combat!.health,health);
    e.continueDamage(s);
  }
  assert.equal(s.combat!.health,16);
  assert.equal(s.combat!.turn,'automa');
});
test('card24 discarded for damage has no effect', () => {
  const s = battle([24,1]); s.shield = 0; s.combat!.turn = 'opponent';
  e.receiveDamage(s, 1);
  assert.equal(s.combat!.damageCard,24);
  assert.deepEqual(s.combat!.discard, [24]);
  assert.equal(s.combat!.health,20);
  assert.equal(s.shield,0);
  assert.equal(s.notices.length,0);
  assert.equal(s.combat!.comboPending,false);
  e.continueDamage(s);
  assert.equal(s.combat!.turn,'automa');
});
test('card21 discards twice without damage triggers', () => {
  const s = battle([21,19,24,1]); e.attack(s);
  assert.deepEqual(s.combat!.discard, [19,24]);
  assert.deepEqual(s.combat!.inPlay, [21]);
  assert.equal(s.combat!.health, 18);
  assert.equal(s.notices.length, 0);
});
test('external duel preserves every phase and pending encounter, normal encounter resolves', () => {
  for (const phase of [0,1,2,3] as const) {
    const s = ready();
    if (phase) { e.drawAction(s); s.phase = phase; }
    const active = s.activeCard;
    e.startCombat(s, 1, 'Humano','witcher','forest');
    s.combat!.deck = [1,2]; e.attack(s); e.finishCombat(s);
    assert.equal(s.phase, phase); assert.equal(s.activeCard, active); assert.equal(s.turnResolved, false);
  }
  const s = ready(); s.phase = 2; s.activeCard = 1; s.traces = ['forest'];
  e.resolvePhase2(s,true,false,1,'Grifo','forest');
  s.combat!.deck = [1,2]; e.attack(s); e.finishCombat(s);
  assert.equal(s.turnResolved, true);
});
test('new save validates combat fields and refuses old rule version and malformed notices', () => {
  const s = ready(); e.startCombat(s,20,'Grifo','monster','forest');
  assert.ok(isGameState(s));
  for (const invalid of [{turn:'invalid'}, {lastDamage:-1}, {summary:null}, {attackReady:undefined}])
    assert.equal(isGameState({...s, combat:{...s.combat,...invalid}}), false);
  assert.equal(isGameState({...s,version:1}), false);
  assert.equal(isGameState({...s,notices:[{card:99,message:'invalid'}]}), false);
});
test('poker classifies all supported combinations', () => {
  for (const [dice, hand] of [
    [[1,1,1,1,1], 'Repóker'], [[1,2,2,2,2], 'Póker'], [[1,1,2,2,2], 'Full'],
    [[2,3,4,5,6], 'Escalera'], [[1,2,3,3,3], 'Trío'], [[1,2,2,5,5], 'Doble pareja'],
    [[1,2,3,4,4], 'Pareja'], [[1,2,3,4,6], 'Sin combinación'],
  ] as [number[],string][]) assert.equal(e.pokerHand(dice), hand);
});

test('Manticore gains potions immediately and spending remains single', () => {
  const s = battle([26,1,2]); s.school = 'manticore';
  e.attack(s);
  assert.equal(s.potions, 2); assert.equal(s.notices.length, 0);
  e.opponentTurn(s); assert.equal(s.combat!.turn, 'opponent');
  const b = battle([27,1,2]); b.school = 'manticore'; b.potions = 1;
  e.attack(b); assert.equal(b.potions, 0); assert.equal(b.combat!.lastDamage, 5);
});
test('all general and specific encounter thresholds follow Word', () => {
  assert.deepEqual(CARDS.map(c => c.condition?.trophies ?? null),
    [0,0,0,0,0,0,1,1,1,1,2,2,3,3,3,3,3,3,0,0,0,2,2,2,null,null,null]);
  assert.deepEqual(CARDS.filter(c => c.phase2.includes('witcher')).map(c => c.id), [8,10,13]);
  assert.deepEqual(CARDS.filter(c => c.phase2.includes('meditate')).map(c => c.id), [15,16,17,18]);
});

test('monster effect can discard before the automa first attack without changing initiative', () => {
  const s = battle([3, 19, 22, 1]);
  s.shield = 2;
  e.discardForAbility(s, 2);
  assert.deepEqual(s.combat!.deck, [22, 1]);
  assert.deepEqual(s.combat!.discard, [3, 19]);
  assert.equal(s.combat!.turn, 'automa');
  assert.equal(s.combat!.attackReady, true);
  assert.equal(s.combat!.current, null);
  assert.equal(s.shield, 2);
  assert.deepEqual(s.notices, []);
  e.attack(s);
  assert.equal(s.combat!.current, 22);
});
test('monster effect discard bypasses shield and damage effects without changing turn', () => {
  const s = battle([3, 19, 22, 1]);
  s.shield = 2;
  s.combat!.turn = 'opponent';
  s.combat!.ignoreNext = true;
  e.discardForAbility(s, 3);
  assert.deepEqual(s.combat!.deck, [1]);
  assert.deepEqual(s.combat!.discard, [3, 19, 22]);
  assert.equal(s.shield, 2);
  assert.equal(s.combat!.health, 20);
  assert.equal(s.combat!.turn, 'opponent');
  assert.equal(s.combat!.ignoreNext, true);
  assert.equal(s.combat!.damageRemaining, undefined);
  assert.deepEqual(s.notices, []);
});
test('monster effect discard validates counts and stops at deck exhaustion', () => {
  const s = battle([19, 1]);
  const before = structuredClone(s);
  for (const amount of [0, -1, NaN, Infinity]) e.discardForAbility(s, amount);
  assert.deepEqual(s, before);
  e.discardForAbility(s, 1.9);
  assert.deepEqual(s.combat!.discard, [19]);
  e.discardForAbility(s, 200);
  assert.deepEqual(s.combat!.discard, [19, 1]);
  assert.equal(e.combatOutcome(s), 'loss');
});
test('monster effect discard is blocked while resolving damage or notices', () => {
  const s = battle([19, 1, 2]);
  s.shield = 0;
  s.combat!.turn = 'opponent';
  e.receiveDamage(s, 1);
  const before = structuredClone(s);
  e.discardForAbility(s, 1);
  assert.deepEqual(s, before);
  e.confirmNotice(s);
  const pending = structuredClone(s);
  e.discardForAbility(s, 1);
  assert.deepEqual(s, pending);
});
test('damage reveals one card per step and interrupts at that cards effect', () => {
  const s = battle([1,19,22,2]); s.shield = 0; s.combat!.turn = 'opponent';
  e.receiveDamage(s, 3);
  assert.deepEqual(s.combat!.discard, [1]);
  assert.equal(s.combat!.damageCard, 1);
  assert.equal(s.combat!.damageRemaining, 2);
  assert.equal(s.notices.length, 0);
  e.continueDamage(s);
  assert.deepEqual(s.combat!.discard, [1,19]);
  assert.equal(s.combat!.health, 18);
  assert.deepEqual(s.notices.map(n=>n.card), [19]);
  const before = structuredClone(s);
  e.continueDamage(s); e.receiveDamage(s, 8); e.attack(s); e.finishCombat(s);
  assert.deepEqual(s, before);
  e.confirmNotice(s);
  assert.equal(s.combat!.damageCard, 19);
  assert.deepEqual(s.combat!.deck, [22,2]);
  e.continueDamage(s);
  assert.equal(s.combat!.damageCard, 22);
  assert.equal(s.combat!.health, 16);
  e.confirmNotice(s); e.continueDamage(s);
  assert.equal(s.combat!.turn, 'automa');
  assert.equal(s.combat!.damageRemaining, undefined);
  assert.deepEqual(s.combat!.damageRevealed, [1,19,22]);
});
test('damage reveal can resume after JSON roundtrip without applying effect twice', () => {
  const s = ready(); e.startCombat(s,30,'Rival','monster','forest','opponent');
  const index=s.combat!.deck.indexOf(19);
  if(index<0) { s.actionDeck=s.actionDeck.filter(id=>id!==19); s.combat!.deck.unshift(19); }
  else { s.combat!.deck.splice(index,1); s.combat!.deck.unshift(19); }
  s.shield=0; e.receiveDamage(s,2);
  assert.ok(isGameState(s));
  const restored=JSON.parse(JSON.stringify(s)) as GameState;
  assert.equal(restored.combat!.health,28);
  assert.equal(restored.combat!.damageRemaining,1);
  e.confirmNotice(restored);
  assert.equal(restored.combat!.health,28);
  e.continueDamage(restored);
  assert.equal(restored.combat!.damageRevealed!.length,2);
  assert.ok(isGameState(restored));
});
test('manual tabletop opponent never ends automatically based on an invisible life counter', () => {
  const s=ready(); e.startCombat(s,1,'Rival','witcher','forest','automa',false,true);
  s.combat!.deck=[7,1,2]; s.potions=1;
  e.attack(s);
  assert.equal(s.combat!.lastDamage,4);
  assert.equal(e.combatOutcome(s),null);
  e.declareVictory(s);
  assert.equal(e.combatOutcome(s),'win');
  e.finishCombat(s); assert.equal(s.trophies,0);
});
test('shield fully absorbing damage returns to automa without discarding or alerts', () => {
  const s=battle([19,1]); s.shield=2; s.combat!.turn='opponent';
  e.receiveDamage(s,2);
  assert.deepEqual(s.combat!.discard,[]);
  assert.equal(s.notices.length,0);
  assert.equal(s.combat!.turn,'automa');
});
test('exhaustion waits until the last revealed card and its effect are acknowledged', () => {
  const s=battle([19]); s.shield=0; s.combat!.turn='opponent';
  e.receiveDamage(s,5);
  assert.equal(e.combatOutcome(s),null);
  assert.equal(s.combat!.damageRemaining,0);
  e.confirmNotice(s);
  assert.equal(e.combatOutcome(s),null);
  e.continueDamage(s);
  assert.equal(e.combatOutcome(s),'loss');
});

test('Defense5 still caps every shield gain and maximum restoration at four', () => {
  const s=battle([3,1,2]); s.attributes.defense=5; s.shield=3;
  e.applyEffect(s,{shield:8}); assert.equal(s.shield,4);
  s.shield=0; e.applyEffect(s,{maxShield:true}); assert.equal(s.shield,4);
  s.shield=3; e.attack(s); assert.equal(s.shield,4);
  s.combat!.health=0; e.finishCombat(s); assert.equal(s.shield,4);
});
test('reactive maximum shield respects four at Defense5', () => {
  const s=battle([3,1]); s.attributes.defense=5; s.shield=0; s.combat!.turn='opponent';
  hitFully(s,1); assert.equal(s.shield,4);
});
test('old v2 shield5 save is normalized without discarding the game or weakening validation', () => {
  const s=ready(); s.attributes.defense=5; s.shield=5;
  assert.equal(isGameState(s),false);
  const loaded=normalizeGameState(s);
  assert.ok(loaded); assert.equal(loaded.shield,4);
  assert.equal(s.shield,5);
  assert.deepEqual(loaded.challengeDeck,s.challengeDeck);
  assert.equal(normalizeGameState({...s,potions:9}),null);
  assert.equal(normalizeGameState({...s,shield:6}),null);
  assert.equal(normalizeGameState({...s,attributes:{...s.attributes,defense:3}}),null);
});

for (const first of ['automa', 'opponent'] as const) {
  test(`human challenge awards no trophy or reserve card even when ${first} takes first turn`, () => {
    const s=ready(); s.trophies=3;
    const reserve=[...s.trophyReserve];
    const challenge=[...s.challengeDeck].sort((a,b)=>a-b);
    e.startCombat(s,1,'Humano','witcher','forest',first,false,true);
    e.declareVictory(s); e.finishCombat(s);
    assert.equal(s.trophies,3);
    assert.deepEqual(s.trophyReserve,reserve);
    assert.deepEqual([...s.challengeDeck].sort((a,b)=>a-b),challenge);
    assert.match(s.history[0]!,/defensor.*sin trofeo/);
    assert.ok(isGameState(s));
  });
  test(`automa initiated duel awards trophy regardless of ${first} taking first turn`, () => {
    const s=ready();
    const count=s.challengeDeck.length;
    e.startCombat(s,1,'Humano','witcher','forest',first,true,true);
    e.declareVictory(s); e.finishCombat(s);
    assert.equal(s.trophies,1);
    assert.equal(s.trophyReserve.length,2);
    assert.equal(s.challengeDeck.length,count+1);
    assert.ok(isGameState(s));
  });
}


test('legacy resource notices are applied once on restore while discard notices remain', () => {
  const s = ready(); s.bombModule = true; s.potions = 3;
  s.notices = [
    { card: 6, resource: 'potions', message: 'Old potion' },
    { card: 2, resource: 'bombs', message: 'Bomb' },
    { card: 11, resource: 'potions', message: 'Old potion' },
    { card: 19, message: 'Discard effect' },
  ];
  const loaded = normalizeGameState(s)!;
  assert.ok(loaded); assert.equal(loaded.potions, 4);
  assert.deepEqual(loaded.notices.map(n => n.message), ['Discard effect']);
  assert.equal(loaded.bombs, 1); assert.equal(s.potions, 3); assert.equal(s.notices.length, 4);
  assert.deepEqual(normalizeGameState(loaded), loaded);
});
test('bomb gains apply immediately, cap at four and never create notices', () => {
  for (const enabled of [false, true]) {
    const s = ready(); s.bombModule = enabled; s.bombs = 3;
    e.applyActions(s, { ...CARD_BY_ID[2]!, actions: ['bomb', 'bomb'] });
    assert.equal(s.bombs, enabled ? 4 : 3);
    assert.equal(s.notices.length, 0);
  }
});


test('movement and actions are separate persisted steps; effects apply exactly once', () => {
  const s = ready(); e.drawAction(s);
  const before = structuredClone(s.attributes), potions = s.potions;
  e.confirmActions(s);
  assert.deepEqual(s.attributes, before); assert.equal(s.potions, potions);
  e.nextPhase(s); assert.equal(s.phase, 1);
  e.confirmMovement(s);
  assert.equal(s.actionStep, 'actions'); assert.deepEqual(s.attributes, before);
  const restored = normalizeGameState(JSON.parse(JSON.stringify(s)))!;
  assert.ok(restored); e.confirmActions(restored);
  assert.equal(restored.phase, 1); assert.equal(restored.actionStep, 'applied');
  const applied = structuredClone(restored);
  e.confirmActions(restored); e.confirmMovement(restored);
  assert.deepEqual(restored, applied);
  const again = normalizeGameState(JSON.parse(JSON.stringify(restored)))!;
  assert.ok(again); e.confirmActions(again); assert.deepEqual(again, restored);
  while (again.notices.length) e.confirmNotice(again);
  e.nextPhase(again); assert.equal(again.phase, 2); assert.equal(again.actionStep, undefined);
});
test('legacy phaseI saves start with movement and reject corrupt action steps', () => {
  const s = ready(); e.drawAction(s); delete s.actionStep;
  assert.ok(normalizeGameState(s)); e.confirmMovement(s); assert.equal(s.actionStep, 'actions');
  assert.equal(isGameState({ ...s, actionStep: 'unknown' }), false);
  assert.equal(isGameState({ ...s, phase: 2 }), false);
});


for (const hasTrace of [false, true]) {
  test(`monster encounter rebuilds the full challenge deck and sets initiative from trace (${hasTrace})`, () => {
    const s = ready();
    const index = s.actionDeck.findIndex(id => CARD_BY_ID[id]!.phase2.includes('monster') && e.canFight(s, CARD_BY_ID[id]!));
    assert.ok(index >= 0); s.activeCard = s.actionDeck.splice(index, 1)[0]!; s.phase = 2;
    s.challengeDiscard = s.challengeDeck.splice(0, 3);
    const expected = [...s.challengeDeck, ...s.challengeDiscard].sort((a,b) => a-b);
    s.traces = hasTrace ? ['forest', 'water'] : ['water'];
    e.resolvePhase2(s, true, false, 1, 'Monstruo', 'forest', false, 'automa', true);
    assert.ok(s.combat); assert.equal(s.combat.kind, 'monster'); assert.equal(s.combat.encounter, true);
    assert.equal(s.combat.turn, hasTrace ? 'automa' : 'opponent');
    assert.deepEqual([...s.combat.deck].sort((a,b) => a-b), expected);
    assert.deepEqual(s.combat.discard, []); assert.equal(s.combat.current, null);
    assert.equal(s.combat.lastDamage, 0); assert.equal(s.combat.attackReady, true);
    assert.deepEqual(s.challengeDeck, []); assert.deepEqual(s.challengeDiscard, []);
    assert.deepEqual(s.traces, ['water']); assert.ok(isGameState(s));
  });
}

for (const kind of ['witcher', 'monster'] as const) {
  test(`${kind}: attack cards reach discard only when passing to the opponent`, () => {
    const s = battle([24, 1, 2, 4]);
    s.combat!.kind = kind;
    e.attack(s);
    assert.deepEqual(s.combat!.discard, []);
    assert.deepEqual(s.combat!.inPlay, [24]);
    e.opponentTurn(s);
    assert.equal(s.combat!.turn, 'automa'); // Additional combo is still pending.
    e.attack(s);
    assert.deepEqual(s.combat!.discard, []);
    assert.deepEqual(s.combat!.inPlay, [24, 1]);
    e.opponentTurn(s);
    assert.equal(s.combat!.turn, 'opponent');
    assert.deepEqual(s.combat!.discard, [24, 1]);
    assert.deepEqual(s.combat!.inPlay, []);
    e.opponentTurn(s);
    assert.deepEqual(s.combat!.discard, [24, 1]);
  });
}
test('finishing immediately after the final attack preserves the cards in play', () => {
  const s = battle([1], 1);
  e.attack(s);
  assert.deepEqual(s.combat!.inPlay, [1]);
  e.finishCombat(s);
  assert.equal(s.combat, null);
  assert.ok(s.challengeDeck.includes(1));
});
test('cards in play survive a save roundtrip and legacy displayed attacks migrate', () => {
  const s = ready();
  e.startCombat(s, 200, 'Rival', 'witcher', 'forest');
  e.attack(s);
  const pending = s.combat!.current!;
  assert.equal(isGameState(s), true);
  const restored = normalizeGameState(JSON.parse(JSON.stringify(s)))!;
  assert.deepEqual(restored.combat!.inPlay, [pending]);
  assert.ok(!restored.combat!.discard.includes(pending));
  const legacy = structuredClone(s);
  legacy.combat!.discard.push(...legacy.combat!.inPlay!);
  delete legacy.combat!.inPlay;
  const migrated = normalizeGameState(legacy)!;
  assert.deepEqual(migrated.combat!.inPlay, [pending]);
  assert.ok(!migrated.combat!.discard.includes(pending));
  assert.equal(isGameState(migrated), true);
  const duplicate = structuredClone(s);
  duplicate.combat!.discard.push(pending);
  assert.equal(isGameState(duplicate), false);
});

test('additional combo recovery cannot recover cards still in play', () => {
  const s = battle([24, 13, 2, 4]);
  s.potions = 1;
  s.combat!.discard = [1];
  e.attack(s);
  e.attack(s);
  assert.deepEqual(s.combat!.inPlay, [24, 13]);
  assert.deepEqual(s.combat!.discard, []);
  assert.ok(s.combat!.deck.includes(1));
  assert.ok(!s.combat!.deck.includes(24));
  assert.ok(!s.combat!.deck.includes(13));
});

for (const card of [15, 16, 17, 18]) {
  test(`card ${card}: meditation awards each available level-five trophy before combat, once`, () => {
    for (const attribute of ['attack', 'defense', 'alchemy', 'special'] as const) {
      const s = ready();
      s.activeCard = card;
      s.phase = 2;
      s.attributes[attribute] = 5;
      assert.ok(CARD_BY_ID[card]!.phase2.includes('meditate'));
      const before = structuredClone(s);
      e.resolvePhase2(s, true, true, 10, 'Rival', 'forest');
      assert.deepEqual(s, before);
      e.resolvePhase2(s, true, true, 10, 'Rival', 'forest', true);
      assert.equal(s.trophies, 1);
      assert.equal(s.meditationAvailable[attribute], false);
      assert.equal(s.turnResolved, true);
      assert.equal(s.combat, null);
      e.resolvePhase2(s, true, true, 10, 'Rival', 'forest', true);
      assert.equal(s.trophies, 1);
    }
  });
  test(`card ${card}: meditation cannot award an unavailable trophy or a skill below five`, () => {
    for (const unavailable of [false, true]) {
      const s = ready();
      s.activeCard = card;
      s.phase = 2;
      s.attributes.attack = unavailable ? 5 : 4;
      s.meditationAvailable.attack = !unavailable;
      e.resolvePhase2(s, false, false, 10, 'Rival', 'forest', true);
      assert.equal(s.trophies, 0);
      assert.equal(s.turnResolved, true);
    }
  });
}

test('attack summary records actual shield gain and only potions really spent', () => {
  const s = battle([20, 19, 2]);
  s.attributes.defense = 5;
  s.shield = 3;
  s.potions = 1;
  e.attack(s);
  assert.equal(s.combat!.lastShieldGain, 1);
  assert.equal(s.combat!.lastPotionsSpent, 1);
  const capped = battle([20, 19, 2]);
  capped.attributes.defense = 5;
  capped.shield = 4;
  capped.potions = 0;
  e.attack(capped);
  assert.equal(capped.combat!.lastShieldGain, 0);
  assert.equal(capped.combat!.lastPotionsSpent, 0);
});
test('attack summary accumulates a chain and resets for the next attack', () => {
  const s = battle([24, 7, 1, 4]);
  s.attributes.defense = 5;
  s.shield = 0;
  s.potions = 2;
  e.attack(s);
  const gained = s.combat!.lastShieldGain!;
  e.attack(s);
  assert.equal(s.combat!.lastShieldGain, gained);
  assert.equal(s.combat!.lastPotionsSpent, 1);
  e.opponentTurn(s);
  hitFully(s, 0);
  e.attack(s);
  assert.equal(s.combat!.lastPotionsSpent, 0);
});
test('school specialty potion consumption appears in the attack summary', () => {
  const card = CARDS.find(c => c.schoolSpecial === 3)!;
  const s = battle([card.id, 1, 2]);
  s.school = 'manticore';
  s.potions = 1;
  e.attack(s);
  assert.equal(s.combat!.lastPotionsSpent, 1);
  assert.equal(s.potions, 0);
});

for (const id of [11, 12, 16]) {
  test(`card ${id}: bomb effects require active expansion and available bombs`, () => {
    for (const [enabled, count] of [[false, 1], [true, 0], [true, 1]] as const) {
      const s = battle([id, 19, 1, 2]);
      s.bombModule = enabled;
      s.bombs = count;
      s.potions = 1;
      e.attack(s);
      const used = enabled && count > 0;
      assert.equal(s.combat!.lastBombsSpent, used ? 1 : 0);
      assert.equal(s.bombs, count - (used ? 1 : 0));
      assert.equal(s.potions, 1);
      assert.equal(s.combat!.lastPotionsSpent, 0);
      assert.equal(s.combat!.comboPending, used && id !== 12);
      if (id === 12) {
        assert.equal(s.combat!.lastDamage, used ? 5 : 3);
        assert.deepEqual(s.combat!.discard, used ? [19] : []);
        assert.equal(s.notices.length, 0);
        assert.equal(s.combat!.damageRemaining, undefined);
      }
    }
  });
}
test('bomb summary accumulates additional combos once and resets for next turn', () => {
  const s = battle([16, 11, 1, 2, 4]);
  s.bombModule = true;
  s.bombs = 2;
  e.attack(s);
  assert.equal(s.combat!.lastBombsSpent, 1);
  e.attack(s);
  assert.equal(s.combat!.lastBombsSpent, 2);
  assert.equal(s.bombs, 0);
  e.attack(s);
  assert.equal(s.combat!.lastBombsSpent, 2);
  e.opponentTurn(s);
  hitFully(s, 0);
  e.attack(s);
  assert.equal(s.combat!.lastBombsSpent, 0);
});

// Monster Trail modules and level rewards.
test('bombs and mutagens can be independently enabled in all four combinations', () => {
  for (const bombs of [false, true]) for (const mutagens of [false, true]) {
    const s = e.createGame('wolf', 'normal', bombs, deterministic, undefined, mutagens);
    assert.equal(s.bombModule, bombs);
    assert.equal(s.mutagenModule, mutagens);
    assert.deepEqual(s.mutagens, []);
    assert.equal(s.mutagenLevel, 1);
    assert.equal(isGameState(s), true);
  }
});
test('minimum skill level awards one random mutagen on each advance from two to five', () => {
  const s = e.createGame('wolf', 'normal', false, deterministic, undefined, true);
  s.attributes = { attack: 2, defense: 3, alchemy: 2, special: 1 };
  assert.equal(e.automaLevel(s), 1);
  e.changeAttribute(s, 'special', 1, () => 0);
  assert.equal(e.automaLevel(s), 2);
  assert.deepEqual(s.mutagens, ['green']);
  e.changeAttribute(s, 'attack', 1, () => .4);
  e.changeAttribute(s, 'alchemy', 1, () => .4);
  assert.equal(s.mutagens!.length, 1);
  e.changeAttribute(s, 'special', 1, () => .4);
  assert.deepEqual(s.mutagens, ['green', 'red']);
  for (const level of [4, 5]) {
    for (const a of ['attack', 'defense', 'alchemy', 'special'] as const) e.changeAttribute(s, a, 1, () => .9);
    assert.equal(s.mutagenLevel, level);
    assert.equal(s.mutagens!.length, level - 1);
  }
  assert.deepEqual(s.mutagens, ['green', 'red', 'blue', 'blue']);
  e.changeAttribute(s, 'attack', 1, () => 0);
  assert.equal(s.mutagens!.length, 4);
});
test('level rewards include crossed levels, allow duplicate colors and cannot be farmed by lowering skills', () => {
  const s = e.createGame('wolf', 'normal', false, deterministic, undefined, true);
  s.attributes = { attack: 4, defense: 4, alchemy: 4, special: 1 };
  e.changeAttribute(s, 'special', 3, () => 0);
  assert.deepEqual(s.mutagens, ['green', 'green', 'green']);
  assert.equal(s.mutagenLevel, 4);
  e.changeAttribute(s, 'special', -1, () => .9);
  e.changeAttribute(s, 'special', 1, () => .9);
  assert.deepEqual(s.mutagens, ['green', 'green', 'green']);
});
test('action gains award level mutagens, while a disabled module never does', () => {
  for (const enabled of [false, true]) {
    const s = e.createGame('wolf', 'normal', false, deterministic, undefined, enabled);
    s.attributes = { attack: 2, defense: 2, alchemy: 2, special: 1 };
    e.applyActions(s, { ...CARD_BY_ID[1]!, actions: ['special'] });
    assert.equal(s.mutagens!.length, enabled ? 1 : 0);
  }
});
const schoolMutagenCases: [SchoolId, MutagenColor, number, number, number, number][] = [
  // School, color, damage, shield, recovered cards, potions.
  ['wolf', 'blue', 1, 0, 0, 0], ['wolf', 'red', 0, 1, 0, 0], ['wolf', 'green', 0, 0, 1, 0],
  ['cat', 'blue', 2, 0, 0, 0], ['cat', 'red', 1, 0, 0, 0], ['cat', 'green', 0, 1, 0, 0],
  ['bear', 'blue', 0, 1, 0, 0], ['bear', 'red', 0, 1, 0, 0], ['bear', 'green', 0, 1, 0, 0],
  ['viper', 'blue', 1, 0, 0, 0], ['viper', 'red', 2, 0, 0, 0], ['viper', 'green', 1, 0, 0, 0],
  ['griffin', 'blue', 0, 0, 1, 0], ['griffin', 'red', 1, 0, 0, 0], ['griffin', 'green', 0, 0, 1, 0],
  ['manticore', 'blue', 0, 0, 0, 1], ['manticore', 'red', 1, 0, 0, 0], ['manticore', 'green', 0, 0, 0, 1],
];
for (const [school, color, damage, shield, recover, potions] of schoolMutagenCases) {
  test(`${school} ${color}: school mutagen effect is applied once when the combo matches`, () => {
    const s = battle([17, 1, 2], 200);
    s.school = school;
    s.mutagenModule = true;
    s.mutagenLevel = 2;
    s.mutagens = [color];
    s.attributes.defense = 5;
    s.shield = 0;
    s.combat!.discard = [5, 19];
    e.attack(s);
    assert.equal(s.combat!.lastDamage, CARD_BY_ID[17]!.damage + damage);
    assert.equal(s.shield, shield);
    assert.equal(s.combat!.lastShieldGain, shield);
    assert.equal(s.potions, potions);
    assert.deepEqual(s.combat!.discard, recover ? [5] : [5, 19]);
    assert.equal(s.combat!.deck.includes(19), !!recover);
    assert.deepEqual(s.combat!.mutagensSpent, [0]);
    assert.deepEqual(s.combat!.lastMutagensUsed, [0]);
    assert.deepEqual(s.mutagens, [color]);
  });
}
test('matching duplicate mutagens each apply once, stay exhausted through the combat and refresh in the next', () => {
  const s = battle([17, 23, 1, 2], 200);
  s.school = 'viper';
  s.mutagenModule = true;
  s.mutagenLevel = 4;
  s.mutagens = ['red', 'red', 'red'];
  e.attack(s);
  assert.equal(s.combat!.lastDamage, 9);
  assert.deepEqual(s.combat!.mutagensSpent, [0, 1, 2]);
  e.opponentTurn(s);
  hitFully(s, 0);
  e.attack(s);
  assert.equal(s.combat!.lastDamage, CARD_BY_ID[23]!.damage);
  assert.deepEqual(s.combat!.lastMutagensUsed, []);
  e.declareVictory(s);
  e.finishCombat(s);
  assert.deepEqual(s.mutagens, ['red', 'red', 'red']);
  e.startCombat(s, 200, 'Otro rival', 'witcher', 'forest');
  assert.deepEqual(s.combat!.mutagensSpent, []);
  s.combat!.deck = [17, ...s.combat!.deck.filter(id => id !== 17)];
  e.attack(s);
  assert.equal(s.combat!.lastDamage, 9);
});
test('mutagens require their color on the revealed combo and the module enabled', () => {
  for (const enabled of [false, true]) {
    const s = battle([1, 6, 2], 200);
    s.school = 'wolf';
    s.mutagenModule = enabled;
    s.mutagens = ['blue'];
    e.attack(s); // Card 1 only matches red.
    assert.deepEqual(s.combat!.mutagensSpent, []);
    e.opponentTurn(s);
    hitFully(s, 0);
    e.attack(s); // Card 6 matches blue.
    assert.equal(s.combat!.lastDamage, CARD_BY_ID[6]!.damage + (enabled ? 1 : 0));
  }
});
test('discarded cards never activate mutagens, including damage and bomb discards', () => {
  const s = battle([12, 19, 17, 1], 200);
  s.mutagenModule = true;
  s.mutagens = ['red'];
  s.bombModule = true;
  s.bombs = 1;
  e.attack(s); // 19 matches red, but is discarded by the bomb, not played.
  assert.deepEqual(s.combat!.mutagensSpent, []);
  e.opponentTurn(s);
  s.shield = 0;
  hitFully(s, 1); // 17 matches red but is discarded for damage.
  assert.deepEqual(s.combat!.mutagensSpent, []);
});
test('mutagen recovery takes latest discard, never the card in play, and resources respect their caps', () => {
  const s = battle([17, 1, 2], 200);
  s.school = 'wolf'; s.mutagenModule = true; s.mutagens = ['green', 'green'];
  s.combat!.discard = [5, 19];
  e.attack(s);
  assert.deepEqual(s.combat!.discard, []);
  assert.ok(s.combat!.deck.includes(19) && s.combat!.deck.includes(5));
  assert.ok(!s.combat!.deck.includes(17));
  for (const school of ['bear', 'manticore'] as const) {
    const capped = battle([17, 1, 2], 200);
    capped.school = school; capped.mutagenModule = true; capped.mutagens = ['blue', 'green'];
    capped.attributes.defense = 5; capped.shield = 4; capped.potions = 4;
    e.attack(capped);
    assert.equal(capped.shield, 4);
    assert.equal(capped.potions, 4);
    assert.deepEqual(capped.combat!.mutagensSpent, [0, 1]);
  }
});
test('save roundtrip preserves owned and exhausted mutagens; legacy saves default to module off', () => {
  const s = e.createGame('wolf', 'normal', false, deterministic, undefined, true);
  for (const a of ['attack', 'defense', 'alchemy', 'special'] as const) e.changeAttribute(s, a, 1, () => .9);
  e.startCombat(s, 200, 'Rival', 'witcher', 'forest');
  const id = s.combat!.deck.find(id => CARD_BY_ID[id]!.mutagens.includes('blue'))!;
  assert.ok(id);
  s.combat!.deck = [id, ...s.combat!.deck.filter(n => n !== id)];
  e.attack(s);
  assert.equal(isGameState(s), true);
  const restored = normalizeGameState(JSON.parse(JSON.stringify(s)))!;
  assert.deepEqual(restored.mutagens, ['blue']);
  assert.deepEqual(restored.combat!.mutagensSpent, [0]);
  assert.deepEqual(restored.combat!.lastMutagensUsed, [0]);
  const corrupt = structuredClone(s);
  corrupt.combat!.mutagensSpent = [1];
  assert.equal(isGameState(corrupt), false);
  corrupt.combat!.mutagensSpent = [0, 0];
  assert.equal(isGameState(corrupt), false);
  const invalidColor = structuredClone(s) as any;
  invalidColor.mutagens = ['purple'];
  assert.equal(isGameState(invalidColor), false);
  const legacy = ready();
  delete legacy.mutagenModule; delete legacy.mutagens; delete legacy.mutagenLevel;
  const normalized = normalizeGameState(legacy)!;
  assert.equal(normalized.mutagenModule, false);
  assert.deepEqual(normalized.mutagens, []);
});

test('all matching colors and duplicate tokens apply together on a multicolor combo', () => {
  const s = battle([17, 1, 2], 200);
  s.school = 'cat'; s.mutagenModule = true;
  s.mutagens = ['red', 'red', 'blue', 'green']; s.mutagenLevel = 5;
  s.attributes.defense = 5; s.shield = 0;
  e.attack(s);
  assert.equal(s.combat!.lastDamage, 7);
  assert.equal(s.combat!.lastShieldGain, 1);
  assert.deepEqual(s.combat!.mutagensSpent, [0, 1, 2, 3]);
});
test('additional combo cards cannot reactivate a mutagen already spent earlier in the chain', () => {
  const s = battle([24, 17, 1, 2], 200);
  s.school = 'cat'; s.mutagenModule = true;
  s.mutagens = [CARD_BY_ID[24]!.mutagens[0]!];
  s.attributes.defense = 5; s.shield = 0;
  e.attack(s);
  assert.equal(s.combat!.comboPending, true);
  assert.deepEqual(s.combat!.mutagensSpent, [0]);
  const firstDamage = s.combat!.lastDamage;
  const firstShield = s.shield;
  e.attack(s);
  assert.equal(s.combat!.lastDamage, firstDamage + CARD_BY_ID[17]!.damage);
  assert.equal(s.shield, firstShield);
  assert.deepEqual(s.combat!.lastMutagensUsed, [0]);
});

test('bomb acquisition does not block phase progression and action confirmation applies it once', () => {
  const s = ready(); s.bombModule = true;
  s.activeCard = 24; s.phase = 1; s.actionStep = 'actions';
  e.confirmActions(s);
  assert.equal(s.bombs, 1);
  assert.equal(s.actionStep, 'applied');
  assert.deepEqual(s.notices, []);
  e.confirmActions(s);
  assert.equal(s.bombs, 1);
  e.nextPhase(s);
  assert.equal(s.phase, 2);
});
test('legacy bomb notices are credited only once and respect the four-bomb cap', () => {
  const s = ready(); s.bombModule = true; s.bombs = 3;
  s.notices = [
    { card: 24, resource: 'bombs', message: 'Old bomb' },
    { card: 11, resource: 'bombs', message: 'Old bomb' },
  ];
  const loaded = normalizeGameState(s)!;
  assert.equal(loaded.bombs, 4);
  assert.deepEqual(loaded.notices, []);
  assert.deepEqual(normalizeGameState(loaded), loaded);
  assert.equal(s.bombs, 3);
});

test('Monster Trail remains active independently of both optional modules and survives saving', () => {
  const s = e.createGame('wolf', 'normal', false, deterministic, undefined, false, true);
  assert.equal(s.bombModule, false);
  assert.equal(s.mutagenModule, false);
  assert.equal(e.monsterTrailActive(s), true);
  assert.ok(isGameState(s));
  const restored = normalizeGameState(JSON.parse(JSON.stringify(s)))!;
  assert.equal(restored.monsterTrailExpansion, true);
  assert.equal(e.monsterTrailActive(restored), true);
  assert.equal(e.monsterTrailActive(ready()), false);
});
test('older saves infer Monster Trail from active modules without enabling either module', () => {
  for (const [bombs, mutagens] of [[false, false], [true, false], [false, true]] as const) {
    const s = e.createGame('wolf', 'normal', bombs, deterministic, undefined, mutagens);
    delete s.monsterTrailExpansion;
    const restored = normalizeGameState(s)!;
    assert.equal(e.monsterTrailActive(restored), bombs || mutagens);
    assert.equal(restored.bombModule, bombs);
    assert.equal(restored.mutagenModule, mutagens);
  }
});
test('save validation rejects an invalid Monster Trail expansion flag', () => {
  assert.equal(isGameState({ ...ready(), monsterTrailExpansion: 'yes' }), false);
});
