import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'live' },
      {
        path: 'live',
        loadComponent: () =>
          import('./features/live-tv/live-tv.component').then((m) => m.LiveTvComponent),
      },
      {
        path: 'movies',
        loadComponent: () =>
          import('./features/movies/movies.component').then((m) => m.MoviesComponent),
      },
      {
        path: 'series',
        loadComponent: () =>
          import('./features/series/series.component').then((m) => m.SeriesComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
