import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/** Rutas con carga diferida (lazy) por pantalla. */
export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · i-Route',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'upload' },
      {
        path: 'upload',
        title: 'Cargar archivo · i-Route',
        loadComponent: () => import('./features/upload/upload.component').then((m) => m.UploadComponent),
      },
      {
        path: 'process',
        title: 'Procesar · i-Route',
        loadComponent: () => import('./features/process/process.component').then((m) => m.ProcessComponent),
      },
      {
        path: 'quarantine',
        title: 'Cuarentena · i-Route',
        loadComponent: () => import('./features/quarantine/quarantine.component').then((m) => m.QuarantineComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
