import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ProblemDetails } from '../models/commerce.models';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Centraliza el manejo de errores HTTP: traduce ProblemDetails a un mensaje
 * legible, notifica al usuario y cierra sesión ante un 401.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const problem = (err.error ?? {}) as ProblemDetails;
      const isLogin = req.url.endsWith('/auth/login');

      if (isLogin) {
        // La pantalla de login muestra su propio mensaje; no duplicar con un toast.
      } else if (err.status === 401) {
        auth.logout();
        notify.error('Su sesión expiró. Inicie sesión nuevamente.');
      } else if (err.status === 0) {
        notify.error('No se pudo conectar con el servidor.');
      } else {
        notify.error(problem.detail ?? problem.title ?? `Error ${err.status}`);
      }

      return throwError(() => err);
    }),
  );
};
