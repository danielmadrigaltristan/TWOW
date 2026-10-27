import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MutagenColor } from './models';
import { MUTAGEN_NAMES } from './mutagens';

@Component({
  selector: 'app-mutagen-tokens',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="mutagen-tokens" aria-label="Mutágenos">
      @for (color of tokens(); track $index; let i = $index) {
        @if (only() === undefined || only()!.includes(i)) {
          <li [class]="'mutagen-token ' + color" [class.exhausted]="dimSpent() && spent().includes(i)"
            [attr.aria-label]="'Mutágeno ' + names[color] + (spent().includes(i) ? ': agotado' : ': disponible')"
            [title]="'Mutágeno ' + names[color] + (spent().includes(i) ? ' · Agotado' : ' · Disponible')">
            <img [src]="'icons/mutagen-' + color + '.png'" alt="" aria-hidden="true" draggable="false" />
          </li>
        }
      }
    </ul>
  `,
  styles: `
    :host { display: inline-flex; min-width: 0; vertical-align: middle; }
    .mutagen-tokens { display: flex; flex-wrap: var(--mutagen-wrap, wrap); align-items: center; justify-content: center; gap: var(--mutagen-gap, 4px); list-style: none; margin: 0; padding: 0; }
    .mutagen-token { display: grid; place-items: center; flex: 0 0 var(--mutagen-size, 20px); width: var(--mutagen-size, 20px); height: calc(var(--mutagen-size, 20px) * 1.15); background: transparent; }
    .mutagen-token img { display: block; width: 100%; height: 100%; object-fit: contain; }
    .exhausted { opacity: .3; filter: grayscale(1); }
  `,
})
export class MutagenTokensComponent {
  readonly tokens = input.required<readonly MutagenColor[]>();
  readonly spent = input<readonly number[]>([]);
  readonly dimSpent = input(true);
  readonly only = input<readonly number[] | undefined>();
  readonly names = MUTAGEN_NAMES;
}
