import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GameIconComponent } from './game-icon.component';

@Component({
  selector: 'app-deck-counter',
  standalone: true,
  imports: [GameIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="deck-counts">
      <span>Mazo <b>{{ deckCount() }}</b></span>
      <span>Descarte <b>{{ discardCount() }}</b></span>
      <span class="trophy-count" [attr.aria-label]="'Trofeos: ' + trophies()">Trofeos
        @for (n of [1, 2, 3, 4]; track n) {
          @if (n <= trophies()) { <app-icon name="trophy" /> }
        }
      </span>
    </div>
    <div class="deck-counter-actions"><ng-content /></div>
  `,
  styles: `
    :host { display: flex; align-items: center; gap: 16px; grid-column: 1 / -1; width: 100%; min-width: 0; color: var(--control-brown); }
    .deck-counts { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; min-width: 0; font-size: 13px; }
    .deck-counts > span { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
    .deck-counts b { font-size: 18px; font-variant-numeric: tabular-nums; }
    .trophy-count app-icon.game-symbol { width: 26px; height: 26px; }
    .deck-counter-actions { margin-left: auto; flex: 0 1 auto; max-width: 50%; }
    .deck-counter-actions:empty { display: none; }
    @media (max-width: 650px) {
      :host { gap: 10px; }
      .deck-counts { gap: 6px 12px; font-size: 11px; }
      .deck-counts b { font-size: 15px; }
      .trophy-count app-icon.game-symbol { width: 22px; height: 22px; }
      .deck-counter-actions { max-width: 45%; }
    }
  `,
})
export class DeckCounterComponent {
  readonly deckCount = input.required<number>();
  readonly discardCount = input.required<number>();
  readonly trophies = input.required<number>();
}
