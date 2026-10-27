import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
export const GAME_ICON_IMAGES: Readonly<Record<string, string>> = {
  trophy: 'icons/trophy.png',
  meditate: 'icons/meditate.png',
  monster: 'icons/monster.png',
  'monster-gold': 'icons/monster-gold.png',
  'enemy-witcher': 'icons/enemy-witcher.png',
  'combat-gold': 'icons/combat-gold.png',
  attack: 'icons/attack.png',
  defense: 'icons/defense.png',
  damage: 'icons/damage.png',
  discard: 'icons/discard-gold.png',
  shield: 'icons/shield.png',
  alchemy: 'icons/alchemy.png',
  special: 'icons/special.png',
  potion: 'icons/potion.png',
  bomb: 'icons/bomb-gold.png',
  trace: 'icons/trace.png',
  forest: 'icons/forest.png',
  mountain: 'icons/mountain.png',
  water: 'icons/water.png',
  lowest: 'icons/lowest.png',
  highest: 'icons/highest.png',
};
@Component({
  selector: 'app-icon',
  standalone: true,
  host: {
    '[class.game-symbol]': '!!image()',
    '[class.terrain-symbol]': "['forest', 'mountain', 'water'].includes(name())",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .bomb-symbol {
      display: block;
      width: 100%;
      height: 100%;
      background: var(--control-brown);
      mask-position: center;
      mask-repeat: no-repeat;
      mask-size: contain;
    }
  `,
  template: `@if (image(); as src) {
    @if (name() === 'bomb') {
      <span class="bomb-symbol" [style.mask-image]="'url(' + src + ')'" aria-hidden="true"></span>
    } @else {
    <img [src]="src" alt="" aria-hidden="true" draggable="false" />
    }
  } @else {<svg
    viewBox="0 0 32 32"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    @switch (name()) {
      @case ('info') {
        <circle cx="16" cy="16" r="12" /><path d="M16 14v9M16 9v.1" />
      }
      @case ('eye') {
        <path d="M2 16s5-9 14-9 14 9 14 9-5 9-14 9S2 16 2 16Z" /><circle cx="16" cy="16" r="4" />
      }
      @case ('eye-off') {
        <path d="M3 3l26 26M12 7a16 16 0 0 1 4 0c9 0 14 9 14 9a25 25 0 0 1-5 6M7 9a25 25 0 0 0-5 7s5 9 14 9a16 16 0 0 0 6-1M13 13a4 4 0 0 0 6 6" />
      }
      @case ('pin') {
        <g transform="rotate(35 16 16)">
          <path d="M10 4h12v3h-2v9l4 4v3H8v-3l4-4V7h-2zM16 23v7" />
        </g>
      }
      @case ('move') {
        <path d="m19 4 8 8-8 8m8-8H12c-5 0-6 5-6 9v7m-3-3 3 3 3-3" />
      }
      @case ('forest') {
        <path d="m16 3-8 10h4L5 23h9v6h4v-6h9l-7-10h4z" />
      }
      @case ('mountain') {
        <path d="M3 27 15 5l14 22zM10 14l5 4 4-5" />
      }
      @case ('water') {
        <path d="M16 3S5 16 5 22c0 10 22 10 22 0C27 16 16 3 16 3ZM10 22c0 3 2 4 5 4" />
      }
      @case ('book') {
        <path
          d="M16 7C12 4 7 4 3 5v22c5-2 10-1 13 1 3-2 8-3 13-1V5c-4-1-9-1-13 2zm0 0v21M7 10h5m-5 5h5m8-5h5m-5 5h5"
        />
      }
      @case ('sword') {
        <path d="m24 3 4 2-9 16-3-2zM10 19l10 6m-5-4-5 8-3-2 5-8" />
      }
      @case ('check') {
        <path d="m6 17 6 6L27 7" />
      }
      @case ('undo') {
        <path d="m11 5-7 7 7 7m-7-7h15c12 0 11 17 0 17h-4" />
      }
      @case ('sun') {
        <circle cx="16" cy="16" r="6" />
        <path d="M16 2v3m0 22v3M2 16h3m22 0h3M6 6l2 2m16 16 2 2M6 26l2-2M24 8l2-2" />
      }
      @default {
        <path d="m16 3 13 13-13 13L3 16zM16 10v8m0 5v.1" />
      }
    }
  </svg>}`,
})
export class GameIconComponent {
  readonly name = input.required<string>();
  readonly image = computed(() => GAME_ICON_IMAGES[this.name()]);
}
