import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'users',
    loadComponent: () =>
      import('@n2f/features-users').then((m) => m.UserListComponent),
  },
  {
    path: 'users/:id',
    loadComponent: () =>
      import('@n2f/features-users').then((m) => m.UserProfileComponent),
  },
  {
    path: 'expenses',
    loadComponent: () =>
      import('@n2f/features-expenses').then((m) => m.ExpenseListComponent),
  },
  {
    path: 'expense-reports',
    loadComponent: () =>
      import('@n2f/features-expenses').then((m) => m.ExpenseReportsListComponent),
  },
  {
    path: '',
    redirectTo: '/users',
    pathMatch: 'full',
  },
];
