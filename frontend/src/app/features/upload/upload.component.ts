import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { UploadResult } from '../../core/models/commerce.models';
import { CommerceApiService } from '../../core/services/commerce-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import {
  CsvPreview,
  FILE_NAME_PATTERN,
  missingColumns,
  parseCsvPreview,
  rowIssues,
} from '../../shared/utils/csv-preview.util';

const PREVIEW_ROWS = 200;

interface Check {
  label: string;
  ok: boolean;
}

/** Pantalla 1: selección del archivo commerce_DDMMYYYY.csv, previsualización y envío al API. */
@Component({
  selector: 'app-upload',
  imports: [IconComponent, StatCardComponent],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <div class="page__step"><app-icon name="upload" [size]="14" /> Paso 1 de 3</div>
          <h1>Cargar archivo</h1>
          <p>Seleccione el archivo <code>commerce_DDMMYYYY.csv</code>, revise la previsualización y envíelo al servidor.</p>
        </div>
      </header>

      @if (!file()) {
        <div
          class="dropzone"
          [class.dropzone--active]="dragging()"
          (dragover)="onDragOver($event)"
          (dragleave)="dragging.set(false)"
          (drop)="onDrop($event)"
          (click)="input.click()"
          (keydown.enter)="input.click()"
          (keydown.space)="input.click(); $event.preventDefault()"
          tabindex="0"
          role="button"
          aria-label="Seleccionar archivo CSV"
        >
          <input #input type="file" accept=".csv,text/csv" hidden (change)="onInputChange(input)" />
          <div class="dropzone__icon"><app-icon name="upload" [size]="26" /></div>
          <p class="dropzone__title">Arrastre el archivo aquí o <span class="link">explore su equipo</span></p>
          <p class="muted">Solo archivos .csv con el formato <code>commerce_DDMMYYYY.csv</code></p>
        </div>

        <div class="card sample">
          <div class="sample__icon"><app-icon name="file" [size]="20" /></div>
          <div class="sample__text">
            <strong>¿No tiene un archivo a mano? Use el ejemplo de prueba.</strong>
            <span class="muted">{{ sampleName }} · 10 comercios, 5 con errores (nombre vacío, documento vacío, con letras o caracteres especiales).</span>
          </div>
          <div class="sample__actions">
            <a class="btn btn--sm" [href]="sampleUrl" [download]="sampleName"><app-icon name="download" [size]="15" /> Descargar</a>
            <button type="button" class="btn btn--sm btn--primary" (click)="loadSample()" [disabled]="loadingSample()">
              @if (loadingSample()) { <span class="spinner"></span> } @else { <app-icon name="play" [size]="15" /> }
              Probar con el ejemplo
            </button>
          </div>
        </div>
      } @else {
        <div class="card filecard">
          <div class="filecard__icon"><app-icon name="file" [size]="22" /></div>
          <div class="filecard__meta">
            <strong>{{ file()!.name }}</strong>
            <span class="muted">{{ (file()!.size / 1024).toFixed(1) }} KB · {{ preview()?.totalRows ?? 0 }} filas · delimitador "{{ preview()?.delimiter }}"</span>
          </div>
          <ul class="checklist">
            @for (c of checks(); track c.label) {
              <li [class.ok]="c.ok" [class.ko]="!c.ok"><app-icon [name]="c.ok ? 'check-circle' : 'alert'" [size]="16" /> {{ c.label }}</li>
            }
          </ul>
          <button type="button" class="btn btn--ghost btn--sm" (click)="reset()" [disabled]="sending()"><app-icon name="trash" [size]="15" /> Quitar</button>
        </div>
      }

      @if (preview(); as p) {
        @if (!result()) {
          <div class="card">
            <div class="card__header">
              <h2>Previsualización</h2>
              @if (p.totalRows > p.rows.length) { <span class="chip">Mostrando {{ p.rows.length }} de {{ p.totalRows }}</span> }
              @if (suspectCount() > 0) {
                <span class="chip chip--warning"><app-icon name="alert" [size]="13" /> {{ suspectCount() }} fila(s) irían a cuarentena</span>
              } @else if (p.totalRows > 0) {
                <span class="chip chip--success"><app-icon name="check" [size]="13" /> Sin problemas detectados</span>
              }
            </div>

            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>#</th>
                    @for (h of p.headers; track $index) { <th>{{ h }}</th> }
                  </tr>
                </thead>
                <tbody>
                  @for (row of p.rows; track $index; let r = $index) {
                    <tr>
                      <td class="muted mono">{{ r + 2 }}</td>
                      @for (h of p.headers; track $index; let i = $index) {
                        <td [class.cell--bad]="isBadCell(h, row, p.headers)" [class.cell--empty]="!row[i]" [attr.title]="cellTitle(h, row, p.headers)">
                          {{ row[i] || '(vacío)' }}
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="card__footer">
              <p class="muted legend"><span class="legend__swatch"></span> Celdas que incumplen las reglas de validación (se confirman al procesar).</p>
              <span class="toolbar__spacer"></span>
              <button type="button" class="btn btn--primary" (click)="send()" [disabled]="!canSend() || sending()">
                @if (sending()) { <span class="spinner"></span> Enviando… } @else { <app-icon name="upload" [size]="16" /> Enviar al servidor }
              </button>
            </div>
          </div>
        }
      }

      @if (result(); as r) {
        <div class="card result">
          <div class="card__header">
            <h2><app-icon name="check-circle" [size]="18" /> Archivo cargado correctamente</h2>
          </div>
          <div class="stats">
            <app-stat-card [value]="r.totalRows" label="filas leídas" icon="file" />
            <app-stat-card [value]="r.insertedRows" label="insertadas en commerce" icon="database" tone="success" />
            <app-stat-card [value]="r.errors.length" label="con error de formato" icon="alert" [tone]="r.errors.length ? 'warning' : 'neutral'" />
          </div>
          @if (r.errors.length) {
            <details class="errors">
              <summary>Ver {{ r.errors.length }} error(es) de formato (no se insertaron)</summary>
              <ul>
                @for (e of r.errors; track e.line) { <li><span class="mono">L{{ e.line }}</span> {{ e.message }}</li> }
              </ul>
            </details>
          }
          <div class="card__footer">
            <span class="text-2">Fechas de proceso detectadas:</span>
            <span class="chips">
              @for (d of r.processDates; track d) { <span class="chip chip--primary"><app-icon name="calendar" [size]="13" /> {{ d }}</span> }
            </span>
            <span class="toolbar__spacer"></span>
            <button type="button" class="btn" (click)="reset()">Cargar otro archivo</button>
            <button type="button" class="btn btn--primary" (click)="goToProcess(r)">Ir a procesar <app-icon name="arrow-right" [size]="16" /></button>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .dropzone { display: grid; justify-items: center; gap: .35rem; padding: 3rem 1.5rem; text-align: center; cursor: pointer; border: 2px dashed var(--border-strong); border-radius: var(--radius); background: var(--surface); transition: border-color .15s, background .15s, transform .15s; }
    .dropzone:hover, .dropzone:focus-visible { border-color: var(--primary); outline: none; }
    .dropzone--active { border-color: var(--primary); background: var(--primary-soft); transform: scale(1.005); }
    .dropzone__icon { width: 60px; height: 60px; border-radius: 18px; display: grid; place-items: center; background: var(--primary-soft); color: var(--primary); margin-bottom: .5rem; }
    .dropzone__title { font-weight: 600; font-size: 1.05rem; }
    .link { color: var(--primary); text-decoration: underline; text-underline-offset: 3px; }

    .sample { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; padding: 1rem 1.25rem; background: linear-gradient(90deg, var(--primary-soft), var(--surface) 60%); }
    .sample__icon { width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center; background: var(--surface); color: var(--primary); box-shadow: var(--shadow-sm); }
    .sample__text { display: grid; gap: .1rem; flex: 1; min-width: 240px; font-size: .9rem; }
    .sample__text span { font-size: .82rem; }
    .sample__actions { display: flex; gap: .5rem; flex-wrap: wrap; }
    .sample__actions a { text-decoration: none; }

    .filecard { display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 1rem 1.25rem; }
    .filecard__icon { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; background: var(--primary-soft); color: var(--primary); }
    .filecard__meta { display: grid; gap: .1rem; min-width: 0; }
    .filecard__meta strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .filecard__meta span { font-size: .85rem; }

    .legend { display: inline-flex; align-items: center; gap: .5rem; font-size: .82rem; }
    .legend__swatch { width: 14px; height: 14px; border-radius: 4px; background: var(--danger-soft); box-shadow: inset 2px 0 0 var(--danger); }

    .result h2 { display: inline-flex; align-items: center; gap: .5rem; color: var(--success); }
    .stats { display: flex; gap: .75rem; flex-wrap: wrap; }
    .errors { margin-top: 1rem; font-size: .9rem; }
    .errors summary { cursor: pointer; color: var(--warning-ink); font-weight: 500; }
    .errors ul { margin: .5rem 0 0; padding-left: 1.2rem; display: grid; gap: .25rem; }

    @media (max-width: 720px) {
      .filecard { grid-template-columns: auto 1fr; }
      .filecard .checklist, .filecard .btn { grid-column: 1 / -1; }
    }
  `,
})
export class UploadComponent {
  private readonly api = inject(CommerceApiService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  /** CSV de ejemplo servido como asset estático (frontend/public/samples). */
  protected readonly sampleName = 'commerce_16102026.csv';
  protected readonly sampleUrl = `samples/${this.sampleName}`;
  protected readonly loadingSample = signal(false);

  protected readonly file = signal<File | null>(null);
  protected readonly preview = signal<CsvPreview | null>(null);
  protected readonly dragging = signal(false);
  protected readonly sending = signal(false);
  protected readonly result = signal<UploadResult | null>(null);

  /** Checklist de validación local (nombre, filas, columnas). */
  protected readonly checks = computed<Check[]>(() => {
    const f = this.file();
    const p = this.preview();
    if (!f || !p) return [];
    const missing = missingColumns(p.headers);
    return [
      { label: 'Nombre commerce_DDMMYYYY.csv', ok: FILE_NAME_PATTERN.test(f.name) },
      { label: p.totalRows > 0 ? `${p.totalRows} fila(s) de datos` : 'El archivo no tiene filas', ok: p.totalRows > 0 },
      { label: missing.length ? `Faltan columnas: ${missing.join(', ')}` : 'Todas las columnas requeridas', ok: missing.length === 0 },
    ];
  });

  protected readonly canSend = computed(() => this.checks().length > 0 && this.checks().every((c) => c.ok));

  /** Filas de la previsualización que incumplirían las reglas del stored procedure. */
  protected readonly suspectCount = computed(() => {
    const p = this.preview();
    if (!p || missingColumns(p.headers).length) return 0;
    return p.rows.filter((r) => rowIssues(r, p.headers).length > 0).length;
  });

  protected isBadCell(header: string, row: string[], headers: string[]): boolean {
    if (header !== 'pc_nomcomred' && header !== 'pc_numdoc') return false;
    const key = header === 'pc_nomcomred' ? 'nomcomred' : 'numdoc';
    return rowIssues(row, headers).some((i) => i.startsWith(key));
  }

  protected cellTitle(header: string, row: string[], headers: string[]): string | null {
    return this.isBadCell(header, row, headers)
      ? rowIssues(row, headers).filter((i) => i.startsWith(header.replace('pc_', ''))).join(', ')
      : null;
  }

  protected onInputChange(input: HTMLInputElement): void {
    const f = input.files?.[0];
    if (f) void this.load(f);
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const f = event.dataTransfer?.files?.[0];
    if (f) void this.load(f);
  }

  protected send(): void {
    const f = this.file();
    if (!f || !this.canSend() || this.sending()) return;

    this.sending.set(true);
    this.api
      .upload(f)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe((res) => {
        this.result.set(res);
        this.notify.success(`${res.insertedRows} registros insertados en commerce.`);
      });
  }

  /** Descarga el CSV de ejemplo y lo carga en la previsualización como si el usuario lo hubiera elegido. */
  protected async loadSample(): Promise<void> {
    this.loadingSample.set(true);
    try {
      const res = await fetch(this.sampleUrl);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      await this.load(new File([blob], this.sampleName, { type: 'text/csv' }));
    } catch {
      this.notify.error('No se pudo cargar el archivo de ejemplo.');
    } finally {
      this.loadingSample.set(false);
    }
  }

  protected reset(): void {
    this.file.set(null);
    this.preview.set(null);
    this.result.set(null);
  }

  protected goToProcess(r: UploadResult): void {
    void this.router.navigate(['/process'], { queryParams: { date: r.processDates[0] ?? null } });
  }

  private async load(f: File): Promise<void> {
    if (!/\.csv$/i.test(f.name)) {
      this.notify.error('Seleccione un archivo con extensión .csv.');
      return;
    }
    this.result.set(null);
    this.file.set(f);
    const text = await f.text();
    this.preview.set(parseCsvPreview(text, PREVIEW_ROWS));
  }
}
