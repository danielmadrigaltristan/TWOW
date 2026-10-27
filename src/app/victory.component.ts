import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SchoolId } from './models';

@Component({
  selector: 'app-victory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="automa-victory" aria-labelledby="victory-title" role="status">
      <h1 id="victory-title">Victoria del automa</h1>
      <img class="victory-witcher" [src]="portrait()" [alt]="'Brujo de la escuela de ' + schoolName()" />
      <button class="primary-button" type="button" (click)="newGame.emit()">Nueva partida</button>
    </section>
  `,
  styles: `
    :host { display: block; width: 100%; }
    .automa-victory { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; min-height: calc(100dvh - var(--shell-header-height) - var(--board-visible-height) - 90px); padding: 24px 0; text-align: center; }
    h1 { margin: 0; color: var(--control-brown); font-family: var(--serif); font-size: clamp(30px, 5vw, 56px); line-height: 1.15; }
    .victory-witcher { display: block; width: auto; height: min(52dvh, 500px); max-width: 100%; object-fit: contain; filter: sepia(.28) saturate(.72) contrast(.94); mask-image: linear-gradient(to right, transparent, #000 15%, #000 85%, transparent), linear-gradient(to bottom, transparent, #000 10%, #000 78%, transparent); mask-composite: intersect; }
    @media (max-width: 650px) {
      .automa-victory { gap: 20px; min-height: calc(100dvh - var(--shell-header-height) - var(--board-visible-height) - 60px); }
      .victory-witcher { height: min(55dvh, 420px); }
    }
  `,
})
export class VictoryComponent {
  readonly newGame = output<void>();
  readonly school = input.required<SchoolId>();
  readonly schoolName = input.required<string>();
  readonly portrait = computed(() => {
    const school = this.school();
    if (school === 'ciri') return 'schools/ciri.webp';
    const extension = school === 'manticore' ? 'webp' : school === 'viper' ? 'jpeg' : 'jpg';
    return `schools/portraits/${school}.${extension}`;
  });
}
