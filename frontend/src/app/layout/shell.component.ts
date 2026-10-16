import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { IconComponent } from '../shared/components/icon.component';

/** Estructura principal: barra superior con el flujo en 3 pasos + contenido de la ruta activa. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <header class="topbar">
      <div class="topbar__inner">
        <a routerLink="/" class="brand" aria-label="i-Route, inicio">
          <span class="brand__mark" aria-hidden="true"></span>
          <span class="brand__text">i-Route<small>Comercios</small></span>
        </a>

        <nav class="steps" aria-label="Flujo de trabajo">
          @for (s of steps; track s.path; let i = $index) {
            <a [routerLink]="s.path" routerLinkActive="is-active" class="step" [attr.aria-label]="'Paso ' + (i + 1) + ': ' + s.label">
              <span class="step__num">{{ i + 1 }}</span>
              <span class="step__label"><app-icon [name]="s.icon" [size]="16" />{{ s.label }}</span>
            </a>
            @if (i < steps.length - 1) { <span class="step__sep" aria-hidden="true"></span> }
          }
        </nav>

        <div class="user">
          <span class="user__avatar" aria-hidden="true">{{ initials() }}</span>
          <span class="user__name">{{ auth.username() }}</span>
          <button type="button" class="btn btn--ghost btn--sm" (click)="auth.logout()">
            <app-icon name="logout" [size]="16" /> Salir
          </button>
        </div>
      </div>
    </header>

    <main class="content">
      <router-outlet />
    </main>

    <footer class="footer muted">Reto técnico i-Route · .NET 10 · Angular 19 · SQL Server 2022</footer>
  `,
  styles: `
    .topbar { position: sticky; top: 0; z-index: 20; background: color-mix(in srgb, var(--surface) 85%, transparent); backdrop-filter: saturate(1.4) blur(10px); border-bottom: 1px solid var(--border); }
    .topbar__inner { max-width: 1240px; margin: 0 auto; padding: .65rem 1.5rem; display: flex; align-items: center; gap: 1.5rem; }
    .brand { display: flex; align-items: center; gap: .6rem; color: var(--text); text-decoration: none; }
    .brand__mark { width: 26px; height: 26px; border-radius: 50%; background: conic-gradient(#e94e1b, #f6a71b, #2a9d8f, #4b3f9f, #e94e1b); box-shadow: inset 0 0 0 5px var(--surface); }
    .brand__text { font-weight: 700; font-size: 1.1rem; letter-spacing: -.02em; display: flex; flex-direction: column; line-height: 1.05; }
    .brand__text small { font-weight: 500; font-size: .7rem; color: var(--muted); letter-spacing: .08em; text-transform: uppercase; }

    .steps { display: flex; align-items: center; gap: .35rem; margin: 0 auto; }
    .step { display: inline-flex; align-items: center; gap: .55rem; padding: .4rem .8rem .4rem .45rem; border-radius: 999px; text-decoration: none; color: var(--text-2); font-weight: 500; font-size: .9rem; transition: background .15s, color .15s; }
    .step:hover { background: var(--surface-3); color: var(--text); }
    .step__num { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-size: .75rem; font-weight: 700; background: var(--surface-3); color: var(--text-2); transition: inherit; }
    .step__label { display: inline-flex; align-items: center; gap: .4rem; }
    .step.is-active { background: var(--primary-soft); color: var(--primary-ink); }
    .step.is-active .step__num { background: var(--primary); color: #fff; }
    .step__sep { width: 18px; height: 1px; background: var(--border-strong); }

    .user { display: flex; align-items: center; gap: .6rem; }
    .user__avatar { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(135deg, var(--primary), var(--accent)); color: #fff; font-size: .75rem; font-weight: 700; }
    .user__name { font-size: .9rem; color: var(--text-2); }

    .content { max-width: 1240px; margin: 0 auto; padding: 1.75rem 1.5rem 2.5rem; }
    .footer { max-width: 1240px; margin: 0 auto; padding: 0 1.5rem 1.5rem; font-size: .78rem; }

    @media (max-width: 900px) {
      .topbar__inner { flex-wrap: wrap; gap: .75rem 1rem; }
      .steps { order: 3; width: 100%; justify-content: space-between; margin: 0; }
      .step__sep { display: none; }
      .step__label { display: none; }
      .step.is-active .step__label { display: inline-flex; }
      .user__name { display: none; }
      .content { padding: 1.25rem 1rem 2rem; }
    }
  `,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);

  protected readonly steps = [
    { path: '/upload', label: 'Cargar archivo', icon: 'upload' },
    { path: '/process', label: 'Procesar', icon: 'play' },
    { path: '/quarantine', label: 'Cuarentena', icon: 'shield' },
  ];

  protected initials(): string {
    return (this.auth.username() ?? '?').slice(0, 2).toUpperCase();
  }
}
