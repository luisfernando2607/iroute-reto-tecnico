import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="login">
      <aside class="hero">
        <div class="hero__brand">
          <span class="hero__mark" aria-hidden="true"></span>
          <span>i-Route</span>
        </div>
        <h1>Carga y validación de comercios</h1>
        <p>Suba el archivo diario, procese la fecha y revise en segundos qué registros quedaron en cuarentena y por qué.</p>
        <ol class="hero__steps">
          <li><app-icon name="upload" [size]="16" /> Cargar <code>commerce_DDMMYYYY.csv</code></li>
          <li><app-icon name="play" [size]="16" /> Procesar por fecha</li>
          <li><app-icon name="shield" [size]="16" /> Revisar cuarentena y motivos</li>
        </ol>
        <a class="hero__sample" href="samples/commerce_16102026.csv" download="commerce_16102026.csv">
          <app-icon name="download" [size]="15" /> Descargar CSV de ejemplo para la prueba
        </a>
      </aside>

      <form class="panel" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h2>Iniciar sesión</h2>
        <p class="muted">Ingrese sus credenciales para continuar.</p>

        <label class="field" [class.field--error]="showError('username')">
          <span>Usuario</span>
          <input type="text" formControlName="username" autocomplete="username" placeholder="admin" autofocus />
          @if (showError('username')) { <span class="field__error">Ingrese su usuario.</span> }
        </label>

        <label class="field" [class.field--error]="showError('password')">
          <span>Contraseña</span>
          <span class="input-group">
            <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" placeholder="••••••••" />
            <button type="button" class="btn btn--icon input-group__btn" (click)="showPassword.set(!showPassword())"
                    [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'" tabindex="-1">
              <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="17" />
            </button>
          </span>
          @if (showError('password')) { <span class="field__error">Ingrese su contraseña.</span> }
        </label>

        @if (error()) {
          <div class="alert alert--warning" role="alert"><app-icon name="alert" [size]="18" /> {{ error() }}</div>
        }

        <button type="submit" class="btn btn--primary btn--block" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> Ingresando… } @else { Ingresar <app-icon name="arrow-right" [size]="16" /> }
        </button>

        <p class="muted hint"><app-icon name="lock" [size]="13" /> Demo: <code>admin</code> / <code>admin123</code></p>
      </form>
    </div>
  `,
  styles: `
    .login { min-height: 100dvh; display: grid; grid-template-columns: 1.1fr 1fr; }
    .hero { padding: 3rem; display: flex; flex-direction: column; justify-content: center; gap: 1rem; color: #fff; background: linear-gradient(150deg, #3a2f9b 0%, #5346c9 55%, #f0702a 160%); position: relative; overflow: hidden; }
    .hero::after { content: ""; position: absolute; inset: auto -20% -30% auto; width: 60%; aspect-ratio: 1; border-radius: 50%; background: rgba(255,255,255,.08); }
    .hero__brand { display: flex; align-items: center; gap: .6rem; font-weight: 700; font-size: 1.2rem; margin-bottom: 1rem; }
    .hero__mark { width: 30px; height: 30px; border-radius: 50%; background: conic-gradient(#e94e1b, #f6a71b, #2a9d8f, #d9d5ff, #e94e1b); box-shadow: inset 0 0 0 6px rgba(58, 47, 155, .9); }
    .hero h1 { font-size: 2rem; line-height: 1.15; max-width: 16ch; }
    .hero p { opacity: .85; max-width: 44ch; }
    .hero__steps { list-style: none; margin: 1rem 0 0; padding: 0; display: grid; gap: .6rem; font-size: .95rem; }
    .hero__steps li { display: flex; align-items: center; gap: .6rem; }
    .hero__steps code { background: rgba(255,255,255,.15); color: #fff; }
    .hero__sample { display: inline-flex; align-items: center; gap: .45rem; width: fit-content; margin-top: 1.25rem; padding: .5rem .9rem; border-radius: 999px; background: rgba(255,255,255,.14); color: #fff; text-decoration: none; font-size: .88rem; font-weight: 500; border: 1px solid rgba(255,255,255,.25); transition: background .15s; }
    .hero__sample:hover { background: rgba(255,255,255,.24); }

    .panel { display: grid; gap: 1rem; align-content: center; padding: 3rem; max-width: 460px; width: 100%; margin: 0 auto; background: var(--surface); }
    .panel h2 { font-size: 1.5rem; letter-spacing: -.02em; }
    .panel > p { margin-top: -.6rem; }
    .hint { display: inline-flex; align-items: center; gap: .35rem; justify-content: center; font-size: .8rem; }

    @media (max-width: 860px) {
      .login { grid-template-columns: 1fr; }
      .hero { padding: 2rem 1.5rem; min-height: 0; }
      .hero h1 { font-size: 1.5rem; }
      .hero__steps { display: none; }
      .panel { padding: 2rem 1.5rem; }
    }
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected showError(control: 'username' | 'password'): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  protected submit(): void {
    if (this.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const { username, password } = this.form.getRawValue();
    this.auth
      .login(username, password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
          void this.router.navigateByUrl(returnUrl);
        },
        error: (err) => this.error.set(err?.status === 401 ? 'Usuario o contraseña incorrectos.' : 'No se pudo iniciar sesión. Intente nuevamente.'),
      });
  }
}
