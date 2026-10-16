import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../models/commerce.models';

const STORAGE_KEY = 'iroute.session';

interface Session {
  token: string;
  username: string;
  expiresAtUtc: string;
}

/** Sesión de usuario basada en JWT. El token se persiste en sessionStorage. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(this.restore());

  readonly isAuthenticated = computed(() => {
    const s = this.session();
    return !!s && new Date(s.expiresAtUtc).getTime() > Date.now();
  });
  readonly username = computed(() => this.session()?.username ?? null);

  get token(): string | null {
    return this.session()?.token ?? null;
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(tap((res) => this.persist({ token: res.token, username: res.username, expiresAtUtc: res.expiresAtUtc })));
  }

  logout(): void {
    this.session.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
    void this.router.navigate(['/login']);
  }

  private persist(session: Session): void {
    this.session.set(session);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* almacenamiento no disponible */
    }
  }

  private restore(): Session | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }
}
