import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon.component';

/** Métrica destacada (valor grande + etiqueta + icono). */
@Component({
  selector: 'app-stat-card',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat" [class]="'stat stat--' + tone()">
      <div class="stat__icon"><app-icon [name]="icon()" [size]="18" /></div>
      <div>
        <div class="stat__value">{{ value() }}</div>
        <div class="stat__label">{{ label() }}</div>
      </div>
    </div>
  `,
  styles: `
    .stat { display: flex; align-items: center; gap: .9rem; padding: .9rem 1.1rem; border-radius: var(--radius-sm); background: var(--surface-2); border: 1px solid var(--border); min-width: 170px; flex: 1; }
    .stat__icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: var(--surface-3); color: var(--text-2); }
    .stat__value { font-size: 1.5rem; font-weight: 700; letter-spacing: -.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .stat__label { font-size: .8rem; color: var(--muted); }
    .stat--success .stat__icon { background: var(--success-soft); color: var(--success); }
    .stat--success .stat__value { color: var(--success); }
    .stat--danger .stat__icon { background: var(--danger-soft); color: var(--danger); }
    .stat--danger .stat__value { color: var(--danger); }
    .stat--warning .stat__icon { background: var(--warning-soft); color: var(--warning); }
    .stat--warning .stat__value { color: var(--warning); }
    .stat--primary .stat__icon { background: var(--primary-soft); color: var(--primary); }
  `,
})
export class StatCardComponent {
  readonly value = input.required<string | number>();
  readonly label = input.required<string>();
  readonly icon = input<string>('info');
  readonly tone = input<'neutral' | 'primary' | 'success' | 'danger' | 'warning'>('neutral');
}
