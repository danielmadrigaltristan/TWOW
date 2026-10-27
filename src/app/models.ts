export type Attribute = 'attack' | 'defense' | 'alchemy' | 'special';
export type MutagenColor = 'green' | 'red' | 'blue';
export type Terrain = 'forest' | 'mountain' | 'water';
export type SchoolId = 'wolf' | 'cat' | 'bear' | 'viper' | 'griffin' | 'manticore' | 'ciri';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type Action = Attribute | 'lowest' | 'highest' | 'potion' | 'bomb' | 'trace';
export interface ComboEffect {
  damage?: number;
  shield?: number;
  recover?: number;
  discard?: number;
  chain?: boolean;
  maxShield?: boolean;
  nextDamage?: number;
  ignoreNext?: boolean;
  ignorePassive?: boolean;
  potions?: number;
  potionDamage?: number;
}
export interface Card {
  id: number;
  description: string;
  level: 1 | 2 | 3;
  kind: 'generic' | 'specific' | 'trophy';
  color: string;
  mutagens: readonly ('red' | 'green' | 'blue')[];
  destination: number | 'monster';
  movement: number | 'unlimited';
  direction: 'up' | 'down';
  actions: readonly Action[];
  phase2: readonly ('meditate' | 'witcher' | 'monster')[];
  condition?: { operator: 'lt' | 'lte'; trophies: number };
  market: readonly number[];
  damage: number;
  shield: number;
  monsterAttack: 'bite' | 'charge';
  dice: readonly number[];
  effect?: ComboEffect;
  potion?: ComboEffect;
  bomb?: ComboEffect;
  onDamage?: ComboEffect;
  schoolSpecial?: 1 | 2 | 3;
}
export interface School {
  id: SchoolId;
  name: string;
  subtitle: string;
  color: string;
  specials: readonly [ComboEffect, ComboEffect, ComboEffect];
}
export interface Notice {
  card: number;
  message: string;
  resource?: 'potions' | 'bombs';
}
export interface Combat {
  // Optional for compatibility with existing v2 saves.
  manualOpponent?: boolean;
  damageRemaining?: number;
  damageCard?: number | null;
  damageRevealed?: number[];
  turn: 'automa' | 'opponent';
  encounter: boolean;
  lastDamage: number;
  lastShieldGain?: number;
  lastPotionsSpent?: number;
  lastBombsSpent?: number;
  mutagensSpent?: number[];
  lastMutagensUsed?: number[];
  attackReady: boolean;
  summary: string[];

  opponent: string;
  kind: 'monster' | 'witcher';
  health: number;
  maxHealth: number;
  deck: number[];
  discard: number[];
  current: number | null;
  // Revealed attack cards stay in play until the opponent takes their turn.
  inPlay?: number[];
  damageInput: number;
  nextDamage: number;
  ignoreNext: boolean;
  ignorePassive: boolean;
  comboPending: boolean;
  log: string[];
}
export interface GameState {
  version: 2;
  notices: Notice[];
  school: SchoolId;
  difficulty: Difficulty;
  started: boolean;
  turn: number;
  phase: 0 | 1 | 2 | 3;
  actionStep?: 'movement' | 'actions' | 'applied';
  attributes: Record<Attribute, number>;
  shield: number;
  potions: number;
  bombs: number;
  bombModule: boolean;
  monsterTrailExpansion?: boolean;
  mutagenModule?: boolean;
  mutagenLevel?: number;
  mutagens?: MutagenColor[];
  trophies: number;
  terrain: Terrain;
  traces: Terrain[];
  meditationAvailable: Record<Attribute, boolean>;
  actionDeck: number[];
  actionDiscard: number[];
  challengeDeck: number[];
  challengeDiscard: number[];
  trophyReserve: number[];
  activeCard: number | null;
  pokerCard: number | null;
  pokerRolls?: 0 | 1 | 2;
  combat: Combat | null;
  turnResolved: boolean;
  history: string[];
}
export const ATTRIBUTES: readonly Attribute[] = ['attack', 'defense', 'alchemy', 'special'];
export const LABELS: Record<Action, string> = {
  attack: 'Ataque',
  defense: 'Defensa',
  alchemy: 'Alquimia',
  special: 'Especial',
  lowest: 'Mejora el atributo más bajo',
  highest: 'Mejora el atributo más alto',
  potion: 'Gana una poción',
  bomb: 'Gana una bomba (módulo)',
  trace: 'Gana un rastro del terreno actual',
};
export const TERRAIN_NAMES: Record<Terrain, string> = {
  forest: 'Bosque',
  mountain: 'Montaña',
  water: 'Agua',
};

export function shieldLimit(defense: number): number {
  return Math.min(4, defense);
}
