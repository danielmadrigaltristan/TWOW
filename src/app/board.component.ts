import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { GameStore } from './game.store';
import { GameIconComponent } from './game-icon.component';
import { ATTRIBUTES, shieldLimit, Attribute, LABELS, Terrain, TERRAIN_NAMES } from './models';
import { automaLevel, changeAttribute, log } from './engine';
import { MutagenTokensComponent } from './mutagen-tokens.component';
@Component({
  selector: 'app-board',
  standalone: true,
  imports: [GameIconComponent, MutagenTokensComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.board-expanded]': 'expanded()',
    '[class.has-mutagens]': '!!store.game()?.mutagenModule',
    '(document:click)': 'closeOnOutsideClick($event)',
  },
  template: `@if (store.game(); as g) {
    <aside id="player-dock" class="player-dock" aria-label="Tablero del automa" [style.--school-color]="store.school().color">
      <div id="player-board-details" class="dock-core" [class.is-hidden]="!expanded()" [inert]="!expanded()" [attr.aria-hidden]="!expanded()">
        <section class="dock-shield" aria-label="Escudo del automa">
          <div class="dock-track-title"><app-icon name="shield" /><span>Escudo</span></div>
          @for (n of shieldLevels; track n) {
            <button class="dock-shield-step" [class.marker]="g.shield === n" [attr.aria-pressed]="g.shield === n" [attr.aria-label]="'Escudo ' + n" [disabled]="n > shieldLimit(g.attributes.defense)" (click)="setShield(n)">{{ n }}</button>
          }
        </section>
        <div class="dock-character">
          <div class="dock-portrait">
            <img [src]="portrait()" [alt]="'Brujo de la escuela de ' + store.school().name" draggable="false" />
          </div>
          <button class="dock-school-ability" [attr.aria-label]="'Ver especialidad: ' + store.school().name" [title]="'Especialidad de ' + store.school().name" (click)="ability.emit()">
            @if (g.school === 'ciri') {
              <app-icon name="special" />
            } @else {
              <img [src]="'schools/emblems/' + g.school + '.png'" alt="" draggable="false" />
            }
          </button>
        </div>
        <div class="dock-attributes">
          @for (a of attrs; track a) {
            <section class="dock-attribute" [class.maxed]="g.attributes[a] === 5" [attr.aria-label]="labels[a]">
              <div class="dock-track-title"><app-icon [name]="a" /><span>{{ labels[a] }}</span></div>
              @for (n of levels; track n) {
                <button class="dock-attribute-step" [class.marker]="g.attributes[a] === n" [attr.aria-pressed]="g.attributes[a] === n" [attr.aria-label]="labels[a] + ' nivel ' + n" [disabled]="g.attributes[a] === 5 && n !== 5" (click)="setAttribute(a, n)"><span>{{ n }}</span></button>
              }
            </section>
          }
        </div>
        <section id="dock-resources" class="dock-resources" aria-label="Recursos del automa">
          <div class="dock-resource"><span><app-icon name="potion" />Pociones</span><button aria-label="Gastar poción" [disabled]="!g.potions" (click)="resource('potions', -1)">−</button><b>{{ g.potions }}/4</b><button aria-label="Añadir poción" [disabled]="g.potions === 4" (click)="resource('potions', 1)">+</button></div>
          @if (g.bombModule) {
            <div class="dock-resource"><span><app-icon name="bomb" />Bombas</span><button aria-label="Gastar bomba" [disabled]="!g.bombs" (click)="resource('bombs', -1)">−</button><b>{{ g.bombs }}/4</b><button aria-label="Añadir bomba" [disabled]="g.bombs === 4" (click)="resource('bombs', 1)">+</button></div>
          }
          <ul class="dock-traces" aria-label="Rastros del automa">
            @for (t of terrains; track t) {
              <li [attr.aria-label]="g.traces.includes(t) ? 'Rastro de ' + terrainNames[t] : null" [attr.aria-hidden]="!g.traces.includes(t)">
                @if (g.traces.includes(t)) {
                  <app-icon [name]="t" [title]="'Rastro de ' + terrainNames[t]" />
                }
              </li>
            }
          </ul>
          @if (g.mutagenModule) {
            <div class="dock-mutagens"><span>Mutágenos · Nivel {{ automaLevel(g) }}</span>
              <app-mutagen-tokens [tokens]="g.mutagens ?? []" [spent]="g.combat?.mutagensSpent ?? []" />
            </div>
          }
        </section>
      </div>
      <div class="dock-summary" aria-label="Resumen del automa">
        <button class="summary-school" [attr.aria-label]="'Ver especialidad: ' + store.school().name" [title]="'Especialidad de ' + store.school().name" (click)="ability.emit()">
          @if (g.school === 'ciri') {
            <app-icon name="special" />
          } @else {
            <img [src]="'schools/emblems/' + g.school + '.png'" alt="" draggable="false" />
          }
        </button>
        <div class="summary-values">
          <span class="summary-stat" [attr.aria-label]="'Escudo: ' + g.shield" title="Escudo"><app-icon name="shield" /><b>{{ g.shield }}</b></span>
          @for (a of attrs; track a) {
            <span class="summary-stat" [attr.aria-label]="labels[a] + ': ' + g.attributes[a]" [title]="labels[a]"><app-icon [name]="a" /><b>{{ g.attributes[a] }}</b></span>
          }
          <span class="summary-stat" [attr.aria-label]="'Pociones: ' + g.potions" title="Pociones"><app-icon name="potion" /><b>{{ g.potions }}</b></span>
          @if (g.bombModule) {
            <span class="summary-stat" [attr.aria-label]="'Bombas: ' + g.bombs" title="Bombas"><app-icon name="bomb" /><b>{{ g.bombs }}</b></span>
          }
          @if (g.mutagenModule) {
            <span class="summary-mutagens" [title]="'Nivel del automa: ' + automaLevel(g)"><small>N{{ automaLevel(g) }}</small>
              <app-mutagen-tokens [tokens]="g.mutagens ?? []" [spent]="g.combat?.mutagensSpent ?? []" />
            </span>
          }
          <ul class="summary-traces" aria-label="Rastros del automa">
            @for (t of terrains; track t) {
              <li [attr.aria-label]="g.traces.includes(t) ? 'Rastro de ' + terrainNames[t] : null" [attr.aria-hidden]="!g.traces.includes(t)">
                @if (g.traces.includes(t)) { <app-icon [name]="t" [title]="'Rastro de ' + terrainNames[t]" /> }
              </li>
            }
          </ul>
        </div>
        <button class="summary-toggle" [attr.aria-label]="expanded() ? 'Ocultar tablero' : 'Mostrar tablero'" [title]="expanded() ? 'Ocultar tablero' : 'Mostrar tablero'" [attr.aria-expanded]="expanded()" aria-controls="player-board-details" (click)="expanded.set(!expanded())">
          <app-icon [name]="expanded() ? 'eye-off' : 'eye'" />
        </button>
      </div>
    </aside>
  }`,
})
export class BoardComponent {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly expanded = signal(false);
  closeOnOutsideClick(event: MouseEvent): void {
    if (this.expanded() && !event.composedPath().includes(this.element.nativeElement)) {
      this.expanded.set(false);
    }
  }
  readonly store = inject(GameStore);
  readonly portrait = computed(() => {
    const school = this.store.game()?.school ?? 'wolf';
    if (school === 'ciri') return 'schools/ciri.webp';
    let extension = 'jpg';
    if (school === 'manticore') extension = 'webp';
    else if (school === 'viper') extension = 'jpeg';
    return `schools/portraits/${school}.${extension}`;
  });
  readonly ability = output<void>();
  readonly automaLevel = automaLevel;
  readonly attrs = ATTRIBUTES;
  readonly shieldLimit = shieldLimit;
  readonly labels = LABELS;
  readonly levels = [5, 4, 3, 2, 1];
  readonly shieldLevels = [4, 3, 2, 1, 0];
  readonly terrains: Terrain[] = ['forest', 'mountain', 'water'];
  readonly terrainNames = TERRAIN_NAMES;
  setAttribute(a: Attribute, value: number): void {
    this.store.update((s) => {
      if (s.attributes[a] === value) return;
      changeAttribute(s, a, value - s.attributes[a]);
      log(s, `${LABELS[a]}: nivel ${s.attributes[a]}.`);
    });
  }
  setShield(value: number): void {
    this.store.update(s => { s.shield = Math.max(0, Math.min(shieldLimit(s.attributes.defense), value)); });
  }
  resource(key: 'shield' | 'potions' | 'bombs', delta: number): void {
    this.store.update((s) => {
      s[key] = Math.max(0, Math.min(key === 'shield' ? shieldLimit(s.attributes.defense) : 4, s[key] + delta));
    });
  }
}
