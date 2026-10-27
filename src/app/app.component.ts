import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameStore } from './game.store';
import { BoardComponent } from './board.component';
import { DeckCounterComponent } from './deck-counter.component';
import { VictoryComponent } from './victory.component';
import { MeditationComponent } from './meditation.component';
import { MutagenTokensComponent } from './mutagen-tokens.component';
import { GAME_ICON_IMAGES, GameIconComponent } from './game-icon.component';
import { CARD_BY_ID, CARDS, cardImage, SCHOOLS } from './cards';
import { ATTRIBUTES, shieldLimit, Attribute, Difficulty, LABELS, SchoolId, Terrain, TERRAIN_NAMES } from './models';
import * as engine from './engine';
type Modal = 'meditation' | 'legend' | 'school' | 'new' | 'card' | 'monster-attacks' | null;
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, BoardComponent, GameIconComponent, DeckCounterComponent, VictoryComponent, MeditationComponent, MutagenTokensComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly store = inject(GameStore);
  readonly schools = SCHOOLS.filter(s => s.id !== 'ciri');
  readonly setupStep = signal<1 | 2 | 3>(1);
  readonly schoolChosen = signal(false);
  readonly abilitySchoolId = signal<SchoolId>('wolf');
  readonly abilitySchool = computed(() => SCHOOLS.find(s => s.id === this.abilitySchoolId())!);
  readonly discardNoticeEffect = computed(() => {
    const notice = this.store.game()?.notices[0];
    return notice && !notice.resource ? CARD_BY_ID[notice.card]?.onDamage : undefined;
  });
  private swipeStart: { x: number; y: number } | null = null;
  private swiped = false;
  readonly revealing = signal(false);
  readonly combatRevealing = signal(false);
  readonly cards = CARDS;
  readonly labels = LABELS;
  readonly attrs = ATTRIBUTES;
  readonly shieldLimit = shieldLimit;
  readonly terrains: Terrain[] = ['forest', 'mountain', 'water'];
  readonly terrainNames = TERRAIN_NAMES;
  readonly img = cardImage;
  readonly iconImage = (name: string): string => GAME_ICON_IMAGES[name] ?? `icons/${name}.webp`;
  readonly effectText = engine.effectDescription;
  readonly combatGrantsTrophy = engine.combatGrantsTrophy;
  readonly difficulties: Difficulty[] = ['easy', 'normal', 'hard'];
  readonly difficultyNames: Record<Difficulty, string> = {
    easy: 'Fácil',
    normal: 'Intermedia',
    hard: 'Difícil',
  };
  readonly selectedSchool = signal<SchoolId>('wolf');
  readonly difficulty = signal<Difficulty>('normal');
  readonly bombs = signal(false);
  readonly monsterTrailExpansion = signal(false);
  readonly mutagens = signal(false);
  toggleMonsterTrail(): void {
    this.monsterTrailExpansion.update(value => !value);
    this.bombs.set(this.monsterTrailExpansion());
    this.mutagens.set(this.monsterTrailExpansion());
  }
  readonly monsterTrailActive = engine.monsterTrailActive;
  readonly pokerHand = engine.pokerHand;
  readonly pokerRolling = signal(false);
  readonly pokerRolls = computed(() => {
    const game = this.store.game();
    return game?.pokerRolls ?? (game?.pokerCard ? 2 : 0);
  });
  readonly dieSlots = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  readonly diePips = [[], [5], [1, 9], [1, 5, 9], [1, 3, 7, 9], [1, 3, 5, 7, 9], [1, 3, 4, 6, 7, 9]];
  readonly tab = signal<'turn' | 'combat' | 'meditation' | 'poker' | 'journal'>(
    this.store.game()?.combat ? 'combat' : 'turn',
  );
  readonly modal = signal<Modal>(null);
  readonly playArea = viewChild<ElementRef<HTMLElement>>('playArea');
  readonly zoomId = signal<number | null>(null);
  readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  readonly monsterPresent = signal(false);
  readonly witcherPresent = signal(false);
  readonly monsterTrail = signal<Terrain | null>(null);
  readonly opponentTerrain = signal<Terrain>('forest');
  readonly damage = signal(1);
  readonly abilityDiscard = signal(1);
  readonly archiveLevel = signal(0);
  readonly setup = signal(!this.store.game());
  readonly selected = computed(() => SCHOOLS.find((s) => s.id === this.selectedSchool())!);
  readonly currentCombatCard = computed(() => {
    const id = this.store.game()?.combat?.current;
    return id ? CARD_BY_ID[id]! : null;
  });
  readonly outcome = computed(() => {
    const s = this.store.game();
    return s ? engine.combatOutcome(s) : null;
  });
  readonly poker = computed(() => {
    const id = this.store.game()?.pokerCard;
    return id ? CARD_BY_ID[id]! : null;
  });
  readonly filteredCards = computed(() =>
    this.cards.filter((c) => !this.archiveLevel() || c.level === this.archiveLevel()),
  );
  readonly monsterEncounter = computed(() => {
    const g = this.store.game(), c = this.store.card();
    return !!g && !!c && c.phase2.includes('monster') && engine.canFight(g, c);
  });
  readonly witcherEncounter = computed(() => this.store.card()?.phase2.includes('witcher') ?? false);
  readonly meditation = computed(() => {
    const s = this.store.game();
    return s && this.store.card()?.phase2.includes('meditate') ? engine.meditationCandidate(s) : undefined;
  });
  readonly meditationUnavailableReason = computed(() => {
    const s = this.store.game();
    if (!s || this.meditation()) return '';
    const maximum = ATTRIBUTES.filter(a => s.attributes[a] === 5);
    return maximum.length
      ? `Los trofeos de las habilidades a nivel 5 ya no están disponibles: ${maximum.map(a => LABELS[a]).join(', ')}.`
      : 'Ninguna habilidad del automa está a nivel 5.';
  });
  readonly selectedEncounter = computed(() => this.store.card()?.phase2.find(option =>
    option === 'meditate' ? !!this.meditation() :
    option === 'monster' ? this.monsterEncounter() && this.monsterPresent() :
    this.witcherEncounter() && this.witcherPresent(),
  ));
  switchTab(next: 'turn' | 'combat' | 'meditation' | 'poker'): void {
    this.tab.set(next);
    requestAnimationFrame(() => this.playArea()?.nativeElement.scrollIntoView({ block: 'start', behavior: 'instant' }));
  }
  selectMonsterTrail(terrain: Terrain): void {
    this.monsterTrail.set(terrain);
    this.opponentTerrain.set(terrain);
  }
  constructor() {
    effect(() => {
      if (this.tab() !== 'poker' || !this.poker()) this.pokerRolling.set(false);
    });
    effect(() => {
      const modal = this.modal();
      const dialog = this.dialog()?.nativeElement;
      if (!dialog) return;
      if ((modal || this.store.game()?.notices.length) && !dialog.open) dialog.showModal();
      else if (!modal && !this.store.game()?.notices.length && dialog.open) dialog.close();
    });
  }
  open(modal: Modal): void {
    this.modal.set(modal);
  }
  close(): void {
    if (this.store.game()?.notices.length) return;
    this.modal.set(null);
  }
  closeFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }
  zoom(id: number): void {
    this.zoomId.set(id);
    this.open('card');
  }
  portrait(id: SchoolId): string {
    const extension = id === 'manticore' ? 'webp' : id === 'viper' ? 'jpeg' : 'jpg';
    return `schools/portraits/${id}.${extension}`;
  }
  schoolOffset(id: SchoolId): number {
    const count = this.schools.length;
    const index = this.schools.findIndex(s => s.id === id);
    const selected = this.schools.findIndex(s => s.id === this.selectedSchool());
    return (index - selected + count + Math.floor(count / 2)) % count - Math.floor(count / 2);
  }
  cycleSchool(direction: number): void {
    this.schoolChosen.set(false);
    const index = this.schools.findIndex(s => s.id === this.selectedSchool());
    this.selectedSchool.set(this.schools[(index + direction + this.schools.length) % this.schools.length].id);
  }
  previewCandidate(id: SchoolId, event: MouseEvent): void {
    if (!this.swiped || event.detail === 0) this.openSchoolAbility(id);
  }
  continueWithSchool(): void {
    if (this.schoolChosen()) this.setupStep.set(2);
  }
  beginSwipe(event: PointerEvent): void {
    this.swiped = false;
    this.swipeStart = { x: event.clientX, y: event.clientY };
  }
  cancelSwipe(): void { this.swipeStart = null; }
  endSwipe(event: PointerEvent): void {
    if (!this.swipeStart) return;
    const dx = event.clientX - this.swipeStart.x;
    const dy = event.clientY - this.swipeStart.y;
    this.swipeStart = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      this.swiped = true;
      this.cycleSchool(dx < 0 ? 1 : -1);
    }
  }
  carouselKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    this.cycleSchool(event.key === 'ArrowRight' ? 1 : -1);
  }
  openSchoolAbility(id: SchoolId): void {
    this.abilitySchoolId.set(id);
    this.open('school');
  }
  prepareSetup(): void {
    this.setupStep.set(1);
    this.selectedSchool.set('wolf');
    this.schoolChosen.set(false);
    this.setup.set(true);
    this.close();
    requestAnimationFrame(() => window.scrollTo({ top: 0 }));
  }
  start(): void {
    if (!this.schoolChosen()) return;
    this.store.start(this.selectedSchool(), this.difficulty(), this.bombs(), undefined, undefined, this.mutagens(), this.monsterTrailExpansion());
    this.setup.set(false);
    this.tab.set('turn');
    this.close();
    this.monsterPresent.set(false);
    this.monsterTrail.set(null);
    this.witcherPresent.set(false);
    requestAnimationFrame(() => window.scrollTo({ top: 0 }));
  }
  draw(): void {
    const before = this.store.game()?.activeCard;
    this.store.update(engine.drawAction);
    if (this.store.game()?.activeCard !== before && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.revealing.set(true);
  }
  confirmMovement(): void { this.store.update(engine.confirmMovement); }
  confirmActions(): void { this.store.update(engine.confirmActions); }
  next(): void {
    this.store.update(engine.nextPhase);
    if (this.store.game()?.phase === 0) {
      this.monsterPresent.set(false);
      this.monsterTrail.set(null);
      this.witcherPresent.set(false);
    }
  }
  setTerrain(value: Terrain): void {
    this.store.update((s) => {
      s.terrain = value;
    });
  }
  setMeditation(key: Attribute, available: boolean): void {
    this.store.update((s) => {
      s.meditationAvailable[key] = available;
      engine.log(s, `Trofeo de ${LABELS[key]}: ${available ? 'disponible' : 'retirado de la reserva'}.`);
    });
  }
  confirmNotice(): void { this.store.update(engine.confirmNotice); }
  cancelDialog(event: Event): void {
    event.preventDefault();
    if (this.store.game()?.notices.length) this.confirmNotice();
    else this.close();
  }
  openDuel(): void {
    this.store.update(s => engine.startCombat(s, 1, 'Brujo rival', 'witcher', this.opponentTerrain(), 'opponent', false, true));
  }
  opponentTurn(): void { this.store.update(engine.opponentTurn); }
  selectWitcher(present: boolean): void {
    this.witcherPresent.set(present);
  }
  resolve(confirmMeditation = false): void {
    if (this.selectedEncounter() === 'monster' && !this.monsterTrail()) return;
    if (this.selectedEncounter() === 'meditate' && !confirmMeditation) { this.open('meditation'); return; }
    this.store.update((s) =>
      engine.resolvePhase2(
        s,
        this.monsterPresent() && this.monsterEncounter(),
        this.witcherPresent() && this.witcherEncounter(),
        1,
        this.selectedEncounter() === 'monster' ? 'Monstruo' : 'Brujo rival',
        this.opponentTerrain(),
        confirmMeditation,
        'automa',
        true,
      ),
    );
    this.close();
    if (this.store.game()?.combat) {
      this.switchTab('combat');
    }
  }
  attack(): void {
    const before = this.store.game();
    this.store.update(engine.attack);
    if (this.store.game() !== before && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.combatRevealing.set(true);
  }
  hit(): void {
    this.store.update((s) => engine.receiveDamage(s, this.damage()));
  }
  finish(): void {
    this.store.update(engine.finishCombat);
    this.switchTab('turn');
  }
  discardForAbility(): void {
    this.store.update(s => engine.discardForAbility(s, this.abilityDiscard()));
  }
  continueDamage(): void { this.store.update(engine.continueDamage); }
  declareVictory(): void { this.store.update(engine.declareVictory); }
  pokerDraw(): void {
    if (this.pokerRolling()) return;
    const before = this.store.game();
    const newRound = this.pokerRolls() !== 1;
    this.store.update(s => engine.drawPoker(s, newRound));
    if (this.store.game() !== before && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.pokerRolling.set(true);
  }
  newGame(): void {
    if (this.store.game() && !this.setup()) this.open('new');
    else this.prepareSetup();
  }
  showArchive(): void {
    if (!this.store.game()) return;
    this.setup.set(false);
    this.tab.set('journal');
    requestAnimationFrame(() => window.scrollTo({ top: 0 }));
  }
  undo(): void {
    this.store.undo();
    this.setup.set(!this.store.game());
    if (!this.store.game()?.combat && this.tab() === 'combat') this.switchTab('turn');
  }
  protected readonly Math = Math;
}
