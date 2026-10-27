import { computed, Injectable, signal } from '@angular/core';
import { CARD_BY_ID, SCHOOLS, schoolTitle } from './cards';
import { GameState } from './models';
import { createGame } from './engine';
import { normalizeGameState } from './save';
const SAVE_KEY = 'witcher-old-world-automa-v2';
@Injectable({ providedIn: 'root' })
export class GameStore {
  readonly warning = signal('');
  private readonly value = signal<GameState | null>(this.restore());
  readonly game = this.value.asReadonly();
  readonly school = computed(
    () => SCHOOLS.find((s) => s.id === this.value()?.school) ?? SCHOOLS[0]!,
  );
  readonly schoolTitle = computed(() => schoolTitle(this.school()));
  readonly card = computed(() => {
    const id = this.value()?.activeCard;
    return id ? CARD_BY_ID[id]! : null;
  });
  readonly canUndo = signal(false);
  private snapshots: (GameState | null)[] = [];
  update(mutate: (state: GameState) => void): void {
    const current = this.value();
    if (!current) return;
    const next = structuredClone(current);
    mutate(next);
    if (JSON.stringify(current) === JSON.stringify(next)) return;
    this.snapshots = [...this.snapshots.slice(-19), structuredClone(current)];
    this.canUndo.set(true);
    this.value.set(next);
    this.persist();
  }
  start(...args: Parameters<typeof createGame>): void {
    this.snapshots = [structuredClone(this.value())];
    this.canUndo.set(true);
    this.value.set(createGame(...args));
    this.persist();
  }
  undo(): void {
    if (!this.snapshots.length) return;
    this.value.set(this.snapshots.pop()!);
    this.canUndo.set(!!this.snapshots.length);
    this.persist();
  }
  private restore(): GameState | null {
    try {
      const text = localStorage.getItem(SAVE_KEY);
      if (!text) return null;
      const parsed = normalizeGameState(JSON.parse(text));
      if (!parsed) return null;
      if (parsed.combat && parsed.combat.health > 0) parsed.combat.manualOpponent = true;
      return parsed;
    } catch {
      return null;
    }
  }
  private persist(): void {
    try {
      const state = this.value();
      if (state) localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      else localStorage.removeItem(SAVE_KEY);
      this.warning.set('');
    } catch {
      this.warning.set(
        'No se ha podido guardar en este navegador. Los cambios de esta sesión no se conservarán al cerrar.',
      );
    }
  }
}
