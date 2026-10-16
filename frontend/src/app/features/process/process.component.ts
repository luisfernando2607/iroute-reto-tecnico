import { Component, computed, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ProcessDateSummary, ProcessResult } from '../../core/models/commerce.models';
import { CommerceApiService } from '../../core/services/commerce-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { SkeletonComponent } from '../../shared/components/skeleton.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';

/** Pantalla 2: elegir una fecha de proceso (pc_processdate) y ejecutar la validación. */
@Component({
  selector: 'app-process',
  imports: [FormsModule, IconComponent, SkeletonComponent, EmptyStateComponent, ConfirmDialogComponent, StatCardComponent],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <div class="page__step"><app-icon name="play" [size]="14" /> Paso 2 de 3</div>
          <h1>Procesar información</h1>
          <p>Valida los registros cargados de una fecha. Los que incumplen las reglas se mueven a <code>commerce_quarantine</code> con su motivo.</p>
        </div>
        <button type="button" class="btn btn--sm" (click)="loadSummary()" [disabled]="loading()"><app-icon name="refresh" [size]="15" /> Actualizar</button>
      </header>

      <div class="grid">
        <div class="card">
          <div class="card__header"><h2>Fecha a procesar</h2></div>
          <form class="toolbar" (ngSubmit)="askConfirm()">
            <label class="field">
              <span>pc_processdate</span>
              <input type="date" name="date" [(ngModel)]="selectedDate" required />
            </label>
            <button type="submit" class="btn btn--primary" [disabled]="!selectedDate || running()">
              @if (running()) { <span class="spinner"></span> Procesando… } @else { <app-icon name="play" [size]="16" /> Procesar }
            </button>
          </form>

          @if (summary().length) {
            <p class="muted small">Fechas con registros pendientes:</p>
            <div class="chips">
              @for (s of pendingDates(); track s.processDate) {
                <button type="button" class="chip chip--btn" [class.is-active]="selectedDate === s.processDate" (click)="selectedDate = s.processDate">
                  <app-icon name="calendar" [size]="13" /> {{ s.processDate }} <span class="count">{{ s.pendingCount }}</span>
                </button>
              } @empty {
                <span class="muted small">Ninguna. Todas las fechas ya fueron procesadas.</span>
              }
            </div>
          }

          <div class="alert alert--info rules">
            <app-icon name="info" [size]="18" />
            <div>
              <strong>Reglas de validación</strong>
              <ul>
                <li><code>pc_nomcomred</code> no debe estar vacío.</li>
                <li><code>pc_numdoc</code> no debe estar vacío ni contener letras o caracteres especiales.</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card__header"><h2>Último resultado</h2></div>
          @if (lastResult(); as r) {
            <div class="stats">
              <app-stat-card [value]="r.processDate" label="fecha procesada" icon="calendar" tone="primary" />
              <app-stat-card [value]="r.quarantinedCount" label="enviados a cuarentena" icon="shield" [tone]="r.quarantinedCount ? 'danger' : 'success'" />
            </div>
            <div class="card__footer">
              @if (r.quarantinedCount) {
                <span class="text-2">Revise los motivos de cada rechazo.</span>
              } @else {
                <span class="text-2">Todos los registros de la fecha son válidos.</span>
              }
              <span class="toolbar__spacer"></span>
              <button type="button" class="btn btn--primary" (click)="goToQuarantine(r.processDate)">Ver cuarentena <app-icon name="arrow-right" [size]="16" /></button>
            </div>
          } @else {
            <app-empty-state icon="play" title="Aún no se ha procesado nada" description="Elija una fecha y pulse Procesar. El resultado aparecerá aquí." />
          }
        </div>
      </div>

      <div class="card">
        <div class="card__header">
          <h2>Estado por fecha de proceso</h2>
          <span class="muted small">{{ summary().length }} fecha(s)</span>
        </div>
        @if (loading() && !summary().length) {
          <app-skeleton [rows]="4" />
        } @else if (!summary().length) {
          <app-empty-state icon="database" title="No hay registros cargados" description="Cargue un archivo commerce_DDMMYYYY.csv para comenzar.">
            <button type="button" class="btn btn--primary" (click)="goToUpload()"><app-icon name="upload" [size]="16" /> Cargar archivo</button>
          </app-empty-state>
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr><th>Fecha</th><th class="num">Pendientes</th><th class="num">En cuarentena</th><th>Tasa de rechazo</th><th class="actions">Acciones</th></tr>
              </thead>
              <tbody>
                @for (s of summary(); track s.processDate) {
                  <tr>
                    <td class="mono">{{ s.processDate }}</td>
                    <td class="num">
                      @if (s.pendingCount) { {{ s.pendingCount }} } @else { <span class="chip chip--success"><app-icon name="check" [size]="12" /> procesada</span> }
                    </td>
                    <td class="num">{{ s.quarantinedCount }}</td>
                    <td>
                      <div class="rate">
                        <div class="bar" [attr.aria-label]="rate(s) + '% rechazado'"><span [style.width.%]="rate(s)"></span></div>
                        <span class="muted small">{{ rate(s) }}%</span>
                      </div>
                    </td>
                    <td class="actions">
                      <button type="button" class="btn btn--sm" (click)="selectedDate = s.processDate; askConfirm()" [disabled]="running() || !s.pendingCount">
                        <app-icon name="play" [size]="14" /> Procesar
                      </button>
                      <button type="button" class="btn btn--sm btn--ghost" (click)="goToQuarantine(s.processDate)" [disabled]="!s.quarantinedCount">
                        <app-icon name="shield" [size]="14" /> Cuarentena
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </section>

    <app-confirm-dialog #confirm title="Procesar fecha" confirmLabel="Sí, procesar" (confirmed)="run()">
      Se validarán los registros de <strong>{{ selectedDate }}</strong>. Los que incumplan las reglas se eliminarán de
      <code>commerce</code> y pasarán a <code>commerce_quarantine</code>. Esta acción no se puede deshacer.
    </app-confirm-dialog>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.25rem; }
    .small { font-size: .82rem; }
    .chips { margin: .4rem 0 1rem; }
    .count { background: rgba(0,0,0,.08); border-radius: 999px; padding: 0 .4rem; font-size: .72rem; }
    .chip--btn.is-active .count { background: rgba(255,255,255,.25); }
    .rules { margin-top: .5rem; }
    .rules ul { margin: .25rem 0 0; padding-left: 1.1rem; }
    .stats { display: flex; gap: .75rem; flex-wrap: wrap; }
    .rate { display: flex; align-items: center; gap: .6rem; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class ProcessComponent implements OnInit {
  private readonly api = inject(CommerceApiService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly confirm = viewChild.required<ConfirmDialogComponent>('confirm');

  /** Query param `?date=yyyy-MM-dd` (enlazado por withComponentInputBinding). */
  readonly date = input<string | undefined>();

  protected selectedDate = '';
  protected readonly running = signal(false);
  protected readonly loading = signal(false);
  protected readonly summary = signal<ProcessDateSummary[]>([]);
  protected readonly lastResult = signal<ProcessResult | null>(null);
  protected readonly pendingDates = computed(() => this.summary().filter((s) => s.pendingCount > 0));

  ngOnInit(): void {
    this.selectedDate = this.date() ?? '';
    this.loadSummary();
  }

  protected loadSummary(): void {
    this.loading.set(true);
    this.api
      .getSummary()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((rows) => {
        this.summary.set(rows);
        if (!this.selectedDate) this.selectedDate = rows.find((r) => r.pendingCount > 0)?.processDate ?? rows[0]?.processDate ?? '';
      });
  }

  protected askConfirm(): void {
    if (!this.selectedDate || this.running()) return;
    this.confirm().open();
  }

  protected run(): void {
    if (!this.selectedDate || this.running()) return;
    this.running.set(true);
    this.api
      .process(this.selectedDate)
      .pipe(finalize(() => this.running.set(false)))
      .subscribe((res) => {
        this.lastResult.set(res);
        this.notify.success(`${res.quarantinedCount} registro(s) enviados a cuarentena.`);
        this.loadSummary();
      });
  }

  protected rate(s: ProcessDateSummary): number {
    const total = s.pendingCount + s.quarantinedCount;
    return total ? Math.round((s.quarantinedCount / total) * 100) : 0;
  }

  protected goToQuarantine(date: string): void {
    void this.router.navigate(['/quarantine'], { queryParams: { date } });
  }

  protected goToUpload(): void {
    void this.router.navigate(['/upload']);
  }
}
