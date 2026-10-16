import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './core/services/notification.service';
import { IconComponent } from './shared/components/icon.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, IconComponent],
  template: `
    <router-outlet />
    <div class="toasts" aria-live="polite" aria-atomic="false">
      @for (toast of notify.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast--' + toast.kind" role="status" [style.--ttl.ms]="toast.ttl">
          <app-icon [name]="toast.kind === 'success' ? 'check-circle' : toast.kind === 'error' ? 'alert' : 'info'" [size]="18" />
          <span>{{ toast.message }}</span>
          <button type="button" class="toast__close" (click)="notify.dismiss(toast.id)" aria-label="Cerrar notificación">
            <app-icon name="x" [size]="14" />
          </button>
          <i class="toast__bar"></i>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts { position: fixed; right: 1rem; bottom: 1rem; display: grid; gap: .5rem; z-index: 100; width: min(400px, calc(100vw - 2rem)); }
    .toast { position: relative; overflow: hidden; display: flex; align-items: center; gap: .65rem; padding: .8rem 1rem; border-radius: var(--radius-sm); background: var(--surface); color: var(--text); border: 1px solid var(--border); border-left: 4px solid var(--tone); box-shadow: var(--shadow); font-size: .9rem; animation: in .2s ease-out; }
    .toast app-icon { color: var(--tone); }
    .toast--success { --tone: var(--success); }
    .toast--error { --tone: var(--danger); }
    .toast--info { --tone: var(--primary); }
    .toast__close { margin-left: auto; background: none; border: 0; color: var(--muted); cursor: pointer; padding: .2rem; border-radius: 6px; display: inline-flex; }
    .toast__close:hover { background: var(--surface-3); color: var(--text); }
    .toast__bar { position: absolute; left: 0; bottom: 0; height: 2px; background: var(--tone); opacity: .5; animation: drain var(--ttl) linear forwards; }
    @keyframes in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes drain { from { width: 100%; } to { width: 0; } }
  `,
})
export class AppComponent {
  protected readonly notify = inject(NotificationService);
}
