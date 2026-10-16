import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PagedResult, ProcessDateSummary, QuarantinedCommerce } from '../../core/models/commerce.models';
import { CommerceApiService } from '../../core/services/commerce-api.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { SkeletonComponent } from '../../shared/components/skeleton.component';

/** Pantalla 3: registros en cuarentena y los motivos por los que fueron rechazados. */
@Component({
  selector: 'app-quarantine',
  imports: [FormsModule, DatePipe, IconComponent, SkeletonComponent, EmptyStateComponent],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <div class="page__step"><app-icon name="shield" [size]="14" /> Paso 3 de 3</div>
          <h1>Registros con errores</h1>
          <p>Comercios movidos a <code>commerce_quarantine</code> y el motivo de cada rechazo.</p>
        </div>
        <button type="button" class="btn btn--sm" (click)="exportCsv()" [disabled]="!page()?.items?.length">
          <app-icon name="download" [size]="15" /> Exportar página (CSV)
        </button>
      </header>

      <div class="card">
        <form class="toolbar" (ngSubmit)="search()">
          <label class="field">
            <span>Fecha de proceso</span>
            <input type="date" name="date" [(ngModel)]="filterDate" />
          </label>
          <label class="field">
            <span>Por página</span>
            <select name="pageSize" [(ngModel)]="pageSize" (ngModelChange)="search()">
              @for (n of pageSizes; track n) { <option [ngValue]="n">{{ n }}</option> }
            </select>
          </label>
          <button type="submit" class="btn btn--primary" [disabled]="loading()"><app-icon name="search" [size]="16" /> Buscar</button>
          @if (filterDate) {
            <button type="button" class="btn btn--ghost" (click)="filterDate = ''; search()"><app-icon name="x" [size]="15" /> Limpiar</button>
          }
          <span class="toolbar__spacer"></span>
          <span class="chip chip--danger"><app-icon name="shield" [size]="13" /> {{ page()?.total ?? 0 }} en cuarentena</span>
        </form>

        @if (datesWithIssues().length) {
          <div class="chips dates">
            <button type="button" class="chip chip--btn" [class.is-active]="!filterDate" (click)="filterDate = ''; search()">Todas</button>
            @for (s of datesWithIssues(); track s.processDate) {
              <button type="button" class="chip chip--btn" [class.is-active]="filterDate === s.processDate" (click)="filterDate = s.processDate; search()">
                <app-icon name="calendar" [size]="13" /> {{ s.processDate }} <span class="count">{{ s.quarantinedCount }}</span>
              </button>
            }
          </div>
        }
      </div>

      <div class="card">
        @if (loading() && !page()) {
          <app-skeleton [rows]="6" />
        } @else if (!page()?.items?.length) {
          <app-empty-state icon="check-circle" title="Sin registros en cuarentena"
            [description]="filterDate ? 'No hay rechazos para la fecha ' + filterDate + '.' : 'Procese una fecha para ver aquí los registros rechazados.'">
            <button type="button" class="btn" (click)="goToProcess()"><app-icon name="play" [size]="16" /> Ir a procesar</button>
          </app-empty-state>
        } @else {
          <div class="table-wrap" [class.is-loading]="loading()">
            <table class="table">
              <thead>
                <tr>
                  <th>Código</th><th>Comercio</th><th>Documento</th><th>Fecha proceso</th><th>Motivo del rechazo</th><th>Cuarentena desde</th>
                </tr>
              </thead>
              <tbody>
                @for (q of page()!.items; track q.id) {
                  <tr>
                    <td class="mono">{{ q.codCom || '—' }}</td>
                    <td>
                      <div class="name" [class.cell--empty]="!q.nomComRed">{{ q.nomComRed || '(vacío)' }}</div>
                      <div class="muted small">{{ q.email || q.telefono || q.direccion || '' }}</div>
                    </td>
                    <td>
                      <span class="muted small">{{ q.tipoDoc || '—' }}</span>
                      <span class="mono doc" [class.cell--empty]="!q.numDoc">{{ q.numDoc || '(vacío)' }}</span>
                    </td>
                    <td class="mono">{{ q.processDate }}</td>
                    <td class="motivo">
                      @for (m of splitMotivo(q.motivo); track m) { <span class="chip chip--danger">{{ m }}</span> }
                    </td>
                    <td class="muted small">{{ q.quarantinedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <nav class="pager" aria-label="Paginación">
            <span class="muted">Mostrando {{ rangeStart() }}–{{ rangeEnd() }} de {{ page()!.total }}</span>
            <div class="pager__pages">
              <button type="button" class="btn btn--sm" (click)="go(currentPage() - 1)" [disabled]="currentPage() <= 1 || loading()"><app-icon name="chevron-left" [size]="15" /> Anterior</button>
              <span class="text-2">Página {{ currentPage() }} de {{ totalPages() }}</span>
              <button type="button" class="btn btn--sm" (click)="go(currentPage() + 1)" [disabled]="currentPage() >= totalPages() || loading()">Siguiente <app-icon name="chevron-right" [size]="15" /></button>
            </div>
          </nav>
        }
      </div>
    </section>
  `,
  styles: `
    .small { font-size: .8rem; }
    .dates { margin-top: .9rem; }
    .count { background: rgba(0,0,0,.08); border-radius: 999px; padding: 0 .4rem; font-size: .72rem; }
    .chip--btn.is-active .count { background: rgba(255,255,255,.25); }
    .name { font-weight: 500; }
    .doc { display: block; }
    .motivo { white-space: normal; max-width: 380px; }
    .motivo .chip { margin: .1rem .25rem .1rem 0; }
    .is-loading { opacity: .5; pointer-events: none; }
  `,
})
export class QuarantineComponent implements OnInit {
  private readonly api = inject(CommerceApiService);
  private readonly router = inject(Router);

  /** Query param `?date=yyyy-MM-dd`. */
  readonly date = input<string | undefined>();

  protected readonly pageSizes = [10, 25, 50, 100];
  protected filterDate = '';
  protected pageSize = 25;
  protected readonly loading = signal(false);
  protected readonly page = signal<PagedResult<QuarantinedCommerce> | null>(null);
  protected readonly summary = signal<ProcessDateSummary[]>([]);
  protected readonly datesWithIssues = computed(() => this.summary().filter((s) => s.quarantinedCount > 0));
  protected readonly currentPage = computed(() => this.page()?.page ?? 1);
  protected readonly totalPages = computed(() => Math.max(this.page()?.totalPages ?? 1, 1));
  protected readonly rangeStart = computed(() => (this.page()?.total ? (this.currentPage() - 1) * this.pageSize + 1 : 0));
  protected readonly rangeEnd = computed(() => Math.min(this.currentPage() * this.pageSize, this.page()?.total ?? 0));

  ngOnInit(): void {
    this.filterDate = this.date() ?? '';
    this.search();
    this.api.getSummary().subscribe((rows) => this.summary.set(rows));
  }

  protected search(): void {
    this.go(1);
  }

  protected go(pageNumber: number): void {
    this.loading.set(true);
    this.api
      .getQuarantine(this.filterDate || null, pageNumber, this.pageSize)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((res) => this.page.set(res));
  }

  protected splitMotivo(motivo: string): string[] {
    return motivo.split(';').map((m) => m.trim()).filter(Boolean);
  }

  protected goToProcess(): void {
    void this.router.navigate(['/process']);
  }

  /** Descarga la página visible como CSV (separador ';', compatible con Excel en es-ES). */
  protected exportCsv(): void {
    const items = this.page()?.items ?? [];
    if (!items.length) return;
    const cols: (keyof QuarantinedCommerce)[] = ['codCom', 'nomComRed', 'tipoDoc', 'numDoc', 'direccion', 'telefono', 'email', 'processDate', 'motivo', 'quarantinedAt'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [cols.join(';'), ...items.map((i) => cols.map((c) => esc(i[c])).join(';'))];
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commerce_quarantine_${this.filterDate || 'todas'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
