import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Placeholder animado mientras se cargan datos (evita saltos de layout). */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (r of items(); track r) {
      <div class="row" [style.width.%]="r"></div>
    }
  `,
  styles: `
    :host { display: grid; gap: .6rem; padding: .25rem 0; }
    .row { height: 14px; border-radius: 6px; background: linear-gradient(90deg, var(--surface-3) 25%, var(--surface-2) 50%, var(--surface-3) 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
    @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  `,
})
export class SkeletonComponent {
  readonly rows = input<number>(4);
  protected readonly items = computed(() => Array.from({ length: this.rows() }, (_, i) => 100 - ((i * 17) % 35)));
}
