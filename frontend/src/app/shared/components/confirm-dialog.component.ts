import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild } from '@angular/core';
import { IconComponent } from './icon.component';

/** Diálogo modal accesible basado en el elemento nativo <dialog>. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dlg class="dialog" (close)="onClose()" (click)="onBackdrop($event)">
      <div class="dialog__body">
        <div class="dialog__icon" [class.dialog__icon--danger]="tone() === 'danger'">
          <app-icon [name]="tone() === 'danger' ? 'alert' : 'info'" [size]="22" />
        </div>
        <h2>{{ title() }}</h2>
        <p class="text-2"><ng-content /></p>
        <div class="dialog__actions">
          <button type="button" class="btn" (click)="close(false)">{{ cancelLabel() }}</button>
          <button type="button" class="btn" [class.btn--primary]="tone() !== 'danger'" [class.btn--danger]="tone() === 'danger'" (click)="close(true)" autofocus>
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </dialog>
  `,
  styles: `
    .dialog { border: 0; padding: 0; border-radius: var(--radius); background: var(--surface); color: var(--text); box-shadow: var(--shadow); width: min(440px, calc(100vw - 2rem)); }
    .dialog::backdrop { background: rgba(10, 12, 20, .5); backdrop-filter: blur(2px); }
    .dialog[open] { animation: pop .18s ease-out; }
    .dialog__body { padding: 1.5rem; display: grid; gap: .6rem; }
    .dialog__icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: var(--primary-soft); color: var(--primary); }
    .dialog__icon--danger { background: var(--danger-soft); color: var(--danger); }
    .dialog__actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: .75rem; }
    @keyframes pop { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
  `,
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly tone = input<'primary' | 'danger'>('primary');
  readonly confirmed = output<void>();

  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');
  private result = false;

  open(): void {
    this.result = false;
    this.dlg().nativeElement.showModal();
  }

  protected close(confirmed: boolean): void {
    this.result = confirmed;
    this.dlg().nativeElement.close();
  }

  protected onClose(): void {
    if (this.result) this.confirmed.emit();
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dlg().nativeElement) this.close(false);
  }
}
