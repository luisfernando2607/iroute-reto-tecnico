import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon.component';

/** Estado vacío con icono, título, descripción y acción opcional proyectada. */
@Component({
  selector: 'app-empty-state',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <div class="empty__icon"><app-icon [name]="icon()" [size]="26" /></div>
      <h3>{{ title() }}</h3>
      @if (description()) { <p class="muted">{{ description() }}</p> }
      <div class="empty__action"><ng-content /></div>
    </div>
  `,
  styles: `
    .empty { display: grid; justify-items: center; text-align: center; gap: .4rem; padding: 2.5rem 1rem; }
    .empty__icon { width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; background: var(--primary-soft); color: var(--primary); margin-bottom: .4rem; }
    h3 { margin: 0; font-size: 1rem; }
    p { max-width: 42ch; }
    .empty__action:not(:empty) { margin-top: .75rem; }
  `,
})
export class EmptyStateComponent {
  readonly icon = input<string>('inbox');
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
