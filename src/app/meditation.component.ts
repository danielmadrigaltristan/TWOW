import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ATTRIBUTES, Attribute, LABELS } from './models';
import { GameIconComponent } from './game-icon.component';

@Component({
  selector: 'app-meditation',
  standalone: true,
  imports: [GameIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="meditation-trophies" aria-label="Trofeos de meditación disponibles">
      @for (a of attributes; track a) {
        <button type="button" class="meditation-trophy" [class.unavailable]="!available()[a]"
          [attr.aria-pressed]="!available()[a]"
          (click)="availabilityChange.emit({ attribute: a, available: !available()[a] })">
          <app-icon [name]="a" />
          <strong>{{ labels[a] }}</strong>
          <span>{{ available()[a] ? 'Disponible' : 'No disponible' }}</span>
        </button>
      }
    </section>
  `,
  styles: `
    :host { display: block; width: 100%; }
    .meditation-trophies { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; margin-top: 28px; }
    .meditation-trophy { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; min-width: 0; padding: 36px 12px 24px; border: 0; background: transparent; color: var(--control-brown); cursor: pointer; }
    .meditation-trophy.unavailable { opacity: .45; filter: grayscale(1); }
    .meditation-trophy:focus-visible { outline: none; }
    .meditation-trophy:focus-visible strong { text-decoration: underline; text-underline-offset: 5px; }
    app-icon.game-symbol { width: 58px; height: 58px; }
    strong { font-size: 16px; }
    span { font-size: 12px; }
    @media (max-width: 850px) { .meditation-trophies { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; } }
    @media (max-width: 450px) { strong { font-size: 14px; } .meditation-trophy { padding-inline: 8px; } }
  `,
})
export class MeditationComponent {
  readonly available = input.required<Record<Attribute, boolean>>();
  readonly availabilityChange = output<{ attribute: Attribute; available: boolean }>();
  readonly attributes = ATTRIBUTES;
  readonly labels = LABELS;
}
